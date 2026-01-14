import hashlib
import asyncio
from datetime import datetime
import feedparser
import httpx
from bs4 import BeautifulSoup

from app.core.config import settings

class RssService:
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def fetch_all(self) -> list[dict]:
        tasks = [self._fetch_feed(url) for url in settings.rss_feeds]
        results = await asyncio.gather(*tasks)
        
        events = []
        seen = set()
        for feed in results:
            for e in feed:
                if e["id"] not in seen:
                    seen.add(e["id"])
                    events.append(e)
        return events
    
    async def _fetch_feed(self, url: str) -> list[dict]:
        try:
            r = await self.client.get(url)
            r.raise_for_status()
            feed = feedparser.parse(r.text)
            
            events = []
            for entry in feed.entries[:15]:
                events.append({
                    "id": hashlib.sha256(entry.get("link", "").encode()).hexdigest()[:12],
                    "title": entry.get("title", "")[:300],
                    "source": self._source_name(url),
                    "source_url": entry.get("link", ""),
                    "published_at": datetime.utcnow(),
                    "severity": self._severity(entry.get("title", "")),
                })
            return events
        except:
            return []
    
    def _source_name(self, url: str) -> str:
        if "bbc" in url: return "BBC"
        if "nytimes" in url: return "NY Times"
        if "aljazeera" in url: return "Al Jazeera"
        if "reuters" in url: return "Reuters"
        return "News"
    
    def _severity(self, title: str) -> str:
        t = title.lower()
        critical = ["killed", "dead", "massacre", "attack", "bombing", "explosion"]
        high = ["war", "conflict", "violence", "protest", "crisis"]
        medium = ["tension", "threat", "dispute", "sanction"]
        
        for w in critical:
            if w in t: return "critical"
        for w in high:
            if w in t: return "high"
        for w in medium:
            if w in t: return "medium"
        return "low"

rss = RssService()
