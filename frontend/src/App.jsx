import { useState, useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'

function App() {
  const [arcs, setArcs] = useState([])
  const globeEl = useRef()

  // 1. WebSocket Connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws')

    socket.onopen = () => {
      console.log('Connected to Sentinel Backend')
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Create an arc from "Home" (Toronto approx) to the Server
      const newArc = {
        startLat: 43.65, // Toronto Latitude
        startLng: -79.38, // Toronto Longitude
        endLat: data.lat,
        endLng: data.lon,
        color: ['red', 'white', 'blue', 'green'][Math.floor(Math.random() * 4)],
        name: `${data.country} (${data.dst_ip})`
      }

      // Add to state (keep only last 30 to avoid lagging)
      setArcs(prev => [...prev.slice(-30), newArc])
    }

    return () => socket.close()
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={2}
        arcDashAnimateTime={1000}
        arcStroke={0.5}
        // Add labels so we can see what country it is
        labelsData={arcs}
        labelLat={d => d.endLat}
        labelLng={d => d.endLng}
        labelText={d => d.name}
        labelSize={1.5}
        labelDotRadius={0.5}
      />
      
      {/* Overlay Title */}
      <div style={{
        position: 'absolute', 
        top: 20, 
        left: 20, 
        color: 'white', 
        fontFamily: 'monospace',
        zIndex: 100
      }}>
        <h1>SENTINEL THREAT VISUALIZER</h1>
        <p>Live Network Interception</p>
      </div>
    </div>
  )
}

export default App