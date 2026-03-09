# Vigil

Middle East monitoring dashboard built around named hotspots, curated regional briefings, and live reporting feeds.

## Stack

- Next.js, Tailwind, Leaflet
- FastAPI, Python

## What Changed

- The app is now centered on the Middle East instead of acting like a generic world feed.
- Iraq and the Kurdistan Region have their own hotspot model, including Erbil, Harir, Khor Mor, Sulaimaniyah, Kirkuk, Baghdad, and Al Asad.
- The dashboard now carries deeper regional briefings covering U.S. military activity, Iranian attacks, Syria's anti-ISIS file, Lebanon, Gaza, Yemen, and Gulf shipping lanes.
- Mapping is hotspot-based rather than raw-dot based, so important places stay visible even when source geocoding is poor.

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

- RSS feeds from BBC, Reuters, AP, Al Jazeera, and The Guardian
- Curated situation briefs with source links
- CartoDB basemap tiles
