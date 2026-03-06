import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './App.css';

// Load .env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Default coordinates
  const [lng, setLng] = useState(-79.3832);
  const [lat, setLat] = useState(43.6532);
  const [zoom, setZoom] = useState(11);

  const [isOverlayOpen, setIsOverlayOpen] = useState(true);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('load', () => {
      setTimeout(() => {
        map.current.resize();
      }, 100);
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom]);

  // --- Placeholder functions for your Node Backend ---
  const handleFetchCarData = async () => {
    console.log("TODO: Call Node API -> Tesla API");
  };

  const handleCalculateRoute = async () => {
    console.log("TODO: Call Node API -> Python Engine -> Mapbox directions");
  };

  return (
    <div className="app-container">

      {/* Toggle Button */}
      <button
        className="menu-toggle-btn"
        onClick={() => setIsOverlayOpen(!isOverlayOpen)}
      >
        {isOverlayOpen ? 'Close Menu' : '☰ Menu'}
      </button>

      {/* Floating Overlay Panel */}
      {isOverlayOpen && (
        <div className="overlay-panel">
          <h1>EV Route Planner</h1>
          <div className="coords">
            <p>Lng: {lng}</p>
            <p>Lat: {lat}</p>
            <p>Zoom: {zoom}</p>
          </div>

          <div className="controls">

            <div class="topnav">
              <input class="start searchbar" type="text" placeholder="My position"></input>
            </div>

            <div class="topnav">
              <input class="dest searchbar" type="text" placeholder="Where do you want to end up?"></input>
            </div>

            <button onClick={handleFetchCarData} className="btn foo-btn">
              FOO
            </button>

            <button onClick={handleCalculateRoute} className="btn bar-btn">
              BAR
            </button>

          </div>
        </div>
      )}

      {/* The Map */}
      <div
        ref={mapContainer}
        className="map-container"
      />
    </div>
  );
}

export default App;