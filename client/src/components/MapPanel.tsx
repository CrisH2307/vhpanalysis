import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

type MapPanelProps = {
  cityName?: string;
  className?: string;
};

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAXNDPIs2VRwoAZSOr5DyTpyZAfmzkCQBo';

// City coordinates
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Toronto: { lat: 43.6532, lng: -79.3832 },
  Vancouver: { lat: 49.2827, lng: -123.1207 },
  Montreal: { lat: 45.5017, lng: -73.5673 },
};

const baseClass =
  'flex min-h-[400px] flex-col rounded-2xl border border-slate-200 bg-white p-5';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '320px',
  borderRadius: '8px',
};

const MapPanel = ({
  cityName = 'Toronto',
  className,
}: MapPanelProps) => {
  const [mapCenter, setMapCenter] = useState(CITY_COORDINATES[cityName] || CITY_COORDINATES.Toronto);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Update map center when city changes
  useEffect(() => {
    const newCenter = CITY_COORDINATES[cityName] || CITY_COORDINATES.Toronto;
    setMapCenter(newCenter);
  }, [cityName]);

  const composedClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <section className={composedClass}>
      <div className="flex flex-1 items-center justify-center">
        {loadError ? (
          <div className="text-sm text-red-500">
            Error loading maps. Please check your connection.
          </div>
        ) : !isLoaded ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading map...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={11}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                // Dark theme to match left toolbar
                { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                {
                  featureType: 'administrative.locality',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#cbd5e1' }],
                },
                {
                  featureType: 'poi',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#64748b' }],
                },
                {
                  featureType: 'poi.park',
                  elementType: 'geometry',
                  stylers: [{ color: '#334155' }],
                },
                {
                  featureType: 'poi.park',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#475569' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#334155' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry.stroke',
                  stylers: [{ color: '#1e293b' }],
                },
                {
                  featureType: 'road',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#94a3b8' }],
                },
                {
                  featureType: 'road.highway',
                  elementType: 'geometry',
                  stylers: [{ color: '#475569' }],
                },
                {
                  featureType: 'road.highway',
                  elementType: 'geometry.stroke',
                  stylers: [{ color: '#334155' }],
                },
                {
                  featureType: 'road.highway',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#cbd5e1' }],
                },
                {
                  featureType: 'transit',
                  elementType: 'geometry',
                  stylers: [{ color: '#334155' }],
                },
                {
                  featureType: 'transit.station',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#64748b' }],
                },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#0f172a' }],
                },
                {
                  featureType: 'water',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#475569' }],
                },
                {
                  featureType: 'water',
                  elementType: 'labels.text.stroke',
                  stylers: [{ color: '#0f172a' }],
                },
              ],
            }}
          />
        )}
      </div>
    </section>
  );
};

export default MapPanel;
