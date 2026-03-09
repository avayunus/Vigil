import asyncio
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import time
import feedparser
import httpx
from bs4 import BeautifulSoup

from app.core.config import settings


class RssService:

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_all(self) -> list[dict]:
        tasks = [self._fetch_feed(url) for url in settings.rss_feeds]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        events = []
        seen = set()
        for feed in results:
            if isinstance(feed, Exception):
                continue
            for e in feed:
                dedupe_key = e["source_url"] or e["id"]
                if dedupe_key not in seen:
                    seen.add(dedupe_key)
                    events.append(e)
        events.sort(key=lambda item: item["published_at"], reverse=True)
        return events

    async def _fetch_feed(self, url: str) -> list[dict]:
        try:
            r = await self.client.get(url)
            r.raise_for_status()
            feed = feedparser.parse(r.text)

            events = []
            source_name = feed.feed.get("title") or self._source_name(url)
            for entry in feed.entries[:18]:
                summary = self._summary(entry)
                link = entry.get("link", "")
                events.append({
                    "id": hashlib.sha256(link.encode()).hexdigest()[:12],
                    "title": entry.get("title", "")[:300],
                    "summary": summary,
                    "source": source_name[:80],
                    "source_url": link,
                    "published_at": self._published_at(entry),
                })
            return events
        except Exception:
            return []

    def _published_at(self, entry) -> datetime:
        parsed_struct = entry.get("published_parsed") or entry.get("updated_parsed")
        if parsed_struct:
            return datetime.fromtimestamp(time.mktime(parsed_struct), tz=timezone.utc)

        for field in ("published", "updated", "created"):
            value = entry.get(field)
            if not value:
                continue
            try:
                parsed = parsedate_to_datetime(value)
                return parsed.astimezone(timezone.utc)
            except (TypeError, ValueError):
                continue
        return datetime.now(timezone.utc)

    def _summary(self, entry) -> str:
        raw = entry.get("summary", "") or entry.get("description", "")
        if not raw:
            return ""
        soup = BeautifulSoup(raw, "html.parser")
        return soup.get_text(" ", strip=True)[:500]

    def _source_name(self, url: str) -> str:
        if "bbc" in url:
            return "BBC"
        if "apnews" in url:
            return "AP"
        if "aljazeera" in url:
            return "Al Jazeera"
        if "reuters" in url:
            return "Reuters"
        if "theguardian" in url:
            return "The Guardian"
        return "News"

rss = RssService()
