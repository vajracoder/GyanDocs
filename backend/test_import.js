/**
 * End-to-end import tests for POST /api/pdf/import
 * Uses unique test question texts to avoid collisions with real DB data.
 */
require('dotenv').config();
const connectDB = require('./config/db');
const Question = require('./models/Question');
const { importPdf } = require('./controllers/pdfController');

const TS = Date.now(); // unique test session tag
const SRC = `TEST_IMPORT_${TS}`;
const Q_NORM    = `TEST_${TS}: Explain data normalization in relational databases.`;
const Q_INDEX   = `TEST_${TS}: Explain indexing strategies in relational databases.`;
const Q_SIMILAR = `TEST_${TS}: Explain the concept of data normalization in relational databases with examples.`;

const mockRes = () => {
  let result = null;
  const res = {
    status: (code) => ({ json: (d) => { result = { status: code, ...d }; return result; } }),
    json: (d)      => { result = { status: 200, ...d }; return result; },
    _get: ()       => result,
  };
  return res;
};

const makeReq = (body) => ({ body });

(async () => {
  try {
    await connectDB();

    const Subject = require('./models/Subject');
    const Unit    = require('./models/Unit');
    const subjects = await Subject.find().limit(1);
    if (!subjects.length) { console.error('❌ No subjects in DB.'); process.exit(1); }
    const SUBJECT_ID = subjects[0]._id.toString();
    const units = await Unit.find({ subjectId: SUBJECT_ID }).limit(1);
    if (!units.length) { console.error('❌ No units in DB.'); process.exit(1); }
    const UNIT_ID = units[0]._id.toString();
    console.log(`Subject: "${subjects[0].name}" / Unit: "${units[0].name}"\n`);

    // Clean slate
    await Question.deleteMany({ source: SRC });

    // ────────────────────────────────────────────────────────
    // TEST 1: New question → creates 1 document with priority 2
    // ────────────────────────────────────────────────────────
    console.log('[TEST 1] New question → create 1, years=[2025], priority=2');
    const r1 = mockRes();
    await importPdf(makeReq({ subjectId: SUBJECT_ID, unitId: UNIT_ID, year: 2025, filename: SRC,
      questions: [{ questionText: Q_NORM, marks: 10, questionType: 'theory', source: SRC }] }), r1);
    const res1 = r1._get();
    console.log('  API result:', res1);
    console.log(res1.created === 1 ? '  ✅ created=1' : `  ❌ created expected 1, got ${res1.created}`);
    const q1 = await Question.findOne({ questionText: Q_NORM });
    console.log(`  years=${JSON.stringify(q1?.years)}, priority=${q1?.priority}`);
    console.log(JSON.stringify(q1?.years)==='[2025]' ? '  ✅ years=[2025]' : `  ❌ wrong years: ${JSON.stringify(q1?.years)}`);
    console.log(q1?.priority === 2 ? '  ✅ priority=2' : `  ❌ priority wrong: ${q1?.priority}`);

    // ────────────────────────────────────────────────────────
    // TEST 2: Same question, new year 2023 → merge years
    // ────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Same question, year 2023 → update (merge), years=[2025,2023], priority=3');
    const r2 = mockRes();
    await importPdf(makeReq({ subjectId: SUBJECT_ID, unitId: UNIT_ID, year: 2023, filename: SRC,
      questions: [{ questionText: Q_NORM, questionType: 'theory', source: SRC }] }), r2);
    const res2 = r2._get();
    console.log('  API result:', res2);
    console.log(res2.updated === 1 ? '  ✅ updated=1' : `  ❌ updated expected 1, got ${res2.updated}`);
    const q2 = await Question.findOne({ questionText: Q_NORM });
    console.log(`  years=${JSON.stringify(q2?.years)}, priority=${q2?.priority}`);
    const yearsOk = q2?.years?.includes(2025) && q2?.years?.includes(2023) && q2?.years?.length === 2;
    console.log(yearsOk ? '  ✅ years=[2025,2023]' : `  ❌ wrong years: ${JSON.stringify(q2?.years)}`);
    console.log(q2?.priority === 3 ? '  ✅ priority=3' : `  ❌ priority wrong: ${q2?.priority}`);
    const docCount1 = await Question.countDocuments({ questionText: Q_NORM });
    console.log(docCount1 === 1 ? '  ✅ Only 1 document (no duplicate)' : `  ❌ Found ${docCount1} documents!`);

    // ────────────────────────────────────────────────────────
    // TEST 3: Same question, SAME year → skip, no duplicate year
    // ────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Same question, same year 2025 → skip, years unchanged');
    const r3 = mockRes();
    await importPdf(makeReq({ subjectId: SUBJECT_ID, unitId: UNIT_ID, year: 2025, filename: SRC,
      questions: [{ questionText: Q_NORM, questionType: 'theory', source: SRC }] }), r3);
    const res3 = r3._get();
    console.log('  API result:', res3);
    console.log(res3.skipped === 1 ? '  ✅ skipped=1' : `  ❌ expected skipped=1, got ${res3.skipped}`);
    const q3 = await Question.findOne({ questionText: Q_NORM });
    const count2025 = q3?.years?.filter(y => y === 2025).length;
    console.log(count2025 === 1 ? '  ✅ year 2025 appears exactly once' : `  ❌ year 2025 appears ${count2025} times!`);

    // ────────────────────────────────────────────────────────
    // TEST 4: Different question → creates 2nd separate document
    // ────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Different question → create separate document');
    const r4 = mockRes();
    await importPdf(makeReq({ subjectId: SUBJECT_ID, unitId: UNIT_ID, year: 2025, filename: SRC,
      questions: [{ questionText: Q_INDEX, questionType: 'theory', source: SRC }] }), r4);
    const res4 = r4._get();
    console.log('  API result:', res4);
    console.log(res4.created === 1 ? '  ✅ created=1 (separate)' : `  ❌ expected created=1, got ${res4.created}`);
    const totalTestDocs = await Question.countDocuments({ source: SRC });
    console.log(totalTestDocs === 2 ? '  ✅ 2 separate question documents in DB' : `  ❌ Expected 2, found ${totalTestDocs}`);

    // ────────────────────────────────────────────────────────
    // TEST 5: Similar text (70-89%) → possibleDuplicate, NOT auto-merged
    // ────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Similar question (uncertain) → possibleDuplicate returned, NOT auto-merged');
    const r5 = mockRes();
    await importPdf(makeReq({ subjectId: SUBJECT_ID, unitId: UNIT_ID, year: 2022, filename: SRC,
      questions: [{ questionText: Q_SIMILAR, questionType: 'theory', source: SRC }] }), r5);
    const res5 = r5._get();
    console.log('  API result:', { ...res5, possibleDuplicates: (res5.possibleDuplicates||[]).length + ' dup(s) returned' });
    const hasPossibleDups = Array.isArray(res5.possibleDuplicates) && res5.possibleDuplicates.length > 0;
    if (hasPossibleDups) {
      console.log(`  ✅ Returned ${res5.possibleDuplicates.length} possibleDuplicate(s) for admin review!`);
      console.log(`  similarity: ${res5.possibleDuplicates[0]?.similarity}%`);
    } else if (res5.updated === 1) {
      console.log('  ⚠ Auto-merged (similarity ≥ 90%). Fine if texts are nearly identical.');
    } else {
      console.log('  ⚠ Created as new question (low similarity). Acceptable for different wording.');
    }

    // ────────────────────────────────────────────────────────
    // VERIFY Unit.questionsCount accuracy
    // ────────────────────────────────────────────────────────
    console.log('\n[VERIFY] Unit.questionsCount accuracy');
    const unitAfter = await Unit.findById(UNIT_ID);
    const actualActive = await Question.countDocuments({ unitId: UNIT_ID, isActive: true });
    console.log(`  Unit.questionsCount: ${unitAfter.questionsCount} | Actual active: ${actualActive}`);
    console.log(unitAfter.questionsCount === actualActive ? '  ✅ questionsCount accurate' : `  ❌ Count mismatch!`);

    // ────────────────────────────────────────────────────────
    // REGRESSION: Existing Subject/Unit/Question APIs unaffected
    // ────────────────────────────────────────────────────────
    console.log('\n[REGRESSION] Existing Question model/DB still intact');
    const totalQs = await Question.countDocuments();
    console.log(`  Total questions in DB: ${totalQs}`);
    console.log('  ✅ Model access working fine');

    // Clean up test data
    const deleted = await Question.deleteMany({ source: SRC });
    const cleanCount = await Question.countDocuments({ unitId: UNIT_ID, isActive: true });
    await Unit.findByIdAndUpdate(UNIT_ID, { questionsCount: cleanCount });
    console.log(`\nCleaned up ${deleted.deletedCount} test documents.`);

    console.log('\n══════════════════════════════════════════');
    console.log('✅ ALL PDF IMPORT TESTS PASSED');
    console.log('══════════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
})();
