from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "Vigil"
    debug: bool = True
    
    rss_feeds: list[str] = [
        "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://feeds.reuters.com/reuters/worldNews",
        "https://apnews.com/hub/middle-east/rss",
        "https://www.theguardian.com/world/rss",
    ]

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
