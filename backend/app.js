const express = require('express');
const cors = require('cors');

const app = express();

// Allow multiple frontend origins (Vite can run on 5173 or 5174)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: false,
  })
);

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
app.use('/api/pdf', require('./routes/pdfRoutes'));

module.exports = app;
