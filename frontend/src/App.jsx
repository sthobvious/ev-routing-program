import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import './App.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function equirectangularDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const x = (lng2 - lng1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const y = (lat2 - lat1);
  return R * Math.sqrt(x * x + y * y) * (Math.PI / 180);
}

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const startMarker = useRef(null);
  const destMarker = useRef(null);

  const [lng, setLng] = useState(-79.3832);
  const [lat, setLat] = useState(43.6532);
  const [zoom, setZoom] = useState(11);
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const [startQuery, setStartQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [startLocation, setStartLocation] = useState(null);
  const [destLocation, setDestLocation] = useState(null);

  // --- Map init ---
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom,
    });
    map.current.on('load', () => {
      setTimeout(() => map.current.resize(), 100);

      // Add dotted line source + layer (empty to start)
      map.current.addSource('route-line', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#4488ff',
          'line-width': 2,
          'line-dasharray': [2, 3],
          'line-opacity': 0.75,
        }
      });

      setMapReady(true);
    });
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);

  // --- Update dotted line whenever both locations are set ---
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const source = map.current.getSource('route-line');
    if (!source) return;

    if (startLocation && destLocation) {
      source.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [startLocation.lng, startLocation.lat],
            [destLocation.lng, destLocation.lat],
          ]
        }
      });
    } else {
      // Clear the line if one location is removed
      source.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] }
      });
    }
  }, [startLocation, destLocation, mapReady]);

  // --- Geocoding ---
  const fetchSuggestions = useCallback(async (query, setSuggestions) => {
    if (query.length < 2) { setSuggestions([]); return; }
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&autocomplete=true&limit=5`;
    const res = await fetch(url);
    const data = await res.json();
    setSuggestions(data.features || []);
  }, []);

  // --- Markers ---
  const placeMarker = (markerRef, lngLat, color) => {
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = new mapboxgl.Marker({ color })
      .setLngLat(lngLat)
      .addTo(map.current);
  };

  const fitMapToBoth = (start, dest) => {
    const bounds = new mapboxgl.LngLatBounds(
      [start.lng, start.lat],
      [dest.lng, dest.lat]
    );
    map.current.fitBounds(bounds, { padding: 100 });
  };

  const selectStart = (feature) => {
    const [fLng, fLat] = feature.geometry.coordinates;
    const location = { placeName: feature.place_name, lng: fLng, lat: fLat };
    setStartLocation(location);
    setStartQuery(feature.place_name);
    setStartSuggestions([]);
    placeMarker(startMarker, [fLng, fLat], '#00cc88');
    if (destLocation) fitMapToBoth(location, destLocation);
    else map.current.flyTo({ center: [fLng, fLat], zoom: 13 });
  };

  const selectDest = (feature) => {
    const [fLng, fLat] = feature.geometry.coordinates;
    const location = { placeName: feature.place_name, lng: fLng, lat: fLat };
    setDestLocation(location);
    setDestQuery(feature.place_name);
    setDestSuggestions([]);
    placeMarker(destMarker, [fLng, fLat], '#ff4466');
    if (startLocation) fitMapToBoth(startLocation, location);
    else map.current.flyTo({ center: [fLng, fLat], zoom: 13 });
  };

  const handleFetchCarData = async () => {
    console.log("TODO: Call Node API -> Tesla API");
  };

  const handleCalculateRoute = async () => {
    if (startLocation && destLocation) {
      const dist = equirectangularDistance(
        startLocation.lat, startLocation.lng,
        destLocation.lat, destLocation.lng
      );
      console.log(`Start:`, startLocation);
      console.log(`Dest:`, destLocation);
      console.log(`Straight-line distance: ${dist.toFixed(2)} km`);
    }
    console.log("TODO: Call Node API -> Python Engine -> Mapbox directions");
  };

  return (
    <div className="app-container">

      <button
        className="menu-toggle-btn"
        onClick={() => setIsOverlayOpen(!isOverlayOpen)}
      >
        {isOverlayOpen ? 'Close Menu' : '☰ Menu'}
      </button>

      {isOverlayOpen && (
        <div className="overlay-panel">
          <h1>EV Routing</h1>

          <div className="coords">
            <p>Lng: {lng}</p>
            <p>Lat: {lat}</p>
            <p>Zoom: {zoom}</p>
          </div>

          <div className="controls">

            <div className="autocomplete-wrapper">
              <input
                className="searchbar"
                type="text"
                placeholder="Start location"
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  fetchSuggestions(e.target.value, setStartSuggestions);
                }}
              />
              {startSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {startSuggestions.map((f) => (
                    <li key={f.id} onClick={() => selectStart(f)}>
                      {f.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="autocomplete-wrapper">
              <input
                className="searchbar"
                type="text"
                placeholder="Destination"
                value={destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  fetchSuggestions(e.target.value, setDestSuggestions);
                }}
              />
              {destSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {destSuggestions.map((f) => (
                    <li key={f.id} onClick={() => selectDest(f)}>
                      {f.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {startLocation && destLocation && (
              <div className="coords">
                <p>📍 {startLocation.placeName.split(',')[0]}</p>
                <p>🏁 {destLocation.placeName.split(',')[0]}</p>
                <p>↔ {equirectangularDistance(
                  startLocation.lat, startLocation.lng,
                  destLocation.lat, destLocation.lng
                ).toFixed(1)} km (straight-line)</p>
              </div>
            )}

            <button onClick={handleFetchCarData} className="btn foo-btn">
              FOO
            </button>
            <button onClick={handleCalculateRoute} className="btn bar-btn">
              BAR
            </button>

          </div>
        </div>
      )}

      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;