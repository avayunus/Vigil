from fastapi import APIRouter

from app.services.monitor import monitor

router = APIRouter()

@router.get("/monitor")
async def get_monitor():
    return await monitor.get_dashboard()

@router.get("/events")
async def get_events():
    monitor_payload = await monitor.get_dashboard()
    return {"events": monitor_payload["events"]}

@router.get("/events/geo")
async def get_geo():
    monitor_payload = await monitor.get_dashboard()
    points = [
        {
            "id": hotspot["id"],
            "lat": hotspot["lat"],
            "lng": hotspot["lng"],
            "severity": hotspot["severity"],
            "title": hotspot["name"],
            "country": hotspot["country"],
            "source_url": hotspot["sources"][0]["url"] if hotspot["sources"] else "",
            "region": hotspot["region"],
            "summary": hotspot["summary"],
            "event_count": hotspot["event_count"],
        }
        for hotspot in monitor_payload["hotspots"]
    ]
    return {"points": points}

@router.get("/events/stats")
async def get_stats():
    monitor_payload = await monitor.get_dashboard()
    return monitor_payload["stats"]
