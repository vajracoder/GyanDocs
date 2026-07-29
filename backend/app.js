const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'gyandoc-server' });
});

app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

module.exports = app;
