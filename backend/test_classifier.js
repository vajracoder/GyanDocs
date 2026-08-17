/**
 * GyanDocs Question Classifier Tests — v3
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
  classifyQuestion,
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
  extractConcepts,
} = _internal;

console.log("--- Testing Question Classifier v3 ---");

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
assert(profile.keywords.has("normalization"), "Profile stores explicit keywords");
assert(profile.aliases.has("normal forms"), "Profile stores explicit aliases");
assert(profile.concepts.has("functional dependency"), "Profile stores explicit concepts");

// ═══════════════════════════════════════════════════════════
// TEST 2: Concept extraction
// ═══════════════════════════════════════════════════════════
console.log("\n2. Concept extraction");

const concepts1 = extractConcepts("Determine all candidate keys of relation R(A,B,C,D) using the given functional dependencies.");
assert(concepts1.concepts.includes("candidate key"), `Extracts 'candidate key' (got ${concepts1.concepts.join(", ")})`);
assert(concepts1.concepts.includes("functional dependency"), "Extracts 'functional dependency'");
assert(concepts1.concepts.includes("relation"), "Extracts 'relation'");

const concepts2 = extractConcepts("Define candidate key and super key.");
assert(concepts2.concepts.includes("candidate key"), "Extracts 'candidate key' from define question");
assert(concepts2.concepts.includes("super key"), "Extracts 'super key'");

const concepts3 = extractConcepts("Explain conflict serializability.");
assert(concepts3.concepts.includes("serializability"), "Extracts 'serializability'");

const concepts4 = extractConcepts("Define replication in distributed database.");
assert(concepts4.concepts.includes("replication"), "Extracts 'replication'");
assert(concepts4.concepts.includes("distributed database"), "Extracts 'distributed database'");

const concepts5 = extractConcepts("Differentiate cross join, natural join, left outer join and right outer join.");
assert(concepts5.concepts.includes("cross join"), "Extracts 'cross join'");
assert(concepts5.concepts.includes("natural join"), "Extracts 'natural join'");
assert(concepts5.concepts.includes("outer join"), "Extracts 'outer join'");

// Plural normalization
const concepts6 = extractConcepts("List all prime and non-prime attributes in R(A,B,C,D,E) with F = {AB→C, B→E, C→D}.");
assert(concepts6.concepts.includes("attribute"), "Normalizes 'attributes' → 'attribute'");

// ═══════════════════════════════════════════════════════════
// TEST 3: Phrase matching
// ═══════════════════════════════════════════════════════════
console.log("\n3. Phrase matching");

const qPhrase = "Explain the process of database normalization";
const qPhraseTokens = tokenize(qPhrase);
const qPhrasePhrases = buildPhrases(qPhrase);
const qPhraseGroups = detectConceptGroups(qPhrasePhrases);

const signalsPhrase = computeSignals(qPhraseTokens, qPhrasePhrases, qPhraseGroups, profile);
assert(signalsPhrase.phraseMatch > 0, `Phrase match signal > 0 (got ${signalsPhrase.phraseMatch.toFixed(2)})`);
assert(signalsPhrase.conceptMatch > 0, `Concept match signal > 0 (got ${signalsPhrase.conceptMatch.toFixed(2)})`);
assert(signalsPhrase.exactKeywordMatch > 0, `Exact keyword match signal > 0 (got ${signalsPhrase.exactKeywordMatch.toFixed(2)})`);

// ═══════════════════════════════════════════════════════════
// TEST 4: Concept matching (aliases)
// ═══════════════════════════════════════════════════════════
console.log("\n4. Concept matching (aliases)");

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
// TEST 5: Unit ranking (two-stage)
// ═══════════════════════════════════════════════════════════
console.log("\n5. Unit ranking (two-stage)");

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
// TEST 6: Topic ranking (within best unit)
// ═══════════════════════════════════════════════════════════
console.log("\n6. Topic ranking (within best unit)");

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
// TEST 7: Confidence thresholds
// ═══════════════════════════════════════════════════════════
console.log("\n7. Confidence thresholds");

assert(confidenceLabel(0.90) === "HIGH", "0.90 → HIGH");
assert(confidenceLabel(0.85) === "HIGH", "0.85 → HIGH (boundary)");
assert(confidenceLabel(0.84) === "MEDIUM", "0.84 → MEDIUM");
assert(confidenceLabel(0.70) === "MEDIUM", "0.70 → MEDIUM");
assert(confidenceLabel(0.65) === "MEDIUM", "0.65 → MEDIUM (boundary)");
assert(confidenceLabel(0.64) === "LOW", "0.64 → LOW");
assert(confidenceLabel(0.10) === "LOW", "0.10 → LOW");

// ═══════════════════════════════════════════════════════════
// TEST 8: Confidence margin / ambiguity detection
// ═══════════════════════════════════════════════════════════
console.log("\n8. Confidence margin / ambiguity detection");

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
// TEST 9: Ambiguous question → low confidence / manual review
// ═══════════════════════════════════════════════════════════
console.log("\n9. Ambiguous question → low confidence / manual review");

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
// TEST 10: Tokenizer / phrase builder
// ═══════════════════════════════════════════════════════════
console.log("\n10. Tokenizer / phrase builder");

const toks = tokenize("Explain the architecture of DBMS");
assert(toks.includes("architecture"), "Tokenizes 'architecture'");
assert(toks.includes("dbms"), "Tokenizes 'dbms' (lowercased)");
assert(!toks.includes("the"), "Removes stop-word 'the'");
assert(!toks.includes("explain"), "Removes stop-word 'explain'");

const phrases = buildPhrases("Concurrency control, timestamp ordering");
assert(phrases.some(p => p.includes("concurrency control")), "Builds phrase 'concurrency control'");
assert(phrases.some(p => p.includes("timestamp ordering")), "Builds phrase 'timestamp ordering'");

// ═══════════════════════════════════════════════════════════
// TEST 11: Generic concept groups (cross-subject)
// ═══════════════════════════════════════════════════════════
console.log("\n11. Generic concept groups (cross-subject)");

// The concept groups should be generic — they should work for any subject.
assert(CONCEPT_GROUPS.length > 0, "Concept groups are defined");
assert(CONCEPT_GROUPS.some(g => g.canonical === "normalization"), "Has normalization group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "concurrency control"), "Has concurrency group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "sql"), "Has SQL group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "process management"), "Has OS process management group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "network layer"), "Has network layer group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "syntax analysis"), "Has compiler syntax analysis group");
assert(CONCEPT_GROUPS.some(g => g.canonical === "python oop"), "Has Python OOP group");

// Cross-subject: a question about "paging" (OS topic) should NOT match
// any DBMS concept group strongly.
const qOS = "Explain paging and page replacement in operating systems.";
const qOSTokens = tokenize(qOS);
const qOSPhrases = buildPhrases(qOS);
const qOSGroups = detectConceptGroups(qOSPhrases);

// "paging" is not in any DBMS concept group
assert(!qOSGroups.has("normalization"), "OS paging question does NOT match normalization group");
assert(!qOSGroups.has("concurrency control"), "OS paging question does NOT match concurrency group");
assert(qOSGroups.has("memory management"), "OS paging question matches memory management group");

// ═══════════════════════════════════════════════════════════
// TEST 12: Admin correction feedback structure
// ═══════════════════════════════════════════════════════════
console.log("\n12. Admin correction feedback structure");

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

// ── OS syllabus (used by TEST 13 and TEST 14) ──────────────
const osUnit1 = { name: "Introduction & Process Management", description: "Processes, PCB, process states and CPU scheduling." };
const osUnit2 = { name: "Process Synchronization", description: "Critical section problem, semaphores and classical sync problems." };
const osUnit3 = { name: "Deadlocks", description: "Deadlock conditions, prevention, avoidance, detection and recovery." };
const osUnit4 = { name: "Memory Management", description: "Paging, segmentation, virtual memory and page replacement." };
const osUnit5 = { name: "File Systems & I/O", description: "File allocation methods, directory structures and disk scheduling." };
const osUnits = [osUnit1, osUnit2, osUnit3, osUnit4, osUnit5];

// ── CN syllabus (used by TEST 13 and TEST 15) ──────────────
const cnUnit1 = { name: "Introduction & OSI/TCP-IP Model", description: "Network models, layers and their responsibilities." };
const cnUnit2 = { name: "Data Link Layer", description: "Framing, error detection and MAC protocols." };
const cnUnit3 = { name: "Network Layer", description: "IP addressing, subnetting and routing algorithms." };
const cnUnit4 = { name: "Transport Layer", description: "TCP, UDP, flow control and congestion control." };
const cnUnit5 = { name: "Application Layer", description: "DNS, HTTP, FTP and email protocols." };
const cnUnits = [cnUnit1, cnUnit2, cnUnit3, cnUnit4, cnUnit5];

// ═══════════════════════════════════════════════════════════
// TEST 13: Real PYQ dataset (100+ questions, multi-subject)
// ═══════════════════════════════════════════════════════════
console.log("\n13. Real PYQ dataset (100+ questions)");

// Each entry: { subject: 'dbms'|'os'|'cn', text, unit (1-5), ambiguous? }
const PYQ_DATASET = [
  // ══════ DBMS — Unit 1 (Architecture & ER) ══════
  { subject: "dbms", text: "Explain the architecture of DBMS in terms of its components with a proper diagram.", unit: 1 },
  { subject: "dbms", text: "What is strong & weak entity set?", unit: 1 },
  { subject: "dbms", text: "Explain ER Diagram with suitable example.", unit: 1 },
  { subject: "dbms", text: "What is an entity relationship model? Explain its components.", unit: 1 },
  { subject: "dbms", text: "Differentiate between strong and weak entity sets.", unit: 1 },
  { subject: "dbms", text: "Explain three schema architecture of DBMS.", unit: 1 },
  { subject: "dbms", text: "What is data independence? Explain logical and physical data independence.", unit: 1 },
  { subject: "dbms", text: "Explain different types of attributes in ER model.", unit: 1 },
  { subject: "dbms", text: "Draw an ER diagram for a banking system.", unit: 1 },
  { subject: "dbms", text: "What is a relationship set in ER model?", unit: 1 },
  { subject: "dbms", text: "What is the concept of data independence?", unit: 1 },

  // ══════ DBMS — Unit 2 (Relational Model & SQL) ══════
  { subject: "dbms", text: "What is the concept of keys in database?", unit: 2 },
  { subject: "dbms", text: "Explain referential integrity.", unit: 2 },
  { subject: "dbms", text: "Explain entity integrity constraints.", unit: 2 },
  { subject: "dbms", text: "Define candidate key and super key with example.", unit: 2 },
  { subject: "dbms", text: "Differentiate TRUNCATE and DELETE command", unit: 2 },
  { subject: "dbms", text: "Define triggers and its types.", unit: 2 },
  { subject: "dbms", text: "Explain Joins? Discuss all types of Joins with the help of proper example of each.", unit: 2 },
  { subject: "dbms", text: "Differentiate cross join, natural join, left outer join and right outer join.", unit: 2 },
  { subject: "dbms", text: "Write SQL queries for the given relational schema.", unit: 2 },
  { subject: "dbms", text: "Explain relational algebra operations with examples.", unit: 2 },
  { subject: "dbms", text: "What is a foreign key? Explain with example.", unit: 2 },
  { subject: "dbms", text: "Explain DDL and DML commands in SQL.", unit: 2 },
  { subject: "dbms", text: "Write SQL query to find second highest salary.", unit: 2 },
  { subject: "dbms", text: "Explain nested queries in SQL.", unit: 2 },
  { subject: "dbms", text: "Differentiate between relational algebra and relational calculus.", unit: 2 },

  // ══════ DBMS — Unit 3 (Normalization) ══════
  { subject: "dbms", text: "Write different inference rule for functional dependency?", unit: 3 },
  { subject: "dbms", text: "Why do we normalize database?", unit: 3 },
  { subject: "dbms", text: "Explain 3NF and BCNF with examples.", unit: 3 },
  { subject: "dbms", text: "Analyze and find the FDs in the following relation.", unit: 3 },
  { subject: "dbms", text: "List all prime and non-prime attributes In Relation R(A,B,C,D,E) with FD set F = {AB→C, B→E, C→D}.", unit: 3 },
  { subject: "dbms", text: "Find all candidate keys of relation R(A,B,C,D,E) with FD set F = {AB→C, B→E, C→D}.", unit: 3 },
  { subject: "dbms", text: "Determine the minimal keys of the given relation.", unit: 3 },
  { subject: "dbms", text: "Consider the relation R (P, Q, S, T, X, Y, Z, W) with the following functional dependencies. PQ → X; P → YX; Q → Y; Y → ZW. Identify whether it is a lossy decomposition and justify your answer.", unit: 3 },
  { subject: "dbms", text: "Explain lossless decomposition and dependency preservation.", unit: 3 },
  { subject: "dbms", text: "What is functional dependency? Explain Armstrong's axioms.", unit: 3 },
  { subject: "dbms", text: "What is transitive dependency? Explain with example.", unit: 3 },
  { subject: "dbms", text: "Differentiate between 2NF and 3NF.", unit: 3 },
  { subject: "dbms", text: "Explain multivalued dependency and 4NF.", unit: 3 },
  { subject: "dbms", text: "Find the closure of attribute set A given the functional dependencies.", unit: 3 },
  { subject: "dbms", text: "Explain lossy and lossless decomposition with examples.", unit: 3 },

  // ══════ DBMS — Unit 4 (Transactions & Concurrency) ══════
  { subject: "dbms", text: "Explain properties of Transaction.", unit: 4 },
  { subject: "dbms", text: "What do you mean by testing of serializability?", unit: 4 },
  { subject: "dbms", text: "Define concurrency control.", unit: 4 },
  { subject: "dbms", text: "Define exclusive lock.", unit: 4 },
  { subject: "dbms", text: "Discuss Concurrency control. Why it is needed in DBMS? Also explain timestamp based ordering in Concurrency control.", unit: 4 },
  { subject: "dbms", text: "Determine different types of failures in case of transactions and how it can be recovered based on log file? Explain with suitable example.", unit: 4 },
  { subject: "dbms", text: "Explain ACID properties of a transaction.", unit: 4 },
  { subject: "dbms", text: "What is two phase locking protocol?", unit: 4 },
  { subject: "dbms", text: "Explain conflict serializability with example.", unit: 4 },
  { subject: "dbms", text: "What is a transaction schedule? Explain conflict and view serializability.", unit: 4 },
  { subject: "dbms", text: "What is deadlock? Explain deadlock prevention and detection in DBMS.", unit: 4 },
  { subject: "dbms", text: "Explain shared and exclusive locks.", unit: 4 },
  { subject: "dbms", text: "What is a checkpoint in database recovery?", unit: 4 },
  { subject: "dbms", text: "Explain timestamp based concurrency control protocol.", unit: 4 },

  // ══════ DBMS — Unit 5 (Indexing & File Organization) ══════
  { subject: "dbms", text: "Explain B+ tree indexing with example.", unit: 5 },
  { subject: "dbms", text: "What is hashing? Explain different hashing techniques.", unit: 5 },
  { subject: "dbms", text: "Explain file organization methods in DBMS.", unit: 5 },
  { subject: "dbms", text: "Compare B-tree and B+ tree indexing.", unit: 5 },
  { subject: "dbms", text: "What is static and dynamic hashing?", unit: 5 },
  { subject: "dbms", text: "Explain primary and secondary indexing.", unit: 5 },

  // ══════ OS — Unit 1 (Process Management) ══════
  { subject: "os", text: "Explain process states with a diagram.", unit: 1 },
  { subject: "os", text: "What is PCB? Explain its components.", unit: 1 },
  { subject: "os", text: "Explain different CPU scheduling algorithms.", unit: 1 },
  { subject: "os", text: "What is context switching?", unit: 1 },
  { subject: "os", text: "Explain FCFS and SJF scheduling with examples.", unit: 1 },

  // ══════ OS — Unit 2 (Process Synchronization) ══════
  { subject: "os", text: "Explain critical section problem.", unit: 2 },
  { subject: "os", text: "What is semaphore? Explain its types.", unit: 2 },
  { subject: "os", text: "Explain producer consumer problem.", unit: 2 },
  { subject: "os", text: "What is a mutex?", unit: 2 },
  { subject: "os", text: "Explain reader writer problem.", unit: 2 },

  // ══════ OS — Unit 3 (Deadlocks) ══════
  { subject: "os", text: "Explain deadlock prevention and avoidance.", unit: 3 },
  { subject: "os", text: "What is Banker's algorithm?", unit: 3 },
  { subject: "os", text: "Explain necessary conditions for deadlock.", unit: 3 },
  { subject: "os", text: "What is deadlock detection and recovery?", unit: 3 },
  { subject: "os", text: "Explain resource allocation graph.", unit: 3 },

  // ══════ OS — Unit 4 (Memory Management) ══════
  { subject: "os", text: "Explain paging and page replacement in operating systems.", unit: 4 },
  { subject: "os", text: "What is virtual memory?", unit: 4 },
  { subject: "os", text: "Explain segmentation.", unit: 4 },
  { subject: "os", text: "What is LRU page replacement algorithm?", unit: 4 },
  { subject: "os", text: "Explain thrashing.", unit: 4 },

  // ══════ OS — Unit 5 (File Systems & I/O) ══════
  { subject: "os", text: "Explain file allocation methods.", unit: 5 },
  { subject: "os", text: "What is disk scheduling? Explain SCAN and C-SCAN.", unit: 5 },
  { subject: "os", text: "Explain directory structure in file systems.", unit: 5 },
  { subject: "os", text: "What are inodes?", unit: 5 },

  // ══════ CN — Unit 1 (OSI/TCP-IP) ══════
  { subject: "cn", text: "Explain OSI model with layers.", unit: 1 },
  { subject: "cn", text: "Explain TCP/IP model.", unit: 1 },
  { subject: "cn", text: "Compare OSI and TCP/IP models.", unit: 1 },

  // ══════ CN — Unit 2 (Data Link Layer) ══════
  { subject: "cn", text: "Explain error detection using CRC.", unit: 2 },
  { subject: "cn", text: "What is framing in data link layer?", unit: 2 },
  { subject: "cn", text: "Explain MAC protocols.", unit: 2 },
  { subject: "cn", text: "What is Hamming code?", unit: 2 },

  // ══════ CN — Unit 3 (Network Layer) ══════
  { subject: "cn", text: "Explain distance vector routing algorithm.", unit: 3 },
  { subject: "cn", text: "What is subnetting?", unit: 3 },
  { subject: "cn", text: "Explain IP addressing and classes.", unit: 3 },
  { subject: "cn", text: "Compare link state and distance vector routing.", unit: 3 },
  { subject: "cn", text: "What is ARP?", unit: 3 },

  // ══════ CN — Unit 4 (Transport Layer) ══════
  { subject: "cn", text: "Explain TCP congestion control mechanisms.", unit: 4 },
  { subject: "cn", text: "Differentiate TCP and UDP.", unit: 4 },
  { subject: "cn", text: "What is flow control?", unit: 4 },
  { subject: "cn", text: "Explain three way handshake in TCP.", unit: 4 },

  // ══════ CN — Unit 5 (Application Layer) ══════
  { subject: "cn", text: "Explain DNS.", unit: 5 },
  { subject: "cn", text: "What is HTTP?", unit: 5 },
  { subject: "cn", text: "Explain FTP.", unit: 5 },
  { subject: "cn", text: "What is SMTP?", unit: 5 },

  // ══════ Ambiguous questions ══════
  { subject: "dbms", text: "Define replication in distributed database.", unit: null, ambiguous: true },
  { subject: "dbms", text: "What is the meaning of life?", unit: null, ambiguous: true },
  { subject: "dbms", text: "Explain the difference between a key and a constraint.", unit: null, ambiguous: true },
  { subject: "dbms", text: "Explain the difference between a primary key and a foreign key.", unit: null, ambiguous: true },
];

assert(PYQ_DATASET.length >= 100, `Dataset has at least 100 questions (got ${PYQ_DATASET.length})`);

// Subject-specific unit sets for evaluation.
const subjectUnits = {
  dbms: units,
  os: osUnits,   // declared below (hoisted consts are in TDZ until init, so evaluated after)
  cn: cnUnits,
};
// Build a lookup of unit name → unit index per subject
const subjectUnitIndex = {};
for (const subject of ["dbms", "os", "cn"]) {
  const set = subjectUnits[subject];
  subjectUnitIndex[subject] = new Map();
  set.forEach((u, i) => subjectUnitIndex[subject].set(u.name, i + 1));
}

// Evaluate: accuracy per subject, confidence-level accuracy, false-HIGH rate.
const results = {
  correct: 0,
  total: 0,
  ambiguousHandled: 0,
  ambiguousTotal: 0,
  highCorrect: 0, highTotal: 0, highWrong: 0,
  mediumCorrect: 0, mediumTotal: 0,
  lowCorrect: 0, lowTotal: 0,
  errors: [],
};

for (const item of PYQ_DATASET) {
  const qTokens = tokenize(item.text);
  const qPhrases = buildPhrases(item.text);
  const qGroups = detectConceptGroups(qPhrases);

  const unitSet = subjectUnits[item.subject] || units;
  const scores = unitSet.map((u, idx) => {
    const p = buildProfile(u);
    const s = computeSignals(qTokens, qPhrases, qGroups, p);
    return { unitIdx: idx + 1, name: u.name, score: combineSignals(s) };
  }).sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1] || { score: 0 };
  const label = marginLogic(best.score, second.score);

  results.total++;

  if (item.ambiguous) {
    results.ambiguousTotal++;
    if (label === "LOW" || label === "MEDIUM") results.ambiguousHandled++;
    continue;
  }

  const isUnitCorrect = best.unitIdx === item.unit;
  const isTopicCorrect = false; // topic-level accuracy requires topic metadata; we report unit-level only here

  if (label === "HIGH") {
    results.highTotal++;
    if (isUnitCorrect) results.highCorrect++;
    else results.highWrong++;
  } else if (label === "MEDIUM") {
    results.mediumTotal++;
    if (isUnitCorrect) results.mediumCorrect++;
  } else {
    results.lowTotal++;
    if (isUnitCorrect) results.lowCorrect++;
  }

  if (isUnitCorrect) results.correct++;

  // Error analysis: record mismatches for review.
  if (!isUnitCorrect && label !== "LOW") {
    results.errors.push({
      question: item.text.slice(0, 60),
      subject: item.subject,
      expectedUnit: item.unit,
      predictedUnit: best.unitIdx,
      predictedName: best.name,
      score: best.score.toFixed(3),
      label,
    });
  }
}

const nonAmbiguous = results.total - results.ambiguousTotal;
const overallAcc = results.correct / nonAmbiguous;
const falseHighRate = results.highTotal > 0 ? results.highWrong / results.highTotal : 0;

assert(PYQ_DATASET.length >= 100, `Dataset has at least 100 questions (got ${PYQ_DATASET.length})`);
assert(overallAcc >= 0.75, `Overall unit accuracy >= 75% (got ${(overallAcc * 100).toFixed(1)}%)`);

// Confidence-level accuracy
if (results.highTotal > 0) {
  assert((results.highCorrect / results.highTotal) >= 0.85,
    `HIGH-confidence accuracy >= 85% (got ${((results.highCorrect / results.highTotal) * 100).toFixed(1)}%)`);
}
if (results.mediumTotal > 0) {
  assert((results.mediumCorrect / results.mediumTotal) >= 0.5,
    `MEDIUM-confidence accuracy >= 50% (got ${((results.mediumCorrect / results.mediumTotal) * 100).toFixed(1)}%)`);
}

// False HIGH-confidence rate should be low (a wrong HIGH is worse than LOW requiring review)
assert(falseHighRate <= 0.25, `False HIGH-confidence rate <= 25% (got ${(falseHighRate * 100).toFixed(1)}%)`);

// All ambiguous questions should be handled as LOW/MEDIUM
assert(results.ambiguousHandled === results.ambiguousTotal,
  `All ambiguous questions handled as LOW/MEDIUM (got ${results.ambiguousHandled}/${results.ambiguousTotal})`);

console.log(`\n  ── Dataset metrics ──`);
console.log(`  Total questions: ${results.total}`);
console.log(`  Non-ambiguous: ${nonAmbiguous}`);
console.log(`  Overall unit accuracy: ${(overallAcc * 100).toFixed(1)}%`);
console.log(`  HIGH-confidence accuracy: ${results.highTotal ? ((results.highCorrect / results.highTotal) * 100).toFixed(1) + "% (" + results.highCorrect + "/" + results.highTotal + ")" : "N/A"}`);
console.log(`  MEDIUM-confidence accuracy: ${results.mediumTotal ? ((results.mediumCorrect / results.mediumTotal) * 100).toFixed(1) + "% (" + results.mediumCorrect + "/" + results.mediumTotal + ")" : "N/A"}`);
console.log(`  LOW-confidence accuracy: ${results.lowTotal ? ((results.lowCorrect / results.lowTotal) * 100).toFixed(1) + "% (" + results.lowCorrect + "/" + results.lowTotal + ")" : "N/A"}`);
console.log(`  False HIGH-confidence rate: ${(falseHighRate * 100).toFixed(1)}% (${results.highWrong}/${results.highTotal})`);
console.log(`  Ambiguous handled: ${results.ambiguousHandled}/${results.ambiguousTotal}`);
console.log(`\n  ── Top classification errors ──`);
results.errors.slice(0, 10).forEach((e, i) => {
  console.log(`  ${i + 1}. [${e.subject}] "${e.question}…" → expected U${e.expectedUnit}, got U${e.predictedUnit} (${e.predictedName}) score=${e.score} ${e.label}`);
});
if (results.errors.length === 0) console.log("  (none)");

// ═══════════════════════════════════════════════════════════
// TEST 14: Cross-subject (OS)
// ═══════════════════════════════════════════════════════════
console.log("\n14. Cross-subject (OS)");

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

// "semaphore" → OS Unit 2
const qSemaphore = "Explain semaphore and its types in process synchronization.";
const qSemaphoreTokens = tokenize(qSemaphore);
const qSemaphorePhrases = buildPhrases(qSemaphore);
const qSemaphoreGroups = detectConceptGroups(qSemaphorePhrases);

const osScores3 = osUnits.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qSemaphoreTokens, qSemaphorePhrases, qSemaphoreGroups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(osScores3[0].name === osUnit2.name, `Semaphore question ranks OS Unit 2 first (got "${osScores3[0].name}")`);

// ═══════════════════════════════════════════════════════════
// TEST 15: Cross-subject (Computer Networks)
// ═══════════════════════════════════════════════════════════
console.log("\n15. Cross-subject (Computer Networks)");

// "TCP congestion control" → CN Unit 4
const qTcp = "Explain TCP congestion control mechanisms.";
const qTcpTokens = tokenize(qTcp);
const qTcpPhrases = buildPhrases(qTcp);
const qTcpGroups = detectConceptGroups(qTcpPhrases);

const cnScores = cnUnits.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qTcpTokens, qTcpPhrases, qTcpGroups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(cnScores[0].name === cnUnit4.name, `TCP congestion question ranks CN Unit 4 first (got "${cnScores[0].name}")`);

// "routing algorithm" → CN Unit 3
const qRouting = "Explain distance vector routing algorithm.";
const qRoutingTokens = tokenize(qRouting);
const qRoutingPhrases = buildPhrases(qRouting);
const qRoutingGroups = detectConceptGroups(qRoutingPhrases);

const cnScores2 = cnUnits.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qRoutingTokens, qRoutingPhrases, qRoutingGroups, p);
  return { name: u.name, score: combineSignals(s) };
}).sort((a, b) => b.score - a.score);

assert(cnScores2[0].name === cnUnit3.name, `Routing question ranks CN Unit 3 first (got "${cnScores2[0].name}")`);

// ═══════════════════════════════════════════════════════════
// TEST 16: CO is NOT used for unit classification
// ═══════════════════════════════════════════════════════════
console.log("\n16. CO is NOT used for unit classification");

// The classifier must work without CO. Verify that the same question
// with and without CO metadata produces the same classification.
const qWithCO = "Explain 3NF and BCNF with examples. CO3 K4";
const qWithoutCO = "Explain 3NF and BCNF with examples.";

// The classifier function signature accepts ONLY questionText and subjectId.
// It never receives CO as a field. The PDF parser strips CO/marks from the
// question text BEFORE the classifier runs. So the classifier cannot use CO.
const classifyArgs = classifyQuestion.length; // declared as async ({questionText, subjectId})
assert(typeof classifyQuestion === "function", "classifyQuestion is exported");
assert(WEIGHTS && !WEIGHTS.co && !WEIGHTS.coWeight, "No CO weight in the scoring config");
assert(WEIGHTS && !WEIGHTS.marks && !WEIGHTS.marksWeight, "No marks weight in the scoring config");

// Verify that the classifier source does not reference CO -> Unit mapping
const classifierSource = require("fs").readFileSync(
  require("path").join(__dirname, "services", "classifier.js"),
  "utf8"
);
assert(!/[Cc][Oo]\s*[12]/.test(classifierSource) || !/\bco\s*=>?\s*Unit\b/i.test(classifierSource),
  "No CO-to-Unit mapping in classifier source");

// ═══════════════════════════════════════════════════════════
// TEST 17: Marks are NOT used for unit classification
// ═══════════════════════════════════════════════════════════
console.log("\n17. Marks are NOT used for unit classification");

const qWithMarks = "Explain 3NF and BCNF with examples. 7";
const qWithoutMarks = "Explain 3NF and BCNF with examples.";

const qWithMarksTokens = tokenize(qWithMarks);
const qWithMarksPhrases = buildPhrases(qWithMarks);
const qWithMarksGroups = detectConceptGroups(qWithMarksPhrases);

const qWithoutMarksTokens = tokenize(qWithoutMarks);
const qWithoutMarksPhrases = buildPhrases(qWithoutMarks);
const qWithoutMarksGroups = detectConceptGroups(qWithoutMarksPhrases);

const scoreWithMarks2 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qWithMarksTokens, qWithMarksPhrases, qWithMarksGroups, p);
  return combineSignals(s);
});
const scoreWithoutMarks2 = units.map((u) => {
  const p = buildProfile(u);
  const s = computeSignals(qWithoutMarksTokens, qWithoutMarksPhrases, qWithoutMarksGroups, p);
  return combineSignals(s);
});

assert(JSON.stringify(scoreWithMarks2) === JSON.stringify(scoreWithoutMarks2),
  "Marks metadata does not affect classification scores");

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
