require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Topic = require('../models/Topic');
const Question = require('../models/Question');

const DATA_DIR = path.join(__dirname, '../../frontend/src/data');
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file)));

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([Subject.deleteMany(), Unit.deleteMany(), Topic.deleteMany(), Question.deleteMany()]);

  // ── Subjects ──────────────────────────────────────────────
  // subjects.json uses string "id" (e.g. "sub-01") and "slug".
  // The Subject model uses ObjectId _id. Insert and build slug → _id map.
  const subjectDocs = read('subjects.json').map((s) => ({
    name: s.name,
    shortName: s.code,
    code: s.code,
    slug: s.slug,
    description: s.description || '',
    isActive: true,
  }));
  const insertedSubjects = await Subject.insertMany(subjectDocs);
  const subjectIdBySlug = new Map();
  insertedSubjects.forEach((subj) => subjectIdBySlug.set(subj.slug, subj._id));

  // ── Units ─────────────────────────────────────────────────
  // units.json uses string "id" (e.g. "unit-001") and "subjectSlug".
  // The Unit model requires subjectId (ObjectId). Map subjectSlug → _id.
  const unitDocs = read('units.json').map((u) => {
    const subjectId = subjectIdBySlug.get(u.subjectSlug);
    if (!subjectId) {
      throw new Error(`Unknown subjectSlug "${u.subjectSlug}" for unit "${u.name}"`);
    }
    return {
      subjectId,
      unitNumber: u.unitNumber,
      name: u.name,
      slug: u.slug,
      description: u.description || '',
      isActive: true,
    };
  });
  const insertedUnits = await Unit.insertMany(unitDocs);
  const unitIdBySlug = new Map();
  insertedUnits.forEach((unit) => unitIdBySlug.set(unit.slug, unit._id));

  // ── Topics ────────────────────────────────────────────────
  // topics.json uses string "unitId" (e.g. "unit-001") which matches
  // the "id" field in units.json, NOT the ObjectId. Map unitId → _id.
  const topicDocs = read('topics.json').map((t) => {
    // The topics.json "unitId" values are the string ids from units.json
    // (e.g. "unit-001"). We need to find the matching unit by its slug.
    // units.json "id" → "unit-001" corresponds to slug "unit-1" for OS unit 1.
    // Build a lookup from the original units.json id → inserted _id.
    const rawUnits = read('units.json');
    const rawUnit = rawUnits.find((u) => u.id === t.unitId);
    if (!rawUnit) {
      throw new Error(`Unknown unitId "${t.unitId}" for topic "${t.name}"`);
    }
    const unitId = unitIdBySlug.get(rawUnit.slug);
    if (!unitId) {
      throw new Error(`No inserted unit found for slug "${rawUnit.slug}" (topic "${t.name}")`);
    }
    return {
      unitId,
      name: t.name,
      slug: t.slug,
      description: t.description || '',
      keywords: t.keywords || [],
      aliases: t.aliases || [],
      concepts: t.concepts || [],
      isActive: t.isActive !== undefined ? t.isActive : true,
    };
  });
  await Topic.insertMany(topicDocs);

  // ── Questions ─────────────────────────────────────────────
  // questions.json uses subjectSlug / unitSlug / topicSlug.
  // Map them to ObjectIds. topicSlug must match a topic slug within the unit.
  const questionDocs = read('questions.json').map((q) => {
    const subjectId = subjectIdBySlug.get(q.subjectSlug);
    const unitId = unitIdBySlug.get(q.unitSlug);
    if (!subjectId || !unitId) {
      throw new Error(`Unknown subject/unit for question "${q.question}"`);
    }
    // Find topic by slug within this unit
    const topic = topicDocs.find(
      (t) => t.slug === q.topicSlug && t.unitId.toString() === unitId.toString()
    );
    return {
      subjectId,
      unitId,
      topicId: topic ? topic._id : null,
      questionText: q.question,
      years: q.year ? [q.year] : [],
      marks: q.marks || null,
      source: q.pdfUrl || '',
      isActive: true,
    };
  });
  await Question.insertMany(questionDocs);

  console.log('Seed complete');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});