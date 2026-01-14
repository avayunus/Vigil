from fastapi import APIRouter
from datetime import datetime

from app.services.gdelt import gdelt
from app.services.rss import rss

router = APIRouter()

@router.get("/events")
async def get_events():
    rss_events = await rss.fetch_all()
    gdelt_events = await gdelt.fetch(limit=200)
    
    all_events = rss_events + gdelt_events
    
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_events.sort(key=lambda x: severity_order.get(x["severity"], 4))
    
    return {"events": all_events[:100]}

@router.get("/events/geo")
async def get_geo():
    events = await gdelt.fetch(limit=300)
    
    points = [{
        "id": e["id"],
        "lat": e["lat"],
        "lng": e["lng"],
        "severity": e["severity"],
        "title": e.get("title", ""),
        "country": e.get("country", ""),
        "source_url": e.get("source_url", ""),
    } for e in events if e.get("lat") and e.get("lng")]
    
    return {"points": points}

@router.get("/events/stats")
async def get_stats():
    events = await gdelt.fetch(limit=200)
    rss_events = await rss.fetch_all()
    
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for e in events + rss_events:
        s = e.get("severity", "low")
        counts[s] = counts.get(s, 0) + 1
    
    return {
        "total": len(events) + len(rss_events),
        "mapped": len(events),
        "severity": counts,
    }
