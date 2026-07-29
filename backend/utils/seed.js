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

  await Subject.insertMany(read('subjects.json'));
  await Unit.insertMany(read('units.json'));
  await Topic.insertMany(read('topics.json'));
  await Question.insertMany(read('questions.json'));

  console.log('Seed complete');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
