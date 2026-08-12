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