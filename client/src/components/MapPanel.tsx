import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

type Sticker = {
  id: string;
  lat: number;
  lng: number;
  type: 'tree' | 'house';
};

type MapPanelProps = {
  cityName?: string;
  className?: string;
  placingMode: 'tree' | 'house' | 'removeTree' | 'removeHouse' | null;
  onStickerPlaced: (lat: number, lng: number, type: 'tree' | 'house') => void;
  onClearAll: () => void;
  shouldClearAll: boolean;
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
  placingMode,
  onStickerPlaced,
  shouldClearAll,
  onClearAll,
}: MapPanelProps) => {
  const [mapCenter, setMapCenter] = useState(CITY_COORDINATES[cityName] || CITY_COORDINATES.Toronto);
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Update map center when city changes
  useEffect(() => {
    const newCenter = CITY_COORDINATES[cityName] || CITY_COORDINATES.Toronto;
    setMapCenter(newCenter);
  }, [cityName]);

  // Clear all stickers when requested
  useEffect(() => {
    if (shouldClearAll) {
      setStickers([]);
      onClearAll();
    }
  }, [shouldClearAll, onClearAll]);

  // Handle map click to place or remove sticker
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!placingMode || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (placingMode === 'tree' || placingMode === 'house') {
      // Add sticker to map
      const newSticker: Sticker = {
        id: `${placingMode}-${Date.now()}`,
        lat,
        lng,
        type: placingMode,
      };
      setStickers([...stickers, newSticker]);

      // Notify parent component and log to console
      onStickerPlaced(lat, lng, placingMode);
      console.log(`${placingMode.toUpperCase()} placed at:`, { lat, lng });
    }
  };

  // Handle marker click for removal
  const handleMarkerClick = (stickerId: string, stickerType: 'tree' | 'house') => {
    if (
      (placingMode === 'removeTree' && stickerType === 'tree') ||
      (placingMode === 'removeHouse' && stickerType === 'house')
    ) {
      setStickers(stickers.filter((s) => s.id !== stickerId));
      console.log(`${stickerType.toUpperCase()} removed:`, stickerId);
    }
  };

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
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
              draggableCursor: placingMode ? 'crosshair' : 'default',
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
          >
            {stickers.map((sticker) => (
              <Marker
                key={sticker.id}
                position={{ lat: sticker.lat, lng: sticker.lng }}
                onClick={() => handleMarkerClick(sticker.id, sticker.type)}
                icon={{
                  url: sticker.type === 'tree'
                    ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                        <path fill="#22c55e" stroke="#ffffff" stroke-width="1" d="M12 2L8 8h2v2H7l-2 3h2v2H5l-2 3h7v6h4v-6h7l-2-3h-2v-2h2l-2-3h-3V8h2z"/>
                      </svg>
                    `)
                    : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                        <path fill="#3b82f6" stroke="#ffffff" stroke-width="1" d="M12 3L4 9v12h16V9l-8-6zm0 2.3L18 10v9h-5v-6h-2v6H6v-9l6-4.7z"/>
                      </svg>
                    `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16),
                }}
              />
            ))}
          </GoogleMap>
        )}
      </div>
    </section>
  );
};

export default MapPanel;
