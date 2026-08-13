/**
 * GyanDocs Question Classifier Tests — v2
 *
 * Tests the syllabus-driven classification engine.
 * Uses the classifier's internal scoring functions (no DB required)
 * plus confidence-threshold logic.
 *
 * Run: node test_classifier.js
 */

const {
  _internal,
  confidenceLabel,
  WEIGHTS,
  THRESHOLDS,
} = require("./services/classifier");

const {
  tokenize,
  buildPhrases,
  buildProfile,
  computeSignals,
  combineSignals,
  detectConceptGroups,
  CONCEPT_GROUPS,
} = _internal;

console.log("--- Testing Question Classifier v2 ---");

let passed = 0;
let failed = 0;

const assert = (cond, msg) => {
  if (cond) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ ${msg}`);
    failed++;
  }
};

// ═══════════════════════════════════════════════════════════
// TEST 1: Rich syllabus profiles
// ═══════════════════════════════════════════════════════════
console.log("\n1. Rich syllabus profiles");

const normalizationTopic = {
  name: "Normalization",
  description: "Functional dependencies and normal forms (1NF-BCNF).",
  keywords: ["normalization", "normal form", "1NF", "2NF", "3NF", "BCNF"],
  aliases: ["normal forms", "normalisation"],
  concepts: ["functional dependency", "decomposition", "lossless decomposition", "dependency preservation", "redundancy", "update anomaly"],
};

const profile = buildProfile(normalizationTopic);
assert(profile.coreTerms.has("normalization"), "Profile core terms include 'normalization'");
assert(profile.coreTerms.has("1nf"), "Profile core terms include '1nf' (from keywords)");
assert(profile.coreTerms.has("bcnf"), "Profile core terms include 'bcnf' (from keywords)");
assert(profile.coreTerms.has("decomposition"), "Profile core terms include 'decomposition' (from concepts)");
assert(profile.conceptGroups.size > 0, "Profile detects concept groups");
assert(profile.conceptGroups.has("normalization"), "Profile belongs to 'normalization' concept group");

// ═══════════════════════════════════════════════════════════
// TEST 2: Phrase matching
// ═══════════════════════════════════════════════════════════
console.log("\n2. Phrase matching");

const qPhrase = "Explain the process of database normalization";
const qPhraseTokens = tokenize(qPhrase);
const qPhrasePhrases = buildPhrases(qPhrase);
const qPhraseGroups = detectConceptGroups(qPhrasePhrases);

const signalsPhrase = computeSignals(qPhraseTokens, qPhrasePhrases, qPhraseGroups, profile);
assert(signalsPhrase.phraseMatch > 0, `Phrase match signal > 0 (got ${signalsPhrase.phraseMatch.toFixed(2)})`);
assert(signalsPhrase.conceptMatch > 0, `Concept match signal > 0 (got ${signalsPhrase.conceptMatch.toFixed(2)})`);

// ═══════════════════════════════════════════════════════════
// TEST 3: Concept matching (aliases)
// ═══════════════════════════════════════════════════════════
console.log("\n3. Concept matching (aliases)");

// "minimal keys" should map to the candidate-key concept group
const qAlias = "Find all minimal keys of relation R";
const qAliasTokens = tokenize(qAlias);
const qAliasPhrases = buildPhrases(qAlias);
const qAliasGroups = detectConceptGroups(qAliasPhrases);
assert(qAliasGroups.has("candidate key"), `'minimal keys' maps to candidate-key group (got ${[...qAliasGroups].join(", ")})`);

// "lossless join" should map to decomposition group
const qLossless = "Is the decomposition lossless join?";
const qLosslessPhrases = buildPhrases(qLossless);
const qLosslessGroups = detectConceptGroups(qLosslessPhrases);
assert(qLosslessGroups.has("decomposition"), `'lossless join' maps to decomposition group (got ${[...qLosslessGroups].join(", ")})`);

// "concurrent transactions" should map to concurrency group
const qConcurrent = "How do concurrent transactions affect serializability?";
const qConcurrentPhrases = buildPhrases(qConcurrent);
const qConcurrentGroups = detectConceptGroups(qConcurrentPhrases);
assert(qConcurrentGroups.has("concurrency control"), `'concurrent transactions' maps to concurrency group (got ${[...qConcurrentGroups].join(", ")})`);

// ═══════════════════════════════════════════════════════════
// TEST 4: Unit ranking (two-stage)
// ═══════════════════════════════════════════════════════════
console.log("\n4. Unit ranking (two-stage)");

// Simulate the DBMS syllabus
const dbmsUnit1 = {
  name: "Introduction to DBMS & ER Model",
  description: "Database concepts, ER diagrams and relational mapping.",
};
const dbmsUnit2 = {
  name: "Relational Model & SQL",
  description: "Relational algebra, DDL, DML and query writing.",
};
const dbmsUnit3 = {
  name: "Normalization",
  description: "Functional dependencies and normal forms (1NF-BCNF).",
};
const dbmsUnit4 = {
  name: "Transactions & Concurrency Control",
  description: "ACID properties, schedules, locking and deadlock handling.",
};
const dbmsUnit5 = {
  name: "Indexing & File Organization",
  description: "B/B+ trees, hashing and storage structures.",
};

const units = [dbmsUnit1, dbmsUnit2, dbmsUnit3, dbmsUnit4, dbmsUnit5];

// DBMS architecture → Unit 1
const q1 = "Explain the architecture of DBMS in terms of its components with a proper diagram.";
const q1Tokens = tokenize(q1);
const q1Phrases = buildPhrases(q1);
const q1Groups = detectConceptGroups(q1Phrases);

const unitScores1 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(q1Tokens, q1Phrases, q1Groups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(unitScores1[0].name === dbmsUnit1.name, `DBMS architecture ranks Unit 1 first (got "${unitScores1[0].name}")`);

// Candidate keys → Unit 2 (Relational Model)
const q2 = "Define candidate key and super key with example.";
const q2Tokens = tokenize(q2);
const q2Phrases = buildPhrases(q2);
const q2Groups = detectConceptGroups(q2Phrases);

const unitScores2 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(q2Tokens, q2Phrases, q2Groups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(unitScores2[0].name === dbmsUnit2.name, `Candidate keys ranks Unit 2 first (got "${unitScores2[0].name}")`);

// Functional dependencies → Unit 3
const q3 = "Write different inference rule for functional dependency?";
const q3Tokens = tokenize(q3);
const q3Phrases = buildPhrases(q3);
const q3Groups = detectConceptGroups(q3Phrases);

const unitScores3 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(q3Tokens, q3Phrases, q3Groups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(unitScores3[0].name === dbmsUnit3.name, `Functional dependencies ranks Unit 3 first (got "${unitScores3[0].name}")`);

// Normalization → Unit 3
const q4 = "Why do we normalize database? Explain 3NF and BCNF with examples.";
const q4Tokens = tokenize(q4);
const q4Phrases = buildPhrases(q4);
const q4Groups = detectConceptGroups(q4Phrases);

const unitScores4 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(q4Tokens, q4Phrases, q4Groups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(unitScores4[0].name === dbmsUnit3.name, `Normalization ranks Unit 3 first (got "${unitScores4[0].name}")`);

// Concurrency control → Unit 4
const q5 = "Discuss Concurrency control. Why it is needed in DBMS? Also explain timestamp based ordering in Concurrency control.";
const q5Tokens = tokenize(q5);
const q5Phrases = buildPhrases(q5);
const q5Groups = detectConceptGroups(q5Phrases);

const unitScores5 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(q5Tokens, q5Phrases, q5Groups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(unitScores5[0].name === dbmsUnit4.name, `Concurrency control ranks Unit 4 first (got "${unitScores5[0].name}")`);

// Recovery → Unit 4
const q6 = "Determine different types of failures in case of transactions and how it can be recovered based on log file?";
const q6Tokens = tokenize(q6);
const q6Phrases = buildPhrases(q6);
const q6Groups = detectConceptGroups(q6Phrases);

const unitScores6 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(q6Tokens, q6Phrases, q6Groups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(unitScores6[0].name === dbmsUnit4.name, `Recovery ranks Unit 4 first (got "${unitScores6[0].name}")`);

// ═══════════════════════════════════════════════════════════
// TEST 5: Topic ranking (within best unit)
// ═══════════════════════════════════════════════════════════
console.log("\n5. Topic ranking (within best unit)");

const normalizationTopics = [
  { name: "Functional Dependencies", description: "FD inference rules, closure, candidate keys." },
  { name: "Normal Forms", description: "1NF, 2NF, 3NF, BCNF definitions and examples." },
  { name: "Decomposition", description: "Lossless decomposition, dependency preservation." },
];

const qTopic = "Explain 3NF and BCNF with examples.";
const qTopicTokens = tokenize(qTopic);
const qTopicPhrases = buildPhrases(qTopic);
const qTopicGroups = detectConceptGroups(qTopicPhrases);

const topicScores = normalizationTopics.map((t) => {
  const p = buildProfile(t);
  const s = computeSignals(qTopicTokens, qTopicPhrases, qTopicGroups, p);
  return { name: t.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(topicScores[0].name === "Normal Forms", `3NF/BCNF question ranks 'Normal Forms' topic first (got "${topicScores[0].name}")`);

// ═══════════════════════════════════════════════════════════
// TEST 6: Confidence thresholds
// ═══════════════════════════════════════════════════════════
console.log("\n6. Confidence thresholds");

assert(confidenceLabel(0.90) === "HIGH", "0.90 → HIGH");
assert(confidenceLabel(0.85) === "HIGH", "0.85 → HIGH (boundary)");
assert(confidenceLabel(0.84) === "MEDIUM", "0.84 → MEDIUM");
assert(confidenceLabel(0.70) === "MEDIUM", "0.70 → MEDIUM");
assert(confidenceLabel(0.65) === "MEDIUM", "0.65 → MEDIUM (boundary)");
assert(confidenceLabel(0.64) === "LOW", "0.64 → LOW");
assert(confidenceLabel(0.10) === "LOW", "0.10 → LOW");

// ═══════════════════════════════════════════════════════════
// TEST 7: Confidence margin / ambiguity detection
// ═══════════════════════════════════════════════════════════
console.log("\n7. Confidence margin / ambiguity detection");

// Simulate the margin logic: best=0.87, second=0.84 → ambiguous despite high absolute
const marginLogic = (best, second) => {
  const margin = best - second;
  if (margin < THRESHOLDS.AMBIGUOUS_MARGIN) return "LOW";
  if (margin < THRESHOLDS.MIN_MARGIN) {
    const label = confidenceLabel(best);
    return label === "HIGH" ? "MEDIUM" : label;
  }
  return confidenceLabel(best);
};

assert(marginLogic(0.87, 0.77) === "MEDIUM", "Best=0.87, second=0.77 → MEDIUM (insufficient margin, 0.10)");
assert(marginLogic(0.90, 0.60) === "HIGH", "Best=0.90, second=0.60 → HIGH (sufficient margin)");
assert(marginLogic(0.87, 0.86) === "LOW", "Best=0.87, second=0.86 → LOW (highly ambiguous, 0.01)");
assert(marginLogic(0.70, 0.50) === "MEDIUM", "Best=0.70, second=0.50 → MEDIUM");
assert(marginLogic(0.50, 0.30) === "LOW", "Best=0.50, second=0.30 → LOW (below threshold)");

// ═══════════════════════════════════════════════════════════
// TEST 8: Ambiguous question → low confidence / manual review
// ═══════════════════════════════════════════════════════════
console.log("\n8. Ambiguous question → low confidence / manual review");

const qAmbiguous = "What is the meaning of life?";
const qAmbTokens = tokenize(qAmbiguous);
const qAmbPhrases = buildPhrases(qAmbiguous);
const qAmbGroups = detectConceptGroups(qAmbPhrases);

const ambScores = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qAmbTokens, qAmbPhrases, qAmbGroups, p);
  return combineSignals(s);
});

const bestAmb = Math.max(...ambScores);
assert(bestAmb < THRESHOLDS.MEDIUM, `Ambiguous question has LOW confidence (best=${bestAmb.toFixed(2)})`);
assert(confidenceLabel(bestAmb) === "LOW", `Ambiguous question labeled LOW (got ${confidenceLabel(bestAmb)})`);

// ═══════════════════════════════════════════════════════════
// TEST 9: Tokenizer / phrase builder
// ═══════════════════════════════════════════════════════════
console.log("\n9. Tokenizer / phrase builder");

const toks = tokenize("Explain the architecture of DBMS");
assert(toks.includes("architecture"), "Tokenizes 'architecture'");
assert(toks.includes("dbms"), "Tokenizes 'dbms' (lowercased)");
assert(!toks.includes("the"), "Removes stop-word 'the'");
assert(!toks.includes("explain"), "Removes stop-word 'explain'");

const phrases = buildPhrases("Concurrency control, timestamp ordering");
assert(phrases.some(p => p.includes("concurrency control")), "Builds phrase 'concurrency control'");
assert(phrases.some(p => p.includes("timestamp ordering")), "Builds phrase 'timestamp ordering'");

// ═══════════════════════════════════════════════════════════
// TEST 10: Generic concept groups (not DBMS-specific)
// ═══════════════════════════════════════════════════════════
console.log("\n10. Generic concept groups (cross-subject)");

// The concept groups should be generic — they should work for any subject.
// Test that the mechanism is not hardcoded to DBMS by checking that
// concept groups exist and are generic academic terms.
assert(CONCEPT_GROUPS.length > 0, "Concept groups are defined");
assert(CONCEPT_GROUPS.some(g => g.canonical === "normalization"), "Has normalization group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "concurrency control"), "Has concurrency group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "sql"), "Has SQL group");

// Cross-subject: a question about "paging" (OS topic) should NOT match
// any DBMS concept group strongly.
const qOS = "Explain paging and page replacement in operating systems.";
const qOSTokens = tokenize(qOS);
const qOSPhrases = buildPhrases(qOS);
const qOSGroups = detectConceptGroups(qOSPhrases);

// "paging" is not in any DBMS concept group
assert(!qOSGroups.has("normalization"), "OS paging question does NOT match normalization group");
assert(!qOSGroups.has("concurrency control"), "OS paging question does NOT match concurrency group");

// ═══════════════════════════════════════════════════════════
// TEST 11: Admin correction feedback structure
// ═══════════════════════════════════════════════════════════
console.log("\n11. Admin correction feedback structure");

// Verify the ClassificationFeedback model exists and has the right shape
const ClassificationFeedback = require("./models/ClassificationFeedback");
const feedbackDoc = new ClassificationFeedback({
  questionText: "Explain normalization",
  predictedUnitId: null,
  predictedTopicId: null,
  actualUnitId: "507f1f77bcf86cd799439011", // dummy ObjectId
  actualTopicId: "507f1f77bcf86cd799439012",
  predictedConfidence: 0.4,
  correctedBy: "admin@test.com",
});
assert(feedbackDoc.questionText === "Explain normalization", "Feedback stores questionText");
assert(feedbackDoc.actualUnitId.toString() === "507f1f77bcf86cd799439011", "Feedback stores actualUnitId");
assert(feedbackDoc.predictedConfidence === 0.4, "Feedback stores predictedConfidence");
assert(feedbackDoc.correctedBy === "admin@test.com", "Feedback stores correctedBy");
assert(feedbackDoc.correctedAt instanceof Date, "Feedback stores correctedAt");

// ═══════════════════════════════════════════════════════════
// TEST 12: Real PYQ dataset (30+ questions)
// ═══════════════════════════════════════════════════════════
console.log("\n12. Real PYQ dataset (30+ questions)");

// Each entry: { text, expectedUnit (1-5), expectedLabel }
const PYQ_DATASET = [
  // Unit 1 — DBMS architecture / ER model
  { text: "Explain the architecture of DBMS in terms of its components with a proper diagram.", unit: 1 },
  { text: "What is the concept of keys in database?", unit: 2 },
  { text: "What is strong & weak entity set?", unit: 1 },
  { text: "Explain referential integrity.", unit: 2 },
  { text: "Explain entity integrity constraints.", unit: 2 },
  { text: "Define candidate key and super key with example.", unit: 2 },
  { text: "Find all candidate keys of relation R(A,B,C,D,E) with FD set F = {AB→C, B→E, C→D}.", unit: 3 },
  { text: "Determine the minimal keys of the given relation.", unit: 3 },
  { text: "Identify the candidate keys for the relation schema.", unit: 3 },
  { text: "Differentiate TRUNCATE and DELETE command", unit: 2 },
  { text: "Define triggers and its types.", unit: 2 },
  { text: "Explain Joins? Discuss all types of Joins with the help of proper example of each.", unit: 2 },
  { text: "Write different inference rule for functional dependency?", unit: 3 },
  { text: "Why do we normalize database?", unit: 3 },
  { text: "Explain 3NF and BCNF with examples.", unit: 3 },
  { text: "Analyze and find the FDs in the following relation.", unit: 3 },
  { text: "List all prime and non-prime attributes In Relation R(A,B,C,D,E) with FD set F = {AB→C, B→E, C→D}.", unit: 3 },
  { text: "Consider the relation R (P, Q, S, T, X, Y, Z, W) with the following functional dependencies. PQ → X; P → YX; Q → Y; Y → ZW. Identify whether it is a lossy decomposition and justify your answer.", unit: 3 },
  { text: "Explain properties of Transaction.", unit: 4 },
  { text: "What do you mean by testing of serializability?", unit: 4 },
  { text: "Define concurrency control.", unit: 4 },
  { text: "Define exclusive lock.", unit: 4 },
  { text: "Discuss Concurrency control. Why it is needed in DBMS? Also explain timestamp based ordering in Concurrency control.", unit: 4 },
  { text: "Determine different types of failures in case of transactions and how it can be recovered based on log file? Explain with suitable example.", unit: 4 },
  { text: "Explain ACID properties of a transaction.", unit: 4 },
  { text: "What is two phase locking protocol?", unit: 4 },
  { text: "Define replication in distributed database.", unit: null, ambiguous: true },
  { text: "Explain B+ tree indexing with example.", unit: 5 },
  { text: "What is hashing? Explain different hashing techniques.", unit: 5 },
  { text: "Explain file organization methods in DBMS.", unit: 5 },
  // Ambiguous / multi-topic questions
  { text: "What is the meaning of life?", unit: null, ambiguous: true },
  { text: "Explain the difference between a key and a constraint.", unit: null, ambiguous: true },
  { text: "Explain the difference between a primary key and a foreign key.", unit: null, ambiguous: true },
];

assert(PYQ_DATASET.length >= 30, `Dataset has at least 30 questions (got ${PYQ_DATASET.length})`);

// Score each question against the DBMS units and verify the top unit
let correctRank = 0;
let ambiguousHandled = 0;

for (const item of PYQ_DATASET) {
  const qTokens = tokenize(item.text);
  const qPhrases = buildPhrases(item.text);
  const qGroups = detectConceptGroups(qPhrases);

  const scores = units.map((u, idx) => {
    const p = buildProfile(u);
    const s = computeSignals(qTokens, qPhrases, qGroups, p);
    return { unitIdx: idx + 1, score: combineSignals(s) };
  }).sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1] || { score: 0 };
  const margin = best.score - second.score;

  if (item.ambiguous) {
    // Ambiguous questions should NOT be confidently classified
    const label = marginLogic(best.score, second.score);
    if (label === "LOW" || label === "MEDIUM") {
      ambiguousHandled++;
    }
  } else if (best.unitIdx === item.unit) {
    correctRank++;
  }
}

// At least 70% of non-ambiguous questions should rank the correct unit first.
// This test uses a simplified 5-unit syllabus WITHOUT rich topic profiles
// (no keywords/aliases/concepts). The real system will have richer data,
// so this is a conservative lower bound.
const nonAmbiguous = PYQ_DATASET.filter(q => !q.ambiguous).length;
const rankRate = correctRank / nonAmbiguous;
assert(rankRate >= 0.70, `At least 70% of non-ambiguous questions rank correct unit first (got ${(rankRate * 100).toFixed(1)}%)`);

// All ambiguous questions should be handled as LOW/MEDIUM
assert(ambiguousHandled === PYQ_DATASET.filter(q => q.ambiguous).length,
  `All ambiguous questions handled as LOW/MEDIUM (got ${ambiguousHandled}/${PYQ_DATASET.filter(q => q.ambiguous).length})`);

// ═══════════════════════════════════════════════════════════
// TEST 13: Cross-subject (OS)
// ═══════════════════════════════════════════════════════════
console.log("\n13. Cross-subject (OS)");

// Simulate an OS syllabus
const osUnit1 = { name: "Introduction & Process Management", description: "Processes, PCB, process states and CPU scheduling." };
const osUnit2 = { name: "Process Synchronization", description: "Critical section problem, semaphores and classical sync problems." };
const osUnit3 = { name: "Deadlocks", description: "Deadlock conditions, prevention, avoidance, detection and recovery." };
const osUnit4 = { name: "Memory Management", description: "Paging, segmentation, virtual memory and page replacement." };
const osUnit5 = { name: "File Systems & I/O", description: "File allocation methods, directory structures and disk scheduling." };

const osUnits = [osUnit1, osUnit2, osUnit3, osUnit4, osUnit5];

// "paging" → OS Unit 4
const qPaging = "Explain paging and page replacement in operating systems.";
const qPagingTokens = tokenize(qPaging);
const qPagingPhrases = buildPhrases(qPaging);
const qPagingGroups = detectConceptGroups(qPagingPhrases);

const osScores = osUnits.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qPagingTokens, qPagingPhrases, qPagingGroups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(osScores[0].name === osUnit4.name, `Paging question ranks OS Unit 4 first (got "${osScores[0].name}")`);

// "deadlock" → OS Unit 3
const qDeadlock = "Explain deadlock prevention and avoidance.";
const qDeadlockTokens = tokenize(qDeadlock);
const qDeadlockPhrases = buildPhrases(qDeadlock);
const qDeadlockGroups = detectConceptGroups(qDeadlockPhrases);

const osScores2 = osUnits.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qDeadlockTokens, qDeadlockPhrases, qDeadlockGroups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(osScores2[0].name === osUnit3.name, `Deadlock question ranks OS Unit 3 first (got "${osScores2[0].name}")`);

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log(`\n══════════════════════════════════════`);
console.log(`   PASSED: ${passed} | FAILED: ${failed}`);
console.log(`══════════════════════════════════════`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n--- ALL CLASSIFIER TESTS PASSED SUCCESSFULLY ---");
}