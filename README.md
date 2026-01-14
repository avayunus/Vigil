# Vigil

Real-time global event monitor. Free data, no paid APIs.

## Stack

- Next.js, Tailwind, Leaflet
- FastAPI, Python, SQLite

## Run

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

## Data

- GDELT Project (free, updates every 15 min)
- RSS feeds (BBC, Reuters, Al Jazeera)
- CartoDB dark tiles
