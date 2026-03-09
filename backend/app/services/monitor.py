from __future__ import annotations

from collections import Counter, defaultdict
from copy import deepcopy
from datetime import datetime, timezone
import re
from typing import Any

from app.services.monitor_data import HOTSPOT_CATALOG, SITUATION_BRIEFS
from app.services.rss import rss


SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
CATEGORY_ORDER = ["military", "shipping", "humanitarian", "energy", "political", "security"]

REGION_LABELS = {
    "iraq-kurdistan": "Iraq / Kurdistan",
    "syria": "Syria",
    "gulf": "Gulf and U.S. Force Posture",
    "yemen-red-sea": "Yemen / Red Sea",
    "lebanon-israel": "Lebanon / Israel",
    "gaza": "Gaza",
}

REGION_CENTERS = {
    "iraq-kurdistan": {"lat": 35.7412, "lng": 44.5720, "country": "Iraq"},
    "syria": {"lat": 35.2220, "lng": 38.5160, "country": "Syria"},
    "gulf": {"lat": 27.5885, "lng": 49.9398, "country": "Gulf"},
    "yemen-red-sea": {"lat": 14.9725, "lng": 43.7257, "country": "Yemen"},
    "lebanon-israel": {"lat": 33.6128, "lng": 35.5020, "country": "Lebanon / Israel"},
    "gaza": {"lat": 31.4005, "lng": 34.3674, "country": "Palestinian Territories"},
}


class MonitorService:
    def __init__(self) -> None:
        self.hotspots = deepcopy(HOTSPOT_CATALOG)
        self.briefs = deepcopy(SITUATION_BRIEFS)
        self.hotspots_by_id = {item["id"]: item for item in self.hotspots}
        self.alias_index = self._build_alias_index()

    async def get_dashboard(self) -> dict[str, Any]:
        raw_events = await rss.fetch_all()
        events = self._enrich_events(raw_events)
        hotspots = self._build_hotspots(events)
        briefings = self._build_briefings(hotspots)
        stats = self._build_stats(events, hotspots, briefings)

        return {
            "generated_at": datetime.now(timezone.utc),
            "headline": {
                "title": "Middle East pressure map",
                "summary": "U.S. force protection, Iranian retaliation, Kurdish exposure, and maritime disruption are being tracked together instead of as separate stories.",
            },
            "events": events,
            "hotspots": hotspots,
            "briefings": briefings,
            "stats": stats,
        }

    def _build_alias_index(self) -> list[tuple[str, str]]:
        aliases: list[tuple[str, str]] = []
        for hotspot in self.hotspots:
            aliases.append((hotspot["name"].lower(), hotspot["id"]))
            for alias in hotspot["aliases"]:
                aliases.append((alias.lower(), hotspot["id"]))
        aliases.sort(key=lambda item: len(item[0]), reverse=True)
        return aliases

    def _enrich_events(self, raw_events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        enriched: list[dict[str, Any]] = []
        seen_titles: set[str] = set()

        for item in raw_events:
            haystack = self._normalize_text(f'{item.get("title", "")} {item.get("summary", "")}')
            hotspot_ids = self._match_hotspots(haystack)
            if not hotspot_ids and not self._looks_relevant(haystack):
                continue

            region_id = self._region_from_hotspots(hotspot_ids) or self._region_from_keywords(haystack)
            if not region_id:
                continue

            primary_hotspot = self.hotspots_by_id[hotspot_ids[0]] if hotspot_ids else None
            normalized_title = re.sub(r"\s+", " ", item.get("title", "").strip().lower())
            if not normalized_title or normalized_title in seen_titles:
                continue
            seen_titles.add(normalized_title)

            category = self._category(haystack)
            severity = self._severity(haystack, category, primary_hotspot)
            # Named hotspots keep the map readable when source geocoding is inconsistent.
            center = primary_hotspot or REGION_CENTERS[region_id]
            summary = self._clean_summary(item.get("summary", ""))

            enriched.append(
                {
                    "id": item["id"],
                    "title": item.get("title", "").strip(),
                    "summary": summary,
                    "source": item.get("source", "News"),
                    "source_url": item.get("source_url", ""),
                    "published_at": item.get("published_at") or datetime.now(timezone.utc),
                    "severity": severity,
                    "category": category,
                    "region_id": region_id,
                    "region": REGION_LABELS[region_id],
                    "location": center.get("name", REGION_LABELS[region_id]),
                    "country": center.get("country", ""),
                    "lat": center["lat"],
                    "lng": center["lng"],
                    "tags": self._tags(haystack, category, region_id),
                    "hotspot_ids": hotspot_ids,
                }
            )

        enriched.sort(
            key=lambda event: (
                SEVERITY_ORDER[event["severity"]],
                -(event["published_at"].timestamp() if isinstance(event["published_at"], datetime) else 0),
            )
        )
        return enriched[:80]

    def _build_hotspots(self, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        hotspot_state: dict[str, dict[str, Any]] = {}
        for hotspot in self.hotspots:
            hotspot_state[hotspot["id"]] = {
                **hotspot,
                "event_count": 0,
                "linked_events": [],
                "linked_briefs": [],
                "sources": [],
                "last_update": None,
                "activity_score": hotspot["emphasis"],
            }

        for brief in self.briefs:
            for hotspot_id in brief["hotspots"]:
                state = hotspot_state.get(hotspot_id)
                if not state:
                    continue
                state["linked_briefs"].append(brief["title"])
                state["activity_score"] += 2
                state["severity"] = self._max_severity(state["severity"], brief["severity"])

        for event in events:
            linked_hotspots = event["hotspot_ids"] or [self._fallback_hotspot_for_region(event["region_id"])]
            for hotspot_id in linked_hotspots:
                if not hotspot_id or hotspot_id not in hotspot_state:
                    continue
                state = hotspot_state[hotspot_id]
                state["event_count"] += 1
                state["activity_score"] += 2
                state["severity"] = self._max_severity(state["severity"], event["severity"])
                state["last_update"] = self._latest_timestamp(state["last_update"], event["published_at"])
                if len(state["linked_events"]) < 4:
                    state["linked_events"].append(
                        {
                            "id": event["id"],
                            "title": event["title"],
                            "source_url": event["source_url"],
                            "source": event["source"],
                        }
                    )
                if event["source_url"] and len(state["sources"]) < 6:
                    state["sources"].append(
                        {
                            "label": event["source"],
                            "url": event["source_url"],
                        }
                    )

        hotspots = list(hotspot_state.values())
        hotspots.sort(
            key=lambda item: (
                -item["activity_score"],
                SEVERITY_ORDER[item["severity"]],
                item["name"],
            )
        )
        return hotspots

    def _build_briefings(self, hotspots: list[dict[str, Any]]) -> list[dict[str, Any]]:
        hotspot_lookup = {item["id"]: item for item in hotspots}
        briefings: list[dict[str, Any]] = []

        for brief in self.briefs:
            linked_hotspots = [hotspot_lookup[hotspot_id] for hotspot_id in brief["hotspots"] if hotspot_id in hotspot_lookup]
            linked_hotspots.sort(key=lambda item: (-item["activity_score"], item["name"]))
            briefings.append(
                {
                    **brief,
                    "hotspot_count": len(linked_hotspots),
                    "hotspots_preview": linked_hotspots[:3],
                }
            )

        briefings.sort(key=lambda item: (SEVERITY_ORDER[item["severity"]], item["title"]))
        return briefings

    def _build_stats(
        self,
        events: list[dict[str, Any]],
        hotspots: list[dict[str, Any]],
        briefings: list[dict[str, Any]],
    ) -> dict[str, Any]:
        severity_counts = {key: 0 for key in SEVERITY_RANK}
        category_counts = {key: 0 for key in CATEGORY_ORDER}
        region_counts = Counter()

        for event in events:
            severity_counts[event["severity"]] += 1
            category_counts[event["category"]] = category_counts.get(event["category"], 0) + 1
            region_counts[event["region_id"]] += 1

        for brief in briefings:
            region_counts[brief["region_id"]] += 1

        critical_hotspots = sum(1 for hotspot in hotspots if hotspot["severity"] == "critical")
        active_hotspots = sum(1 for hotspot in hotspots if hotspot["activity_score"] >= 6)

        return {
            "live_signals": len(events),
            "active_hotspots": active_hotspots,
            "critical_hotspots": critical_hotspots,
            "briefings": len(briefings),
            "monitored_regions": len(REGION_LABELS),
            "severity": severity_counts,
            "category": category_counts,
            "regions": [
                {
                    "id": region_id,
                    "label": REGION_LABELS[region_id],
                    "count": region_counts[region_id],
                }
                for region_id in REGION_LABELS
            ],
        }

    def _match_hotspots(self, haystack: str) -> list[str]:
        matches: list[str] = []
        for alias, hotspot_id in self.alias_index:
            if alias in haystack and hotspot_id not in matches:
                matches.append(hotspot_id)
        return matches

    def _looks_relevant(self, haystack: str) -> bool:
        if any(alias in haystack for alias, _ in self.alias_index):
            return True
        broad_terms = [
            "iran",
            "iranian",
            "centcom",
            "middle east",
            "gulf",
            "hezbollah",
            "hamas",
            "houthi",
            "u.s. military",
            "us military",
            "drone",
            "missile",
            "airstrike",
            "rocket",
        ]
        return any(term in haystack for term in broad_terms)

    def _region_from_hotspots(self, hotspot_ids: list[str]) -> str | None:
        if not hotspot_ids:
            return None
        return self.hotspots_by_id[hotspot_ids[0]]["region_id"]

    def _region_from_keywords(self, haystack: str) -> str | None:
        keyword_map = {
            "iraq-kurdistan": ["iraq", "kurdistan", "erbil", "baghdad", "kirkuk"],
            "syria": ["syria", "syrian", "sdf", "isis", "palmyra", "hasakah"],
            "gulf": ["hormuz", "kuwait", "gulf", "arifjan", "ali al salem", "tankers"],
            "yemen-red-sea": ["yemen", "houthi", "hodeidah", "red sea", "bab el mandeb", "gulf of aden"],
            "lebanon-israel": ["lebanon", "beirut", "hezbollah", "haifa", "northern israel"],
            "gaza": ["gaza", "rafah", "kerem shalom", "west bank"],
        }

        scores = defaultdict(int)
        for region_id, terms in keyword_map.items():
            for term in terms:
                if term in haystack:
                    scores[region_id] += 1
        if not scores:
            return None
        return max(scores.items(), key=lambda item: item[1])[0]

    def _category(self, haystack: str) -> str:
        categories = {
            "shipping": ["tanker", "shipping", "vessel", "maritime", "hormuz", "port", "gulf of aden"],
            "humanitarian": ["aid", "hospital", "evacuation", "crossing", "fuel", "humanitarian", "medical"],
            "energy": ["gas field", "oil", "refinery", "pipeline", "energy", "grid", "power"],
            "political": ["ceasefire", "talks", "cabinet", "minister", "parliament", "diplomatic"],
            "military": ["centcom", "military", "troops", "drone", "missile", "rocket", "airstrike", "strike", "base"],
        }
        for category, terms in categories.items():
            if any(term in haystack for term in terms):
                return category
        return "security"

    def _severity(self, haystack: str, category: str, hotspot: dict[str, Any] | None) -> str:
        if any(term in haystack for term in ["killed", "dead", "massive", "ballistic", "airstrike", "bombed", "missile", "rocket", "drone attack"]):
            level = "critical"
        elif any(term in haystack for term in ["strike", "troops", "base", "intercept", "militia", "detention", "carrier"]):
            level = "high"
        elif category in {"humanitarian", "political", "energy"}:
            level = "medium"
        else:
            level = "low"

        if hotspot:
            return self._max_severity(level, hotspot["severity"])
        return level

    def _tags(self, haystack: str, category: str, region_id: str) -> list[str]:
        tags = {REGION_LABELS[region_id], category}
        if "u.s." in haystack or "us " in haystack or "centcom" in haystack:
            tags.add("U.S. military")
        if "iran" in haystack or "iranian" in haystack:
            tags.add("Iran")
        if "hezbollah" in haystack:
            tags.add("Hezbollah")
        if "houthi" in haystack:
            tags.add("Houthis")
        if "isis" in haystack:
            tags.add("ISIS")
        return sorted(tags)

    def _normalize_text(self, value: str) -> str:
        return re.sub(r"\s+", " ", value.lower()).strip()

    def _clean_summary(self, summary: str) -> str:
        summary = re.sub(r"\s+", " ", summary).strip()
        if not summary:
            return "Live reporting related to the current regional escalation."
        return summary[:260].rstrip(" .,;:")

    def _fallback_hotspot_for_region(self, region_id: str) -> str | None:
        for hotspot in self.hotspots:
            if hotspot["region_id"] == region_id:
                return hotspot["id"]
        return None

    def _latest_timestamp(self, left: datetime | None, right: datetime | None) -> datetime | None:
        if left is None:
            return right
        if right is None:
            return left
        return max(left, right)

    def _max_severity(self, left: str, right: str) -> str:
        return left if SEVERITY_RANK[left] >= SEVERITY_RANK[right] else right


monitor = MonitorService()
