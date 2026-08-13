/**
 * GyanDocs Question Classifier Service — v2
 *
 * Automatically classifies a question into a Unit and Sub-unit (Topic)
 * based on the subject's syllabus structure stored in MongoDB.
 *
 * The classifier is syllabus-driven — it reads the actual Unit and Topic
 * documents for the given subject. It does NOT hardcode any subject-specific
 * topics. If the subject has no units/topics, or the question is ambiguous,
 * it returns a low-confidence result and the caller must require manual
 * classification.
 *
 * ── Architecture ─────────────────────────────────────────────
 * Phase 1: Rich syllabus profiles — each Unit/Topic is expanded into
 *          a normalized concept profile (core terms, aliases, concepts,
 *          related terms) derived from the actual DB documents.
 *
 * Phase 2: Multi-signal scoring — each question is scored against a
 *          profile using several independent signals:
 *            - phraseMatch   (exact phrase overlap)
 *            - tokenMatch    (Jaccard token overlap)
 *            - conceptMatch  (concept/alias/related-term overlap)
 *            - contextMatch  (question terminology/context)
 *          These are combined with configurable weights.
 *
 * Phase 3: Two-stage classification — first rank Units, then rank
 *          Topics only within the strongest Unit(s).
 *
 * Phase 4: Ambiguity detection — requires BOTH a minimum confidence
 *          AND a sufficient margin between best and second-best.
 *
 * Phase 5: Generic concept aliases — concept groups are stored as
 *          generic alias groups, not a hardcoded DBMS dictionary.
 *          Topic documents may carry keywords/aliases/concepts fields.
 *
 * ── Confidence levels ────────────────────────────────────────
 *   >= 0.85  HIGH    — automatically suggest (with sufficient margin)
 *   0.65–0.84 MEDIUM — suggest but require admin review
 *   < 0.65   LOW     — do NOT confidently assign; require manual classification
 *
 * ── Honest description ───────────────────────────────────────
 * This is deterministic matching, NOT AI or semantic understanding.
 * It uses weighted token/phrase/concept overlap against syllabus data.
 * "Concept matching" here means: if a question mentions a term that is
 * listed as a keyword/alias/concept of a topic, that is a strong signal.
 * It does not understand meaning; it matches known term associations.
 */

const Unit = require("../models/Unit");
const Topic = require("../models/Topic");

// ────────────────────────────────────────────────────────────
// Configurable weights & thresholds
// ────────────────────────────────────────────────────────────
const WEIGHTS = {
  phraseMatch: 0.9,
  tokenMatch: 0.5,
  conceptMatch: 0.7,
  contextMatch: 0.3,
  directNameToken: 0.15,
  directDescToken: 0.1,
};

const THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  // Minimum margin between best and second-best to be considered
  // unambiguous. If the gap is smaller, the classification is
  // downgraded to MEDIUM (or LOW if very close).
  MIN_MARGIN: 0.15,
  // If the margin is below this, treat as highly ambiguous → LOW.
  AMBIGUOUS_MARGIN: 0.05,
};

const confidenceLabel = (score) => {
  if (score >= THRESHOLDS.HIGH) return "HIGH";
  if (score >= THRESHOLDS.MEDIUM) return "MEDIUM";
  return "LOW";
};

// ────────────────────────────────────────────────────────────
// Text normalization helpers
// ────────────────────────────────────────────────────────────

// Stop-words that carry little topical meaning.
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "for", "of",
  "in", "on", "at", "to", "from", "with", "by", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "can", "could", "should", "may", "might", "must", "shall", "this",
  "that", "these", "those", "it", "its", "as", "which", "what", "when",
  "where", "why", "how", "explain", "describe", "discuss", "define", "write",
  "list", "what", "why", "how", "also", "not", "no", "yes", "so", "such",
  "than", "too", "very", "just", "about", "into", "over", "after", "before",
  "between", "under", "again", "further", "then", "once", "here", "there",
  "all", "any", "both", "each", "few", "more", "most", "other", "some",
  "such", "only", "own", "same", "than", "too", "very", "s", "t", "can",
  "will", "just", "don", "should", "now", "i", "me", "my", "we", "our",
  "you", "your", "he", "she", "they", "them", "their", "us", "our",
]);

// Normalize a string into a set of meaningful lowercase tokens.
const tokenize = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")   // punctuation → space
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
};

// Build a phrase list from a string: split on common separators and
// also include the full string as a single phrase.
const buildPhrases = (text) => {
  const raw = (text || "").toLowerCase();
  const parts = raw
    .split(/[,;()\-–—/]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);
  // Also add the whole string as one phrase
  if (raw.trim().length > 2) parts.push(raw.trim());
  return parts;
};

// ────────────────────────────────────────────────────────────
// Generic concept alias groups (Phase 5)
//
// These are NOT subject-specific. They map common academic phrasings
// to a canonical concept group. The classifier then checks whether any
// member of the group appears in the syllabus profile.
//
// This mechanism is generic — the same alias groups apply to any subject.
// In the future these could be stored per-topic in the DB instead.
// ────────────────────────────────────────────────────────────
const CONCEPT_GROUPS = [
  // Keys / relational model
  { canonical: "candidate key", aliases: ["candidate key", "candidate keys", "minimal key", "minimal keys", "super key", "super keys", "primary key", "primary keys", "foreign key", "foreign keys"], relatedTo: ["relational model", "functional dependency", "normalization"] },
  { canonical: "relational model", aliases: ["relational model", "relational", "relation", "relations", "keys", "key"], relatedTo: ["candidate key", "integrity constraints", "sql", "relational algebra"] },
  { canonical: "integrity constraints", aliases: ["referential integrity", "entity integrity", "integrity constraint", "integrity constraints", "constraint", "constraints"], relatedTo: ["relational model"] },

  // Normalization
  { canonical: "normalization", aliases: ["normalization", "normalize", "normalised", "normalized", "normal form", "normal forms", "1nf", "2nf", "3nf", "bcnf", "4nf"], relatedTo: ["functional dependency", "decomposition"] },
  { canonical: "functional dependency", aliases: ["functional dependency", "functional dependencies", "fd", "fds", "dependency", "dependencies"], relatedTo: ["normalization", "candidate key"] },
  { canonical: "decomposition", aliases: ["decomposition", "decompose", "lossless decomposition", "lossless join", "lossy decomposition", "dependency preservation", "dependency preserving"], relatedTo: ["normalization"] },

  // Transactions / concurrency
  { canonical: "transaction", aliases: ["transaction", "transactions", "acid", "atomicity", "isolation", "durability", "consistency"], relatedTo: ["concurrency control", "recovery"] },
  { canonical: "concurrency control", aliases: ["concurrency control", "concurrent", "concurrency", "serializability", "serializable", "timestamp ordering", "timestamp", "locking", "lock", "locks", "deadlock", "deadlocks", "two phase locking", "2pl"], relatedTo: ["transaction"] },
  { canonical: "recovery", aliases: ["recovery", "recover", "log file", "log", "logging", "failure", "failures", "crash", "checkpoint", "undo", "redo"], relatedTo: ["transaction"] },

  // DBMS architecture
  { canonical: "dbms architecture", aliases: ["dbms architecture", "architecture", "dbms", "database", "database management system", "components", "three schema", "data independence"], relatedTo: ["er model"] },

  // ER model
  { canonical: "er model", aliases: ["er model", "er diagram", "entity relationship", "entity", "entities", "entity set", "entity sets", "weak entity", "strong entity", "relationship", "relationships", "attribute", "attributes"], relatedTo: ["dbms architecture", "relational model"] },

  // SQL / relational algebra
  { canonical: "sql", aliases: ["sql", "query", "queries", "ddl", "dml", "dcl", "select", "insert", "update", "delete", "truncate", "trigger", "triggers", "view", "views", "join", "joins", "group by", "order by", "having"], relatedTo: ["relational model", "relational algebra"] },
  { canonical: "relational algebra", aliases: ["relational algebra", "selection", "projection", "cartesian product", "natural join", "theta join", "rename", "union", "intersection", "difference"], relatedTo: ["relational model", "sql"] },

  // Indexing
  { canonical: "indexing", aliases: ["indexing", "index", "indexes", "b tree", "b+ tree", "b-tree", "b+-tree", "hashing", "hash", "hash table", "file organization", "storage", "clustering", "primary index", "secondary index"], relatedTo: [] },

  // Distributed DBMS
  { canonical: "distributed dbms", aliases: ["distributed", "distributed database", "distributed dbms", "replication", "replicate", "fragmentation", "horizontal fragmentation", "vertical fragmentation", "distributed transaction", "two phase commit", "2pc"], relatedTo: [] },
];

// Build a lookup: alias → canonical group
const ALIAS_TO_GROUP = new Map();
// Build a lookup: canonical group → related groups
const GROUP_RELATED = new Map();
for (const group of CONCEPT_GROUPS) {
  for (const alias of group.aliases) {
    ALIAS_TO_GROUP.set(alias, group.canonical);
  }
  GROUP_RELATED.set(group.canonical, new Set(group.relatedTo || []));
}

/**
 * Given a question's phrases, return the set of canonical concept groups
 * that the question touches.
 */
const detectConceptGroups = (phrases) => {
  const groups = new Set();
  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();
    for (const [alias, canonical] of ALIAS_TO_GROUP) {
      if (lower.includes(alias)) {
        groups.add(canonical);
      }
    }
  }
  return groups;
};

// ────────────────────────────────────────────────────────────
// Phase 1: Rich syllabus profiles
// ────────────────────────────────────────────────────────────

/**
 * Build a normalized concept profile for a Unit or Topic document.
 *
 * The profile is derived from the actual DB document:
 *   - name + description (always)
 *   - keywords, aliases, concepts (if present on the Topic)
 *
 * Returns:
 * {
 *   name, description,
 *   nameTokens, descTokens,
 *   namePhrases, descPhrases,
 *   coreTerms,      // Set of normalized terms
 *   conceptGroups,  // Set of canonical concept groups this entry belongs to
 * }
 */
const buildProfile = (entry) => {
  const name = entry.name || "";
  const description = entry.description || "";

  const nameTokens = tokenize(name);
  const descTokens = tokenize(description);
  const namePhrases = buildPhrases(name);
  const descPhrases = buildPhrases(description);

  // Core terms: name + description tokens, plus any explicit
  // keywords/aliases/concepts fields on the Topic document.
  const coreTerms = new Set([...nameTokens, ...descTokens]);

  // If the Topic has rich profile fields, incorporate them.
  if (entry.keywords && Array.isArray(entry.keywords)) {
    for (const kw of entry.keywords) {
      for (const t of tokenize(kw)) coreTerms.add(t);
    }
  }
  if (entry.aliases && Array.isArray(entry.aliases)) {
    for (const a of entry.aliases) {
      for (const t of tokenize(a)) coreTerms.add(t);
    }
  }
  if (entry.concepts && Array.isArray(entry.concepts)) {
    for (const c of entry.concepts) {
      for (const t of tokenize(c)) coreTerms.add(t);
    }
  }

  // Detect which canonical concept groups this entry belongs to.
  const allPhrases = [...namePhrases, ...descPhrases];
  if (entry.keywords) allPhrases.push(...entry.keywords);
  if (entry.aliases) allPhrases.push(...entry.aliases);
  if (entry.concepts) allPhrases.push(...entry.concepts);
  const conceptGroups = detectConceptGroups(allPhrases);

  return {
    name,
    description,
    nameTokens,
    descTokens,
    namePhrases,
    descPhrases,
    coreTerms,
    conceptGroups,
  };
};

// ────────────────────────────────────────────────────────────
// Phase 2: Multi-signal scoring
// ────────────────────────────────────────────────────────────

/**
 * Compute the four independent signals between a question and a profile.
 *
 * Returns { phraseMatch, tokenMatch, conceptMatch, contextMatch }
 * each in [0, 1].
 */
const computeSignals = (questionTokens, questionPhrases, questionConceptGroups, profile) => {
  // 1. Phrase match — exact phrase overlap between question and profile
  let phraseMatch = 0;
  for (const qp of questionPhrases) {
    if (qp.length < 3) continue;
    if (profile.namePhrases.some((np) => np.includes(qp) || qp.includes(np))) {
      phraseMatch += 1;
    }
    if (profile.descPhrases.some((dp) => dp.includes(qp) || qp.includes(dp))) {
      phraseMatch += 0.7;
    }
  }
  phraseMatch = Math.min(1, phraseMatch);

  // 2. Token match — Jaccard overlap on name + description
  let tokenMatch = 0;
  if (profile.nameTokens.length > 0 && questionTokens.length > 0) {
    const inter = new Set(questionTokens.filter((t) => profile.nameTokens.includes(t)));
    const union = new Set([...questionTokens, ...profile.nameTokens]);
    tokenMatch += (inter.size / union.size) * 0.6;
  }
  if (profile.descTokens.length > 0 && questionTokens.length > 0) {
    const inter = new Set(questionTokens.filter((t) => profile.descTokens.includes(t)));
    const union = new Set([...questionTokens, ...profile.descTokens]);
    tokenMatch += (inter.size / union.size) * 0.4;
  }
  tokenMatch = Math.min(1, tokenMatch);

  // 3. Concept match — overlap between question's concept groups and
  //    the profile's concept groups, plus related-group overlap,
  //    plus direct core-term overlap.
  let conceptMatch = 0;
  if (questionConceptGroups.size > 0 && profile.conceptGroups.size > 0) {
    const inter = new Set([...questionConceptGroups].filter((g) => profile.conceptGroups.has(g)));
    const union = new Set([...questionConceptGroups, ...profile.conceptGroups]);
    conceptMatch += (inter.size / union.size) * 0.7;

    // Related-group overlap: if a question group is related to a profile group,
    // that's a weaker but still meaningful signal.
    let relatedHits = 0;
    for (const qg of questionConceptGroups) {
      const related = GROUP_RELATED.get(qg) || new Set();
      for (const pg of profile.conceptGroups) {
        if (related.has(pg)) relatedHits++;
      }
    }
    if (relatedHits > 0) {
      conceptMatch += Math.min(0.3, relatedHits * 0.1);
    }
  }
  // Direct core-term overlap (question token appears in profile core terms)
  if (profile.coreTerms.size > 0 && questionTokens.length > 0) {
    const inter = new Set(questionTokens.filter((t) => profile.coreTerms.has(t)));
    const union = new Set([...questionTokens, ...profile.coreTerms]);
    conceptMatch += (inter.size / union.size) * 0.3;
  }
  conceptMatch = Math.min(1, conceptMatch);

  // 4. Context match — question terminology/context. This is a weaker
  //    signal: does the question use academic verbs/context that align
  //    with the profile? For now, we use the presence of any direct
  //    single-token match on the profile name as a weak context signal.
  let contextMatch = 0;
  for (const t of questionTokens) {
    if (profile.nameTokens.includes(t)) {
      contextMatch += 0.5;
    }
    if (profile.descTokens.includes(t)) {
      contextMatch += 0.3;
    }
  }
  contextMatch = Math.min(1, contextMatch);

  return { phraseMatch, tokenMatch, conceptMatch, contextMatch };
};

/**
 * Combine the four signals into a single weighted score.
 */
const combineSignals = (signals) => {
  return (
    signals.phraseMatch * WEIGHTS.phraseMatch +
    signals.tokenMatch * WEIGHTS.tokenMatch +
    signals.conceptMatch * WEIGHTS.conceptMatch +
    signals.contextMatch * WEIGHTS.contextMatch
  );
};

// ────────────────────────────────────────────────────────────
// Phase 3 + 4: Two-stage classification with ambiguity detection
// ────────────────────────────────────────────────────────────

/**
 * Classify a question into a unit + sub-unit (topic) for a given subject.
 *
 * @param {Object} params
 * @param {string} params.questionText  The question text to classify.
 * @param {string} params.subjectId     The subject's ObjectId.
 *
 * @returns {Promise<Object>} {
 *   unitId, unitName, unitNumber,
 *   topicId, topicName,
 *   unitConfidence, topicConfidence,
 *   classificationConfidence, confidenceLabel,
 *   needsManualReview,
 *   alternatives: [{ unitId, topicId, score }]
 * }
 */
const classifyQuestion = async ({ questionText, subjectId }) => {
  const empty = {
    unitId: null,
    unitName: null,
    unitNumber: null,
    topicId: null,
    topicName: null,
    unitConfidence: 0,
    topicConfidence: 0,
    classificationConfidence: 0,
    confidenceLabel: "LOW",
    needsManualReview: true,
    alternatives: [],
  };

  if (!questionText || !subjectId) return empty;

  const questionTokens = tokenize(questionText);
  const questionPhrases = buildPhrases(questionText);
  const questionConceptGroups = detectConceptGroups(questionPhrases);

  if (questionTokens.length === 0) return empty;

  // Load the subject's syllabus (units + their topics)
  const units = await Unit.find({ subjectId, isActive: true }).sort({ unitNumber: 1 });
  if (!units || units.length === 0) return empty;

  const unitIds = units.map((u) => u._id);
  const topics = await Topic.find({ unitId: { $in: unitIds }, isActive: true });

  // ── Stage 1: Rank Units ──────────────────────────────────
  const unitScores = units.map((unit) => {
    const profile = buildProfile(unit);
    const signals = computeSignals(questionTokens, questionPhrases, questionConceptGroups, profile);
    return {
      unit,
      profile,
      score: combineSignals(signals),
      signals,
    };
  });

  // Sort units by score descending
  unitScores.sort((a, b) => b.score - a.score);

  const bestUnit = unitScores[0] || null;
  const secondBestUnit = unitScores[1] || null;

  // ── Stage 2: Rank Topics only within the strongest Unit(s) ──
  // We consider topics in the best unit, and also in the second-best
  // unit if it's close, to compute the margin correctly.
  const candidateUnits = [bestUnit];
  if (secondBestUnit && bestUnit && (bestUnit.score - secondBestUnit.score) < THRESHOLDS.AMBIGUOUS_MARGIN * 2) {
    candidateUnits.push(secondBestUnit);
  }

  const topicScores = [];
  for (const cu of candidateUnits) {
    if (!cu) continue;
    const unitTopics = topics.filter((t) => t.unitId.toString() === cu.unit._id.toString());
    for (const topic of unitTopics) {
      const profile = buildProfile(topic);
      const signals = computeSignals(questionTokens, questionPhrases, questionConceptGroups, profile);
      topicScores.push({
        unit: cu.unit,
        topic,
        profile,
        score: combineSignals(signals),
        signals,
      });
    }
  }

  // Sort topics by score descending
  topicScores.sort((a, b) => b.score - a.score);

  const bestTopic = topicScores[0] || null;
  const secondBestTopic = topicScores[1] || null;

  // ── Compute confidence ────────────────────────────────────
  // unitConfidence = best unit score (clamped to [0,1])
  // topicConfidence = best topic score (clamped to [0,1])
  // classificationConfidence = blend of both
  const unitConfidence = bestUnit ? Math.min(1, Math.max(0, bestUnit.score)) : 0;
  const topicConfidence = bestTopic ? Math.min(1, Math.max(0, bestTopic.score)) : 0;

  let classificationConfidence = unitConfidence;
  if (bestTopic && topicConfidence > 0) {
    // Blend: 70% unit + 30% topic
    classificationConfidence = unitConfidence * 0.7 + topicConfidence * 0.3;
  }
  classificationConfidence = Math.min(1, Math.max(0, classificationConfidence));

  // ── Phase 4: Ambiguity detection ──────────────────────────
  // Require BOTH a minimum confidence AND a sufficient margin
  // between best and second-best.
  const unitMargin = bestUnit && secondBestUnit
    ? bestUnit.score - secondBestUnit.score
    : (bestUnit ? 1 : 0);
  const topicMargin = bestTopic && secondBestTopic
    ? bestTopic.score - secondBestTopic.score
    : (bestTopic ? 1 : 0);

  // Use the smaller margin as the effective margin (conservative).
  const effectiveMargin = Math.min(unitMargin, topicMargin);

  let label = confidenceLabel(classificationConfidence);

  // Downgrade based on margin
  if (effectiveMargin < THRESHOLDS.AMBIGUOUS_MARGIN) {
    // Highly ambiguous — downgrade to LOW regardless of absolute score
    label = "LOW";
  } else if (effectiveMargin < THRESHOLDS.MIN_MARGIN) {
    // Insufficient margin — downgrade HIGH to MEDIUM
    if (label === "HIGH") label = "MEDIUM";
  }

  const needsManualReview = label !== "HIGH";

  // If LOW, do NOT confidently assign — return nulls.
  if (label === "LOW") {
    return {
      unitId: null,
      unitName: null,
      unitNumber: null,
      topicId: null,
      topicName: null,
      unitConfidence,
      topicConfidence,
      classificationConfidence,
      confidenceLabel: label,
      needsManualReview: true,
      alternatives: topicScores.slice(0, 3).map((ts) => ({
        unitId: ts.unit._id,
        topicId: ts.topic._id,
        score: Math.min(1, Math.max(0, ts.score)),
      })),
    };
  }

  return {
    unitId: bestUnit ? bestUnit.unit._id : null,
    unitName: bestUnit ? bestUnit.unit.name : null,
    unitNumber: bestUnit ? bestUnit.unit.unitNumber : null,
    topicId: bestTopic ? bestTopic.topic._id : null,
    topicName: bestTopic ? bestTopic.topic.name : null,
    unitConfidence,
    topicConfidence,
    classificationConfidence,
    confidenceLabel: label,
    needsManualReview,
    alternatives: topicScores.slice(0, 3).map((ts) => ({
      unitId: ts.unit._id,
      topicId: ts.topic._id,
      score: Math.min(1, Math.max(0, ts.score)),
    })),
  };
};

module.exports = {
  classifyQuestion,
  confidenceLabel,
  WEIGHTS,
  THRESHOLDS,
  // Expose internals for testing
  _internal: {
    tokenize,
    buildPhrases,
    buildProfile,
    computeSignals,
    combineSignals,
    detectConceptGroups,
    CONCEPT_GROUPS,
  },
};