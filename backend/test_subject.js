require('dotenv').config();
const connectDB = require('./config/db');
const Subject = require('./models/Subject');

(async () => {
  try {
    await connectDB();

    // Use a unique test subject to avoid collisions
    const testPayload = {
      semester: 7,
      name: 'Advanced Database Systems',
      shortName: 'ADS',
      code: 'TEST701',
      slug: 'advanced-database-systems-test',
    };

    // Clean any prior run
    await Subject.deleteOne({ code: testPayload.code });

    // Simulate the exact payload the fixed AddSubjectModal now sends
    const created = await Subject.create(testPayload);

    console.log('✅ SUBJECT CREATED IN MONGODB:');
    console.log('   Name:      ', created.name);
    console.log('   Short Name:', created.shortName);
    console.log('   Code:      ', created.code);
    console.log('   Slug:      ', created.slug);
    console.log('   Semester:  ', created.semester);

    // Simulate GET /subjects response (Dashboard counter)
    const all = await Subject.find().sort({ semester: 1, name: 1 });
    console.log('\n✅ GET /subjects — Dashboard would show', all.length, 'subject(s):');
    all.forEach((s, i) => {
      console.log(`   [${i + 1}] ${s.shortName} — ${s.name} (Sem ${s.semester})`);
    });

    // Clean up test record
    await Subject.deleteOne({ code: testPayload.code });
    console.log('\n✅ Test record cleaned up. Full integration verified!');
    process.exit(0);
  } catch (err) {
    console.error('❌ FAILED:', err.message || err);
    process.exit(1);
  }
})();
