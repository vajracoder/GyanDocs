# GyanDoc

Full-stack PYQ (previous year questions) search platform.

## Structure

```
project-root/
├── frontend/   React + Vite client (unchanged)
├── backend/    Express + MongoDB API (unchanged)
├── README.md
└── .gitignore
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI
npm install
npm run dev             # http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_URL already points to the backend above
npm install
npm run dev             # http://localhost:5173
```

## Notes

- Frontend calls the backend via `frontend/src/services/api.js` and falls back to local JSON in `frontend/src/data/` if the API is unreachable — no behavior change either way.
- Seed the database once with real data: `node backend/utils/seed.js` (reads `frontend/src/data/*.json`).
- CORS on the backend is restricted to `CLIENT_URL` (defaults to `http://localhost:5173`).
