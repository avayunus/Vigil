from datetime import datetime
from typing import Optional
import httpx
import zipfile
import io
import csv

class GdeltService:
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def fetch(self, limit: int = 200) -> list[dict]:
        try:
            r = await self.client.get("http://data.gdeltproject.org/gdeltv2/lastupdate.txt")
            r.raise_for_status()
            
            lines = r.text.strip().split("\n")
            url = next((l.split()[-1] for l in lines if "export" in l.lower()), None)
            if not url:
                return []
            
            r = await self.client.get(url)
            r.raise_for_status()
            
            events = []
            with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
                with zf.open(zf.namelist()[0]) as f:
                    reader = csv.reader(io.TextIOWrapper(f, encoding='utf-8'), delimiter='\t')
                    for i, row in enumerate(reader):
                        if i >= limit * 2:
                            break
                        event = self._parse(row)
                        if event:
                            events.append(event)
            
            return events[:limit]
        except Exception as e:
            print(f"GDELT error: {e}")
            return []
    
    def _parse(self, row: list) -> Optional[dict]:
        try:
            if len(row) < 58:
                return None
            
            lat = self._float(row[53]) or self._float(row[40])
            lng = self._float(row[54]) or self._float(row[41])
            if not lat or not lng:
                return None
            
            root = row[28] if len(row) > 28 else ""
            quad = self._int(row[29]) if len(row) > 29 else 1
            gold = self._float(row[30]) if len(row) > 30 else 0
            
            severity = self._severity(root, quad, gold)
            
            return {
                "id": f"g_{row[0]}",
                "title": self._title(row),
                "source": "GDELT",
                "source_url": row[60] if len(row) > 60 else "",
                "published_at": datetime.utcnow(),
                "lat": lat,
                "lng": lng,
                "country": row[56] if len(row) > 56 else None,
                "severity": severity,
            }
        except:
            return None
    
    def _severity(self, root: str, quad: int, gold: float) -> str:
        if root in ["18", "19", "20"]:
            return "critical"
        if root in ["15", "16", "17"]:
            return "high"
        if root in ["13", "14"]:
            return "medium"
        if quad == 4:
            if gold and gold < -5:
                return "critical"
            if gold and gold < -2:
                return "high"
            return "medium"
        if quad == 3:
            if gold and gold < -3:
                return "high"
            return "medium"
        if gold and gold < -6:
            return "critical"
        if gold and gold < -3:
            return "high"
        if gold and gold < 0:
            return "medium"
        return "low"
    
    def _title(self, row: list) -> str:
        actor = row[6] if len(row) > 6 and row[6] else "Unknown"
        country = row[56] if len(row) > 56 else ""
        root = row[28] if len(row) > 28 else ""
        
        actions = {
            "13": "Threat", "14": "Protest", "15": "Military activity",
            "17": "Coercion", "18": "Assault", "19": "Armed conflict", "20": "Violence"
        }
        action = actions.get(root, "Event")
        loc = f" in {country}" if country else ""
        return f"{action}: {actor}{loc}"
    
    def _float(self, v):
        try: return float(v) if v else None
        except: return None
    
    def _int(self, v):
        try: return int(v) if v else None
        except: return None

gdelt = GdeltService()
