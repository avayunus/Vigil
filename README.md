# Vigil

Real-time global event monitor. Free data, no paid APIs.

## Stack

- Next.js, Tailwind, Leaflet
- FastAPI, Python, SQLite

## Live Demo

**Note:** The backend is hosted on Render's free tier and sleeps after 15 minutes of inactivity. 
> To view the live demo: 
> 1. Visit the backend to wake it up: https://vigil-api-yxfk.onrender.com
> 2. Wait ~60 seconds for it to spin up ({"status":"ok"}) will appear. 
> 3. Then visit the frontend: https://vigil-pink.vercel.app

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
