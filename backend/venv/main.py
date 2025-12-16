import threading
import asyncio
import json
import requests
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff, IP, TCP, UDP, conf

# --- CONFIGURATION ---
# If the sniffer doesn't see traffic, you may need to set this manually
# e.g., conf.iface = "Wi-Fi" or "Ethernet"
conf.verb = 0  # Silence Scapy verbose output

app = FastAPI()

# Enable CORS so the frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL STATE ---
latest_packet = None
ip_cache = {}  # Stores { "8.8.8.8": {"lat": 37, "lon": -95, "country": "US"} }

def get_location(ip_address):
    """
    Check cache first, then query ip-api.com.
    Returns a dict with lat/lon/country or None.
    """
    # 1. Check Cache
    if ip_address in ip_cache:
        return ip_cache[ip_address]
    
    # 2. Ignore Private IPs (LAN traffic)
    if ip_address.startswith(("192.168.", "10.", "127.", "172.16.")):
        return None

    # 3. Query API
    try:
        # We use http to be faster, free tier allows 45 requests/min
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=1)
        data = response.json()
        
        if data['status'] == 'success':
            location = {
                "lat": data['lat'],
                "lon": data['lon'],
                "country": data['country']
            }
            ip_cache[ip_address] = location  # Save to cache
            print(f"[+] Found: {data['country']} ({ip_address})")
            return location
    except Exception:
        pass
    
    return None

def process_packet(packet):
    """
    Scapy callback. Extracts IP, finds location, updates global state.
    """
    global latest_packet
    
    if IP in packet:
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        
        # We only care about OUTGOING traffic to foreign servers (dst_ip)
        # But you can map both if you want.
        loc = get_location(dst_ip)
        
        if loc:
            # Format data for the frontend
            latest_packet = {
                "dst_ip": dst_ip,
                "src_ip": src_ip,
                "lat": loc['lat'],
                "lon": loc['lon'],
                "country": loc['country']
            }

def start_sniffer():
    print("[-] Sniffer started... Waiting for traffic.")
    # store=False is critical to prevent RAM from filling up
    sniff(prn=process_packet, store=False)

# Start sniffer in a background thread
threading.Thread(target=start_sniffer, daemon=True).start()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            if latest_packet:
                await websocket.send_text(json.dumps(latest_packet))
                # Reset latest_packet so we don't send the same one forever
                # (Optional: depends on how 'busy' you want the visualization)
                await asyncio.sleep(0.1) 
            else:
                await asyncio.sleep(0.1)
    except Exception as e:
        print(f"WebSocket Error: {e}")