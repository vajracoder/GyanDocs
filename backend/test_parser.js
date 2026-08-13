const { parseYear, parseQuestions, parsePdfText } = require("./utils/questionParser");

console.log("--- Testing Question Parser Utility ---");

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
// TEST 1: Year Detection
// ═══════════════════════════════════════════════════════════
console.log("\n1. Year Detection");
const year1 = parseYear("B.TECH (SEM V) THEORY EXAMINATION 2024-25");
assert(year1 === 2025, `Detected year 2025 from 2024-25 (got ${year1})`);

const year2 = parseYear("Some paper without year info");
assert(year2 === null, `No year returns null (got ${year2})`);

// ═══════════════════════════════════════════════════════════
// TEST 2: Basic multi-line joining (original behavior preserved)
// ═══════════════════════════════════════════════════════════
console.log("\n2. Multi-line joining (original behavior)");
const sampleText1 = `
B.TECH (SEM V) THEORY EXAMINATION 2024-25
DATABASE MANAGEMENT SYSTEMS [CS501]
Time: 3 Hours                                  Total Marks: 100
Note: Attempt all questions.

SECTION A
1. Explain the process of database
   normalization and discuss its
   advantages. [10]

2. What is a primary key? Explain candidate key
   and foreign key with suitable examples. (5 Marks)

3. Explain 3NF and BCNF with examples. [CO1/10]
`;

const parsed1 = parsePdfText(sampleText1);
assert(parsed1.questions.length === 3, `Extracted 3 questions (got ${parsed1.questions.length})`);

const q1 = parsed1.questions[0];
if (q1) {
  assert(
    q1.questionText.includes("database normalization and discuss its advantages"),
    `Multi-line joining works: "${q1.questionText}"`
  );
  assert(q1.marks === 10, `Marks [10] extracted (got ${q1.marks})`);
}

const q2 = parsed1.questions[1];
if (q2) {
  assert(q2.marks === 5, `Marks (5 Marks) extracted (got ${q2.marks})`);
}

const q3 = parsed1.questions[2];
if (q3) {
  assert(q3.marks === 10, `Marks [CO1/10] extracted (got ${q3.marks})`);
}

// ═══════════════════════════════════════════════════════════
// TEST 3: Regression — Extract ONLY actual exam questions
// ═══════════════════════════════════════════════════════════
console.log("\n3. REGRESSION: Extract only actual exam questions from sample paper");

const SAMPLE_INPUT = `Attempt any three of the following: 07 x 3 = 07
Q no. Question CO Level
a. Explain the architecture of DBMS in terms of its components with a proper
diagram. 1 K2
b. Explain Joins? Discuss all types of Joins with the help of proper example
of each. 2 K2
c. Consider the relation R (P, Q, S, T, X, Y, Z, W) with the following
functional dependencies. PQ → X; P → YX; Q → Y; Y → ZW
Consider the decomposition of the relation R into the constituent relations
according to the following two decomposition schemes.
D1 : R = [(P, Q, S, T); (P, T, X); (Q, Y); (Y, Z, W)]
D2 : R = [(P, Q, S); (T, X); (Q, Y); (Y, Z, W)]
Identify whether it is and lossy decomposition and justify your answer.
3 K4
d. Determine different types of failures in case of transactions and how it
can be recovered based on log file? Explain with suitable example. 4 K3
e. Discuss Concurrency control. Why it is needed in DBMS? Also explain
timestamp based ordering in Concurrency control. 5 K2
-- 1 of 3 -- QP25DP1_290 | 09-Jan-2025 9:05:30 AM | 117.55.242.132
QP25DP1_290 | 09-Jan-2025 9:05:30 AM | 117.55.242.132
Printed Page: 2 of 3
Subject Code: BCS501
BTECH (SEM V) THEORY EXAMINATION 2024-25
DATABASE MANAGEMENT SYSTEM`;

const parsedSample = parsePdfText(SAMPLE_INPUT);
const sampleQuestions = parsedSample.questions;
console.log(`  Extracted ${sampleQuestions.length} question(s):`);
sampleQuestions.forEach((q, i) => {
  console.log(`    [${i + 1}] ${q.questionText}`);
});

assert(sampleQuestions.length === 5, `Extracted exactly 5 questions (got ${sampleQuestions.length})`);

// Question 1
const sq1 = sampleQuestions[0];
assert(
  sq1 && sq1.questionText === "Explain the architecture of DBMS in terms of its components with a proper diagram.",
  "Q1: Correct architecture-of-DBMS question text"
);
assert(
  sq1 && !/Attempt any|Q no|07 x|CO$|Level|Printed Page|Subject Code|BTECH|THEORY EXAM|DATABASE MANAGEMENT SYSTEM|QP25DP1_\d+|Jan-2025|117\.242/.test(sq1.questionText),
  "Q1: ZERO metadata present"
);

// Question 2
const sq2 = sampleQuestions[1];
assert(
  sq2 && sq2.questionText === "Explain Joins? Discuss all types of Joins with the help of proper example of each.",
  "Q2: Correct joins question text"
);
assert(
  sq2 && !/Attempt any|Q no|07 x|CO$|Level|Printed Page|Subject Code|BTECH|THEORY EXAM|DATABASE MANAGEMENT SYSTEM|QP25DP1_\d+|Jan-2025|117\.242/.test(sq2.questionText),
  "Q2: ZERO metadata present"
);

// Question 3
const sq3 = sampleQuestions[2];
if (sq3) {
  assert(
    sq3.questionText.includes("Consider the relation R (P, Q, S, T, X, Y, Z, W)"),
    "Q3: Contains relation R definition"
  );
  assert(
    sq3.questionText.includes("PQ → X; P → YX; Q → Y; Y → ZW"),
    "Q3: Preserves functional dependencies symbolically"
  );
  assert(
    sq3.questionText.includes("D1 : R = [(P, Q, S, T); (P, T, X); (Q, Y); (Y, Z, W)]"),
    "Q3: Preserves D1 decomposition scheme"
  );
  assert(
    sq3.questionText.includes("D2 : R = [(P, Q, S); (T, X); (Q, Y); (Y, Z, W)]"),
    "Q3: Preserves D2 decomposition scheme"
  );
  assert(
    sq3.questionText.includes("Identify whether it is a lossy decomposition and justify your answer.") ||
    sq3.questionText.includes("Identify whether it is and lossy decomposition and justify your answer."),
    "Q3: Contains final lossy-decomposition sentence"
  );
  assert(
    !/Attempt any|Q no|07 x|CO$|Level|Printed Page|Subject Code|BTECH|THEORY EXAM|DATABASE MANAGEMENT SYSTEM|QP25DP1_\d+|Jan-2025|117\.242/.test(sq3.questionText),
    "Q3: ZERO metadata present"
  );
  assert(sq3.marks === 3, `Q3: marks=3 (got ${sq3.marks})`);
}

// Question 4
const sq4 = sampleQuestions[3];
assert(
  sq4 && sq4.questionText === "Determine different types of failures in case of transactions and how it can be recovered based on log file? Explain with suitable example.",
  "Q4: Correct transaction failure question text"
);
assert(
  sq4 && !/Attempt any|Q no|07 x|CO$|Level|Printed Page|Subject Code|BTECH|THEORY EXAM|DATABASE MANAGEMENT SYSTEM|QP25DP1_\d+|Jan-2025|117\.242/.test(sq4.questionText),
  "Q4: ZERO metadata present"
);

// Question 5
const sq5 = sampleQuestions[4];
assert(
  sq5 && sq5.questionText === "Discuss Concurrency control. Why it is needed in DBMS? Also explain timestamp based ordering in Concurrency control.",
  "Q5: Correct concurrency control question text"
);
assert(
  sq5 && !/Attempt any|Q no|07 x|CO$|Level|Printed Page|Subject Code|BTECH|THEORY EXAM|DATABASE MANAGEMENT SYSTEM|QP25DP1_\d+|Jan-2025|117\.242/.test(sq5.questionText),
  "Q5: ZERO metadata present"
);

// ═══════════════════════════════════════════════════════════
// TEST 4: Ensure lettered items are separate questions, not merged
// ═══════════════════════════════════════════════════════════
console.log("\n4. Lettered items become separate questions");
assert(
  sampleQuestions.every((q) => !q.subQuestions.length || q.subQuestions.length === 0),
  "All lettered top-level items are treated as separate main questions (no unwanted sub-grouping)"
);

// ═══════════════════════════════════════════════════════════
// TEST 5: Verify confidence field present for all questions
// ═══════════════════════════════════════════════════════════
console.log("\n5. Confidence scoring");
const confAllGood = sampleQuestions.every((q) => typeof q.confidence === "number" && q.confidence > 0);
assert(confAllGood, "All extracted questions have numeric confidence > 0");

// ═══════════════════════════════════════════════════════════
// TEST 6: Verify no fallback was used (real markers found → confidence ≥ 0.88)
// ═══════════════════════════════════════════════════════════
console.log("\n6. Marker-based detection confidence");
const allHighConf = sampleQuestions.every((q) => q.confidence >= 0.88);
assert(allHighConf, "All questions detected via real markers (confidence ≥ 0.88)");

// ═══════════════════════════════════════════════════════════
// TEST 7: Confirm no metadata-only line becomes a question
// ═══════════════════════════════════════════════════════════
console.log("\n7. No metadata-only lines become questions");
const metadataOnly = `Attempt any one part of the following: 07 x 1 = 07
Q no. Question CO Level
-- 2 of 3 --
Printed Page: 2 of 3
Subject Code: BCS501
BTECH (SEM V) THEORY EXAMINATION 2024-25
DATABASE MANAGEMENT SYSTEM
QP25DP1_290 | 09-Jan-2025 9:05:30 AM | 117.55.242.132`;

const parsedOnlyMeta = parsePdfText(metadataOnly);
assert(
  parsedOnlyMeta.questions.length === 0,
  "Metadata-only PDF yields zero questions (got " + parsedOnlyMeta.questions.length + ")"
);

// ═══════════════════════════════════════════════════════════
// TEST 8: Real-world AKTU-style paper (a–j, "N M" marks/CO)
// ═══════════════════════════════════════════════════════════
console.log("\n8. Real-world AKTU-style paper (a–j, two-number marks/CO)");

const REAL_WORLD_INPUT = `Attempt all questions in brief. 2 x 10 = 20

a. What is the concept of keys in database? 2 1
b. What is strong & weak entity set? 2 1
c. Explain referential integrity. 2 2
d. Explain entity integrity constraints. 2 2
e. Write different inference rule for functional dependency? 2 3
f. Why do we normalize database? 2 3
g. What do you mean by testing of serializability? 2 4
h. Define replication in distributed database. 2 4
i. Define concurrency control. 2 5
j. Define exclusive lock. 2 5

SECTION B`;

const parsedReal = parsePdfText(REAL_WORLD_INPUT);
const realQs = parsedReal.questions;
console.log(`  Extracted ${realQs.length} question(s):`);
realQs.forEach((q, i) => {
  console.log(`    [${i + 1}] text="${q.questionText}" marks=${q.marks} co=${q.co}`);
});

const expectedTexts = [
  "What is the concept of keys in database?",
  "What is strong & weak entity set?",
  "Explain referential integrity.",
  "Explain entity integrity constraints.",
  "Write different inference rule for functional dependency?",
  "Why do we normalize database?",
  "What do you mean by testing of serializability?",
  "Define replication in distributed database.",
  "Define concurrency control.",
  "Define exclusive lock.",
];

assert(realQs.length === 10, `Exactly 10 questions extracted (got ${realQs.length})`);

expectedTexts.forEach((expected, idx) => {
  const q = realQs[idx];
  assert(q && q.questionText === expected, `Q${idx + 1} text matches: "${expected}"`);
});

const marksExpected = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
marksExpected.forEach((m, idx) => {
  const q = realQs[idx];
  assert(q && q.marks === m, `Q${idx + 1} marks=${m} (got ${q && q.marks})`);
});

const coExpected = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
coExpected.forEach((c, idx) => {
  const q = realQs[idx];
  assert(q && q.co === c, `Q${idx + 1} co=${c} (got ${q && q.co})`);
});

// ZERO instruction / header / trailing metadata in any questionText
const hasMetadataInText = realQs.some((q) =>
  /Attempt all|2 x 10|SECTION [A-D]|\s\d\s\d$/.test(q.questionText)
);
assert(!hasMetadataInText, "ZERO instruction/header/trailing-marks in all questionText");

// Lettered markers f–j must be separate questions (no merge into e.)
assert(
  realQs[5] && realQs[5].questionText.startsWith("Why do we normalize"),
  "Q6 (f.) is a separate question — f–j not merged"
);
assert(
  realQs[9] && realQs[9].questionText.startsWith("Define exclusive lock"),
  "Q10 (j.) is a separate question — j. is its own entry"
);

// ═══════════════════════════════════════════════════════════
// TEST 9: Parenthesized lettered questions (a)–(g)
// ═══════════════════════════════════════════════════════════
console.log("\n9. Parenthesized lettered questions (a)–(g)");

const PAREN_INPUT = `Attempt all questions in brief. 2 x 07 = 14

(a) Define candidate key and super key with example.
(b) Differentiate TRUNCATE and DELETE command
(c) Define triggers and its types.
(d) Analyze and find the FDs in the following relation 1 2 1 3
(e) List all prime and non-prime attributes In Relation R(A,B,C,D,E) with FD set F = {AB→C, B→E, C→D}.
(f) Explain properties of Transaction.
(g) Define multiple granuality.`;

const parsedParen = parsePdfText(PAREN_INPUT);
const parenQs = parsedParen.questions;
console.log(`  Extracted ${parenQs.length} question(s):`);
parenQs.forEach((q, i) => {
  console.log(`    [${i + 1}] text="${q.questionText}"`);
});

const parenExpected = [
  "Define candidate key and super key with example.",
  "Differentiate TRUNCATE and DELETE command",
  "Define triggers and its types.",
  "Analyze and find the FDs in the following relation 1 2 1 3",
  "List all prime and non-prime attributes In Relation R(A,B,C,D,E) with FD set F = {AB→C, B→E, C→D}.",
  "Explain properties of Transaction.",
  "Define multiple granuality.",
];

assert(parenQs.length === 7, `Exactly 7 questions extracted (got ${parenQs.length})`);

parenExpected.forEach((expected, idx) => {
  const q = parenQs[idx];
  assert(q && q.questionText === expected, `Q${idx + 1} text matches: "${expected}"`);
});

// ZERO instruction / marks-instruction metadata in any questionText
const hasParenMetadata = parenQs.some((q) =>
  /Attempt all|2 x 07 = 14/.test(q.questionText)
);
assert(!hasParenMetadata, "ZERO instruction/header metadata in all questionText");

// Question (d) must PRESERVE "1 2 1 3" — it is part of the question content,
// not trailing marks/CO metadata.
assert(
  parenQs[3] && parenQs[3].questionText.includes("relation 1 2 1 3"),
  "Q4 (d) preserves '1 2 1 3' as part of the question content"
);

// (a)–(g) are separate questions (no merge)
assert(
  parenQs[0] && parenQs[0].questionText.startsWith("Define candidate key"),
  "Q1 (a) is a separate question"
);
assert(
  parenQs[6] && parenQs[6].questionText.startsWith("Define multiple granuality"),
  "Q7 (g) is a separate question — (a)–(g) not merged"
);

// ═══════════════════════════════════════════════════════════
// TEST 10: Production format — header/instruction on same line as (a) marker
// ═══════════════════════════════════════════════════════════
console.log("\n10. REGRESSION: Instruction/header immediately before (a) marker on same line");

const PROD_SAME_LINE_INPUT = `Attempt all questions in brief. 2 × 10 = 20 (a) What is the concept of keys in database? (b) What is strong & weak entity set?`;

const parsedProdSameLine = parsePdfText(PROD_SAME_LINE_INPUT);
const prodSameLineQs = parsedProdSameLine.questions;
console.log(`  Extracted ${prodSameLineQs.length} question(s):`);
prodSameLineQs.forEach((q, i) => {
  console.log(`    [${i + 1}] text="${q.questionText}"`);
});

assert(prodSameLineQs.length === 2, `Exactly 2 questions extracted (got ${prodSameLineQs.length})`);
assert(
  prodSameLineQs[0] && prodSameLineQs[0].questionText === "What is the concept of keys in database?",
  `Q1 text matches expected: "What is the concept of keys in database?" (got "${prodSameLineQs[0] ? prodSameLineQs[0].questionText : ""}")`
);
assert(
  prodSameLineQs[1] && prodSameLineQs[1].questionText === "What is strong & weak entity set?",
  `Q2 text matches expected: "What is strong & weak entity set?" (got "${prodSameLineQs[1] ? prodSameLineQs[1].questionText : ""}")`
);
assert(
  !prodSameLineQs.some((q) => /Attempt all|2 × 10 = 20/.test(q.questionText)),
  "ZERO instruction/header text in any questionText"
);

// ═══════════════════════════════════════════════════════════
// TEST 11: 10 individual 2-mark questions (a)-(j)
// ═══════════════════════════════════════════════════════════
console.log("\n11. 10 individual 2-mark questions (a)-(j)");

const TEN_2MARK = `Attempt all questions in brief. 2 x 10 = 20

a. What is the concept of keys in database? 2 1
b. What is strong & weak entity set? 2 1
c. Explain referential integrity. 2 2
d. Explain entity integrity constraints. 2 2
e. Write different inference rule for functional dependency? 2 3
f. Why do we normalize database? 2 3
g. What do you mean by testing of serializability? 2 4
h. Define replication in distributed database. 2 4
i. Define concurrency control. 2 5
j. Define exclusive lock. 2 5`;

const parsedTen = parsePdfText(TEN_2MARK);
assert(parsedTen.questions.length === 10, `Exactly 10 questions extracted (got ${parsedTen.questions.length})`);
parsedTen.questions.forEach((q, idx) => {
  assert(q.marks === 2, `Q${idx+1} marks=2 (got ${q.marks})`);
});
assert(!parsedTen.questions.some(q => /Attempt all/.test(q.questionText)), "No instruction text in any question");

// ═══════════════════════════════════════════════════════════
// TEST 12: Two 7-mark questions (a)-(b)
// ═══════════════════════════════════════════════════════════
console.log("\n12. Two 7-mark questions (a)-(b)");

const TWO_7MARK = `Attempt any one part of the following: 07 x 1 = 07

(a) Explain ER Diagram with suitable example. 7 1
(b) Explain different types of joins with example. 7 2`;

const parsedTwo7 = parsePdfText(TWO_7MARK);
assert(parsedTwo7.questions.length === 2, `Exactly 2 questions extracted (got ${parsedTwo7.questions.length})`);
parsedTwo7.questions.forEach((q, idx) => {
  assert(q.marks === 7, `Q${idx+1} marks=7 (got ${q.marks})`);
});
assert(!parsedTwo7.questions.some(q => /Attempt any/.test(q.questionText)), "No instruction text in any question");

// ═══════════════════════════════════════════════════════════
// TEST 13: Section A (10x2-mark) + Section B (7/10-mark)
// ═══════════════════════════════════════════════════════════
console.log("\n13. Section A (10x2-mark) + Section B (7/10-mark)");

const SECTIONS_INPUT = `SECTION A
Attempt all questions in brief. 2 x 10 = 20

a. What is the concept of keys in database? 2 1
b. What is strong & weak entity set? 2 1
c. Explain referential integrity. 2 2
d. Explain entity integrity constraints. 2 2
e. Write different inference rule for functional dependency? 2 3
f. Why do we normalize database? 2 3
g. What do you mean by testing of serializability? 2 4
h. Define replication in distributed database. 2 4
i. Define concurrency control. 2 5
j. Define exclusive lock. 2 5

SECTION B
Attempt any one part of the following: 07 x 1 = 07

(a) Explain ER Diagram with suitable example. 7 1
(b) Explain different types of joins with example. 7 2`;

const parsedSections = parsePdfText(SECTIONS_INPUT);
assert(parsedSections.questions.length === 12, `Exactly 12 questions extracted (got ${parsedSections.questions.length})`);

// First 10 should be 2-mark, last 2 should be 7-mark
parsedSections.questions.slice(0, 10).forEach((q, idx) => {
  assert(q.marks === 2, `Q${idx+1} marks=2 (got ${q.marks})`);
});
parsedSections.questions.slice(10).forEach((q, idx) => {
  assert(q.marks === 7, `Q${idx+11} marks=7 (got ${q.marks})`);
});

// No SECTION A/B in any questionText
assert(!parsedSections.questions.some(q => /SECTION [A-D]/.test(q.questionText)), "No SECTION A/B/C/D in any questionText");
// No instruction text
assert(!parsedSections.questions.some(q => /Attempt all|Attempt any/.test(q.questionText)), "No instruction text in any question");

// ═══════════════════════════════════════════════════════════
// TEST 14: Inline format with multiple questions on one line
// ═══════════════════════════════════════════════════════════
console.log("\n14. Inline format: multiple questions on one line");

const INLINE_INPUT = `Attempt all questions. 2 × 10 = 20 (a) What is the concept of keys in database? (b) What is strong & weak entity set? (c) Explain referential integrity.`;

const parsedInline = parsePdfText(INLINE_INPUT);
assert(parsedInline.questions.length === 3, `Exactly 3 questions extracted (got ${parsedInline.questions.length})`);
assert(
  parsedInline.questions[0] && parsedInline.questions[0].questionText === "What is the concept of keys in database?",
  `Q1 text matches: "What is the concept of keys in database?" (got "${parsedInline.questions[0] ? parsedInline.questions[0].questionText : ""}")`
);
assert(
  parsedInline.questions[1] && parsedInline.questions[1].questionText === "What is strong & weak entity set?",
  `Q2 text matches: "What is strong & weak entity set?" (got "${parsedInline.questions[1] ? parsedInline.questions[1].questionText : ""}")`
);
assert(
  parsedInline.questions[2] && parsedInline.questions[2].questionText === "Explain referential integrity.",
  `Q3 text matches: "Explain referential integrity." (got "${parsedInline.questions[2] ? parsedInline.questions[2].questionText : ""}")`
);
assert(!parsedInline.questions.some(q => /Attempt all/.test(q.questionText)), "No instruction text in any question");

// ═══════════════════════════════════════════════════════════
// TEST 15: Verify marks independently assigned per question
// ═══════════════════════════════════════════════════════════
console.log("\n15. Marks independently assigned per question");

const MIXED_MARKS = `a. Explain DBMS architecture. 2 1
b. Explain normalization with examples. 7 3
c. Discuss concurrency control. 10 4`;

const parsedMixed = parsePdfText(MIXED_MARKS);
assert(parsedMixed.questions.length === 3, `Exactly 3 questions extracted (got ${parsedMixed.questions.length})`);
assert(parsedMixed.questions[0].marks === 2, `Q1 marks=2 (got ${parsedMixed.questions[0].marks})`);
assert(parsedMixed.questions[1].marks === 7, `Q2 marks=7 (got ${parsedMixed.questions[1].marks})`);
assert(parsedMixed.questions[2].marks === 10, `Q3 marks=10 (got ${parsedMixed.questions[2].marks})`);

// ═══════════════════════════════════════════════════════════
// TEST 16: Verify classification runs independently per question
// ═══════════════════════════════════════════════════════════
console.log("\n16. Classification runs independently per question");

// Two questions from different units in the same section
const CROSS_UNIT = `a. Explain ER Diagram with suitable example. 7 1
b. Explain natural join in relational algebra. 7 2`;

const parsedCross = parsePdfText(CROSS_UNIT);
assert(parsedCross.questions.length === 2, `Exactly 2 questions extracted (got ${parsedCross.questions.length})`);
assert(
  parsedCross.questions[0].questionText.includes("ER Diagram"),
  `Q1 is ER Diagram question (got "${parsedCross.questions[0].questionText}")`
);
assert(
  parsedCross.questions[1].questionText.includes("natural join"),
  `Q2 is natural join question (got "${parsedCross.questions[1].questionText}")`
);

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log(`\n══════════════════════════════════════`);
console.log(`   PASSED: ${passed} | FAILED: ${failed}`);
console.log(`══════════════════════════════════════`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n--- ALL PARSER UTILITY TESTS PASSED SUCCESSFULLY ---");
}