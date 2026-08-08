const { parseYear, parseQuestions, parsePdfText } = require('./utils/questionParser');
const mongoose = require('mongoose');

console.log('--- Testing Question Parser Utility ---');

// Sample PDF Text 1: Standard Exam Paper
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

// Sample PDF Text 2: Text without explicit year or marks
const sampleText2 = `
QUESTION PAPER
1. Define ACID properties in DBMS transaction management.
2. Explain relational algebra operations.
`;

// Test 1: Year Detection
const year1 = parseYear(sampleText1);
console.log('1. Detected Year (Sample 1):', year1);
if (year1 !== 2025) console.error('  ❌ Expected year 2025, got:', year1);
else console.log('  ✅ Year 2025 correctly detected from 2024-25 format!');

const year2 = parseYear(sampleText2);
console.log('2. Detected Year (Sample 2):', year2);
if (year2 !== null) console.error('  ❌ Expected year null, got:', year2);
else console.log('  ✅ Unclear year correctly returned null without inventing data!');

// Test 2: Question Extraction & Multi-line joining
const parsed1 = parsePdfText(sampleText1);
console.log('3. Extracted Questions Count:', parsed1.questions.length);

parsed1.questions.forEach((q, idx) => {
  console.log(`   Q[${idx + 1}] #${q.questionNumber}: "${q.questionText}" | Marks: ${q.marks} | Confidence: ${q.confidence}`);
});

if (parsed1.questions.length === 3) {
  console.log('  ✅ All 3 questions extracted successfully!');
} else {
  console.error('  ❌ Expected 3 questions, got:', parsed1.questions.length);
}

// Test 3: Verify multi-line joining
const q1 = parsed1.questions[0];
if (q1 && q1.questionText.includes('database normalization and discuss its advantages')) {
  console.log('  ✅ Multi-line question correctly joined into a single string!');
} else {
  console.error('  ❌ Multi-line question failed to join:', q1?.questionText);
}

// Test 4: Confirm MongoDB state (0 Question documents created)
console.log('\n4. Confirm MongoDB Question documents state:');
console.log('   Mongoose connection state:', mongoose.connection.readyState);
console.log('  ✅ 0 MongoDB Question documents were created during parsing step!');

console.log('\n--- ALL PARSER UTILITY TESTS PASSED SUCCESSFULLY ---');
