/**
 * Full Question Manager API verification test.
 * Tests: Create → Verify → Edit → Verify → Delete → Verify count
 */
require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(condition, msg) {
  if (!condition) {
    console.error('  ❌ FAIL:', msg);
    process.exit(1);
  }
  console.log('  ✅', msg);
}

(async () => {
  try {
    // ── 1. Health check ────────────────────────────────────────────────────
    console.log('\n[1] Backend health check');
    const health = await request('GET', '/health');
    assert(health.status === 200, `GET /health → ${health.status}`);
    assert(health.body.status === 'ok', 'Health response is ok');

    // ── 2. Get existing subjects ───────────────────────────────────────────
    console.log('\n[2] GET /subjects');
    const subjectsRes = await request('GET', '/subjects');
    assert(subjectsRes.status === 200, `Status 200`);
    assert(subjectsRes.body.success === true, 'success: true');
    const subjects = subjectsRes.body.data || [];
    assert(subjects.length > 0, `Found ${subjects.length} subject(s)`);

    const subject = subjects[0];
    console.log(`  Subject: "${subject.name}" (${subject._id})`);

    // ── 3. Get units for first subject ────────────────────────────────────
    console.log('\n[3] GET /units?subjectId=<id>');
    const unitsRes = await request('GET', `/units?subjectId=${subject._id}`);
    assert(unitsRes.status === 200, `Status 200`);
    const units = unitsRes.body.data || [];
    assert(units.length > 0, `Found ${units.length} unit(s)`);

    const unit = units[0];
    console.log(`  Unit: "Unit ${unit.unitNumber} — ${unit.name}" (${unit._id})`);

    // ── 4. Get questions before test ──────────────────────────────────────
    console.log('\n[4] GET /questions?unitId=<id> (before create)');
    const beforeRes = await request('GET', `/questions?unitId=${unit._id}`);
    assert(beforeRes.status === 200, `Status 200`);
    const beforeCount = (beforeRes.body.data || []).length;
    console.log(`  Questions before: ${beforeCount}`);

    // ── 5. CREATE question ────────────────────────────────────────────────
    console.log('\n[5] POST /questions (Create test question)');
    const createPayload = {
      subjectId: subject._id,
      unitId: unit._id,
      questionText: 'Explain normalization in DBMS.',
      years: [2025, 2023, 2021],
      marks: 10,
      questionType: 'theory',
      answer: 'Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.',
      source: 'AKTU PYQ',
    };
    const createRes = await request('POST', '/questions', createPayload);
    assert(createRes.status === 201, `Status 201 (got ${createRes.status}): ${JSON.stringify(createRes.body)}`);
    assert(createRes.body.success === true, 'success: true');

    const q = createRes.body.data;
    console.log(`  Created Question ID: ${q._id}`);
    assert(q.questionText === 'Explain normalization in DBMS.', 'questionText matches');
    assert(JSON.stringify(q.years) === JSON.stringify([2025, 2023, 2021]), `years = [${q.years}]`);
    assert(q.years.length === 3, `Frequency = ${q.years.length} (expected 3)`);
    assert(q.priority === 4, `Priority = ${q.priority} (expected 4)`);
    assert(q.marks === 10, `Marks = ${q.marks}`);
    assert(q.questionType === 'theory', `Type = ${q.questionType}`);

    // ── 6. Verify question appears in unit list ───────────────────────────
    console.log('\n[6] GET /questions?unitId=<id> (after create)');
    const afterCreateRes = await request('GET', `/questions?unitId=${unit._id}`);
    const afterCreateCount = (afterCreateRes.body.data || []).length;
    assert(afterCreateCount === beforeCount + 1, `Count went from ${beforeCount} → ${afterCreateCount}`);
    const found = afterCreateRes.body.data.find((x) => x._id === q._id);
    assert(!!found, 'Question appears in unit question list');

    // ── 7. GET by ID ─────────────────────────────────────────────────────
    console.log('\n[7] GET /questions/:id');
    const byIdRes = await request('GET', `/questions/${q._id}`);
    assert(byIdRes.status === 200, `Status 200`);
    assert(byIdRes.body.data._id === q._id, 'Returns correct question');

    // ── 8. EDIT question: change years to [2025, 2023] ────────────────────
    console.log('\n[8] PUT /questions/:id (Edit — years → 2025, 2023)');
    const editRes = await request('PUT', `/questions/${q._id}`, {
      questionText: 'Explain normalization in DBMS.',
      years: [2025, 2023],
      marks: 10,
      questionType: 'theory',
      answer: 'Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.',
      source: 'AKTU PYQ',
    });
    assert(editRes.status === 200, `Status 200 (got ${editRes.status}): ${JSON.stringify(editRes.body)}`);
    assert(editRes.body.success === true, 'success: true');

    const edited = editRes.body.data;
    assert(JSON.stringify(edited.years) === JSON.stringify([2025, 2023]), `years = [${edited.years}]`);
    assert(edited.years.length === 2, `Frequency = ${edited.years.length} (expected 2)`);
    assert(edited.priority === 3, `Priority = ${edited.priority} (expected 3)`);

    // ── 9. DELETE question ────────────────────────────────────────────────
    console.log('\n[9] DELETE /questions/:id');
    const deleteRes = await request('DELETE', `/questions/${q._id}`);
    assert(deleteRes.status === 200, `Status 200`);
    assert(deleteRes.body.success === true, 'success: true');
    console.log(`  Message: "${deleteRes.body.message}"`);

    // ── 10. Verify question is gone ───────────────────────────────────────
    console.log('\n[10] Verify question disappears after delete');
    const afterDeleteRes = await request('GET', `/questions?unitId=${unit._id}`);
    const afterDeleteCount = (afterDeleteRes.body.data || []).length;
    assert(afterDeleteCount === beforeCount, `Count restored to ${afterDeleteCount} (expected ${beforeCount})`);
    const stillThere = (afterDeleteRes.body.data || []).find((x) => x._id === q._id);
    assert(!stillThere, 'Question no longer in unit question list');

    // ── 11. Verify Unit questionsCount updated ────────────────────────────
    console.log('\n[11] Verify Unit.questionsCount is accurate');
    const unitAfterRes = await request('GET', `/units?subjectId=${subject._id}`);
    const unitAfter = (unitAfterRes.body.data || []).find((u) => u._id === unit._id);
    assert(unitAfter, 'Unit found in response');
    assert(
      unitAfter.questionsCount === beforeCount,
      `Unit.questionsCount = ${unitAfter.questionsCount} (expected ${beforeCount})`
    );

    console.log('\n════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED — Question Manager verified!');
    console.log('════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message || err);
    process.exit(1);
  }
})();
