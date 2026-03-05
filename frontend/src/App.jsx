import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Required for the map to look right
import './App.css';



// Load the token from the .env file
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Default coordinates (Set to Toronto, Canada just as a starting point)
  const [lng, setLng] = useState(-79.3832);
  const [lat, setLat] = useState(43.6532);
  const [zoom, setZoom] = useState(11);

  useEffect(() => {
    // Initialize map only once
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark mode map (looks slick for EV apps)
      center: [lng, lat],
      visibility: "visible",
      zoom: zoom
    });

    // Update the state when the user drags the map around
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom]);

  // --- Placeholder functions for your Node Backend ---
  const handleFetchCarData = async () => {
    console.log("TODO: Call Node API -> Tesla API");
    // const response = await fetch('http://localhost:3000/api/car-stats');
  };

  const handleCalculateRoute = async () => {
    console.log("TODO: Call Node API -> Python Engine -> Mapbox directions");
    // const response = await fetch('http://localhost:3000/api/route');
  };

  return (
    <div className="app-container">
      {/* UI Sidebar */}
      <div className="sidebar">
        <h1>EV Route Planner</h1>
        <div className="coords">
          <p>Lng: {lng} | Lat: {lat} | Zoom: {zoom}</p>
        </div>

        <div className="controls">
          <button onClick={handleFetchCarData} className="btn tesla-btn">
            Get Tesla Status
          </button>
          <button onClick={handleCalculateRoute} className="btn route-btn">
            Calculate Route
          </button>
        </div>
      </div>

      {/* The Map */}
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;