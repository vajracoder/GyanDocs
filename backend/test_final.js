require('dotenv').config();
const connectDB = require('./config/db');
const Subject = require('./models/Subject');
const Unit = require('./models/Unit');
const Question = require('./models/Question');
const { calculatePriority } = require('./utils/priorityHelper');

(async () => {
  try {
    await connectDB();

    let subject = await Subject.findOne();
    if (!subject) {
      subject = await Subject.create({
        semester: 3,
        name: 'Database Management Systems',
        shortName: 'DBMS',
        code: 'CS301-TEST',
        slug: 'dbms-test',
      });
    }

    let unit = await Unit.findOne({ subjectId: subject._id });
    if (!unit) {
      unit = await Unit.create({
        subjectId: subject._id,
        unitNumber: 1,
        name: 'Normalization',
        slug: 'normalization-test',
      });
    }

    console.log('1. INITIAL UNIT QUESTIONS COUNT:', unit.questionsCount);

    // Step A: Add Question (Years: 2025, 2023, 2021 -> Frequency = 3, Priority = 4)
    const yearsAdd = [2025, 2023, 2021];
    const priorityAdd = calculatePriority(yearsAdd);
    const q = await Question.create({
      subjectId: subject._id,
      unitId: unit._id,
      questionText: 'Explain normalization in DBMS.',
      years: yearsAdd,
      priority: priorityAdd,
      marks: 10,
      questionType: 'theory',
    });

    const count1 = await Question.countDocuments({ unitId: unit._id, isActive: true });
    unit = await Unit.findByIdAndUpdate(unit._id, { questionsCount: count1 }, { new: true });

    console.log('2. CREATED QUESTION:', {
      id: q._id,
      text: q.questionText,
      years: q.years,
      frequency: q.years.length,
      priority: q.priority,
      unitQuestionsCount: unit.questionsCount,
    });

    // Step B: Edit Question (Years: 2025, 2023 -> Frequency = 2, Priority = 3)
    const yearsEdit = [2025, 2023];
    const priorityEdit = calculatePriority(yearsEdit);
    const qUpdated = await Question.findByIdAndUpdate(
      q._id,
      { years: yearsEdit, priority: priorityEdit },
      { new: true }
    );

    console.log('3. EDITED QUESTION:', {
      id: qUpdated._id,
      text: qUpdated.questionText,
      years: qUpdated.years,
      frequency: qUpdated.years.length,
      priority: qUpdated.priority,
    });

    // Step C: Delete Question
    await Question.findByIdAndDelete(q._id);
    const count2 = await Question.countDocuments({ unitId: unit._id, isActive: true });
    unit = await Unit.findByIdAndUpdate(unit._id, { questionsCount: count2 }, { new: true });

    console.log('4. DELETED QUESTION & FINAL UNIT QUESTIONS COUNT:', unit.questionsCount);
    console.log('FINAL_TEST_PASSED_SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Final test error:', err);
    process.exit(1);
  }
})();
