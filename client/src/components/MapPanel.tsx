import { GoogleMap, useJsApiLoader, Marker, GroundOverlay } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

type Sticker = {
  id: string;
  lat: number;
  lng: number;
  type: 'tree' | 'house';
};

type ImageryResponse = {
  image: string;
  image_date: string;
  bounding_box: [number, number, number, number];
};

type MapPanelProps = {
  cityName?: string;
  date?: string;
  imageryType?: 'ndvi' | 'heat';
  className?: string;
  placingMode: 'tree' | 'house' | 'removeTree' | 'removeHouse' | null;
  onStickerPlaced: (lat: number, lng: number, type: 'tree' | 'house') => void;
  onClearAll: () => void;
  shouldClearAll: boolean;
};

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAXNDPIs2VRwoAZSOr5DyTpyZAfmzkCQBo';

// API Base URL
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

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
  date,
  imageryType,
  className,
  placingMode,
  onStickerPlaced,
  shouldClearAll,
  onClearAll,
}: MapPanelProps) => {
  const [mapCenter, setMapCenter] = useState(CITY_COORDINATES[cityName] || CITY_COORDINATES.Toronto);
  const [mapZoom, setMapZoom] = useState(11);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [imageryData, setImageryData] = useState<ImageryResponse | null>(null);
  const [imageryStatus, setImageryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Human-readable label for imagery type
  const imageryLabel = imageryType === 'heat' ? 'LST (Land Surface Temperature)' : imageryType?.toUpperCase();

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

  // Fetch imagery when city, date, or type changes
  useEffect(() => {
    if (!cityName || !date || !imageryType) {
      setImageryData(null);
      setImageryStatus('idle');
      return;
    }

    const controller = new AbortController();

    const fetchImagery = async () => {
      setImageryStatus('loading');

      try {
        const params = new URLSearchParams({ city: cityName, date });
        const response = await fetch(`${API_BASE_URL}/imagery/${imageryType}?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          const message = payload?.error ?? 'Failed to fetch imagery.';
          throw new Error(message);
        }

        const imageryResponse = payload as ImageryResponse;
        setImageryData(imageryResponse);
        setImageryStatus('success');

        console.log(`${imageryLabel} imagery loaded for ${cityName} on ${date}`);

        // Recenter map to the imagery bounding box and adjust zoom
        if (imageryResponse.bounding_box) {
          const [lon_min, lat_min, lon_max, lat_max] = imageryResponse.bounding_box;
          const centerLat = (lat_min + lat_max) / 2;
          const centerLng = (lon_min + lon_max) / 2;
          setMapCenter({ lat: centerLat, lng: centerLng });

          const latDiff = lat_max - lat_min;
          const lngDiff = lon_max - lon_min;
          const maxDiff = Math.max(latDiff, lngDiff);

          let newZoom = 11;
          if (maxDiff < 0.1) newZoom = 13;
          else if (maxDiff < 0.2) newZoom = 12;
          else if (maxDiff < 0.5) newZoom = 11;
          else if (maxDiff < 1) newZoom = 10;
          else newZoom = 9;

          setMapZoom(newZoom + 0.5);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setImageryData(null);
        setImageryStatus('error');
        console.error('Failed to fetch imagery:', error);
      }
    };

    fetchImagery();
    return () => controller.abort();
  }, [cityName, date, imageryType, imageryLabel]);

  // Handle map click to place or remove sticker
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!placingMode || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (placingMode === 'tree' || placingMode === 'house') {
      const newSticker: Sticker = {
        id: `${placingMode}-${Date.now()}`,
        lat,
        lng,
        type: placingMode,
      };
      setStickers([...stickers, newSticker]);
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
      {/* Imagery Status Indicator */}
      {imageryStatus === 'loading' && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"/>
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Loading {imageryLabel} imagery...
        </div>
      )}
      {imageryStatus === 'error' && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          ⚠️ Failed to load {imageryLabel} imagery for this location/date
        </div>
      )}
      {imageryStatus === 'success' && imageryData && (
        <div className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          ✓ {imageryLabel} imagery loaded ({imageryData.image_date})
        </div>
      )}
      <div className="flex flex-1 items-center justify-center">
        {loadError ? (
          <div className="text-sm text-red-500">Error loading maps. Please check your connection.</div>
        ) : !isLoaded ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"/>
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Loading map...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
              draggableCursor: placingMode ? 'crosshair' : 'default',
              styles: [
                { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
                { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#334155' }] },
                { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
                { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
                { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
                { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#334155' }] },
                { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
                { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
                { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
              ],
            }}
          >
            {/* Imagery Overlay */}
            {imageryData && imageryData.bounding_box && (
              <GroundOverlay
                url={`data:image/png;base64,${imageryData.image}`}
                bounds={{
                  north: imageryData.bounding_box[3],
                  south: imageryData.bounding_box[1],
                  east: imageryData.bounding_box[2],
                  west: imageryData.bounding_box[0],
                }}
                opacity={0.3}
              />
            )}

            {/* Tree and House Markers */}
            {stickers.map((sticker) => (
              <Marker
                key={sticker.id}
                position={{ lat: sticker.lat, lng: sticker.lng }}
                onClick={() => handleMarkerClick(sticker.id, sticker.type)}
                icon={{
                  url: sticker.type === 'tree'
                    ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                        <defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                          <feOffset dx="0" dy="2" result="offsetblur"/>
                          <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
                          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter></defs>
                        <circle cx="12" cy="12" r="11" fill="#ffffff" opacity="0.9"/>
                        <path fill="#22c55e" stroke="#ffffff" stroke-width="2" filter="url(#shadow)" d="M12 2L8 8h2v2H7l-2 3h2v2H5l-2 3h7v6h4v-6h7l-2-3h-2v-2h2l-2-3h-3V8h2z"/>
                      </svg>
                    `)
                    : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                        <defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                          <feOffset dx="0" dy="2" result="offsetblur"/>
                          <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
                          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter></defs>
                        <circle cx="12" cy="12" r="11" fill="#ffffff" opacity="0.9"/>
                        <path fill="#3b82f6" stroke="#ffffff" stroke-width="2" filter="url(#shadow)" d="M12 3L4 9v12h16V9l-8-6zm0 2.3L18 10v9h-5v-6h-2v6H6v-9l6-4.7z"/>
                      </svg>
                    `),
                  scaledSize: new google.maps.Size(48, 48),
                  anchor: new google.maps.Point(24, 24),
                }}
                zIndex={1000}
              />
            ))}
          </GoogleMap>
        )}
      </div>
    </section>
  );
};

export default MapPanel;
