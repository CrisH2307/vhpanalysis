import { GoogleMap, useJsApiLoader, Marker, OverlayView } from '@react-google-maps/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as GiIcons from 'react-icons/gi';

type StickerType = 'tree' | 'shrub' | 'grass' | 'building' | 'road' | 'waterbody';
type PlacingMode = StickerType | `remove${Capitalize<StickerType>}` | null;

type Sticker = {
  id: string;
  lat: number;
  lng: number;
  type: StickerType;
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
  placingMode: PlacingMode;
  onStickerPlaced: (lat: number, lng: number, type: StickerType) => void;
  onClearAll: () => void;
  shouldClearAll: boolean;
  sharedMapCenter?: { lat: number; lng: number };
  sharedMapZoom?: number;
  onMapCenterChange?: (center: { lat: number; lng: number }) => void;
  onMapZoomChange?: (zoom: number) => void;
  simulatedImagery?: string | null; // Base64 encoded simulated heatmap image
  simulatedBoundingBox?: number[] | null; // Bounding box for simulated imagery
  simulatedImageDate?: string | null; // Image date for simulated imagery
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
  position: 'relative' as const,
  zIndex: 10,
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
  sharedMapCenter,
  sharedMapZoom,
  onMapCenterChange,
  onMapZoomChange,
  simulatedImagery,
  simulatedBoundingBox,
  simulatedImageDate,
}: MapPanelProps) => {
  const [mapCenter, setMapCenter] = useState(sharedMapCenter || CITY_COORDINATES[cityName] || CITY_COORDINATES.Toronto);
  const [mapZoom, setMapZoom] = useState(sharedMapZoom || 11);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [imageryData, setImageryData] = useState<ImageryResponse | null>(null);
  const [imageryStatus, setImageryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [imageryError, setImageryError] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isUpdatingFromProps, setIsUpdatingFromProps] = useState(false);
  const lastPlacementTimeRef = useRef<number>(0);

  // Use refs to track the latest values without causing re-renders
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastZoomRef = useRef<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Add imagery overlay when map and imagery data are available
  useEffect(() => {
    if (!map || !imageryData || !imageryData.bounding_box) return;

    const [lon_min, lat_min, lon_max, lat_max] = imageryData.bounding_box;
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(lat_min, lon_min),
      new google.maps.LatLng(lat_max, lon_max)
    );

    // Create custom overlay
    class ImageryOverlay extends google.maps.OverlayView {
      private bounds: google.maps.LatLngBounds;
      private image: string;
      private div: HTMLDivElement | null = null;

      constructor(bounds: google.maps.LatLngBounds, image: string) {
        super();
        this.bounds = bounds;
        this.image = image;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.borderStyle = 'none';
        this.div.style.borderWidth = '0px';
        this.div.style.position = 'absolute';
        this.div.style.opacity = '0.6';

        const img = document.createElement('img');
        img.src = `data:image/png;base64,${this.image}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        this.div.appendChild(img);

        const panes = this.getPanes();
        panes?.mapPane.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;

        const overlayProjection = this.getProjection();
        const sw = overlayProjection.fromLatLngToDivPixel(this.bounds.getSouthWest());
        const ne = overlayProjection.fromLatLngToDivPixel(this.bounds.getNorthEast());

        if (sw && ne && this.div) {
          this.div.style.left = sw.x + 'px';
          this.div.style.top = ne.y + 'px';
          this.div.style.width = (ne.x - sw.x) + 'px';
          this.div.style.height = (sw.y - ne.y) + 'px';
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const overlay = new ImageryOverlay(bounds, imageryData.image);
    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
    };
  }, [map, imageryData]);

  // Human-readable label for imagery type
  const imageryLabel = imageryType === 'heat' ? 'LST (Land Surface Temperature)' : imageryType?.toUpperCase();

  // Sync with shared map center
  useEffect(() => {
    if (sharedMapCenter) {
      setIsUpdatingFromProps(true);
      setMapCenter(sharedMapCenter);
      setTimeout(() => setIsUpdatingFromProps(false), 100);
    }
  }, [sharedMapCenter]);

  // Sync with shared map zoom
  useEffect(() => {
    if (sharedMapZoom !== undefined) {
      setIsUpdatingFromProps(true);
      setMapZoom(sharedMapZoom);
      setTimeout(() => setIsUpdatingFromProps(false), 100);
    }
  }, [sharedMapZoom]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Fetch imagery when city, date, or type changes, or use simulated imagery if provided
  useEffect(() => {
    // If simulated imagery is provided with bounding box, use it directly without fetching
    if (simulatedImagery && simulatedBoundingBox && simulatedImageDate && imageryType === 'heat') {
      console.log('🔄 [MapPanel] Using simulated imagery for heat map');
      console.log('📊 [MapPanel] Simulated image length:', simulatedImagery.length, 'characters');
      console.log('📍 [MapPanel] Using provided bounding box:', simulatedBoundingBox);
      console.log('📅 [MapPanel] Using provided image date:', simulatedImageDate);

      setImageryStatus('loading');
      setImageryError(null);

      // Use the simulated imagery directly with the provided bounding box
      setImageryData({
        image: simulatedImagery,
        image_date: simulatedImageDate,
        bounding_box: simulatedBoundingBox as [number, number, number, number],
      });
      setImageryStatus('success');
      setImageryError(null);

      console.log('✅ [MapPanel] Simulated heat map imagery loaded and displayed (NO FETCH)');

      // Recenter map to the imagery bounding box and adjust zoom
      if (simulatedBoundingBox) {
        const [lon_min, lat_min, lon_max, lat_max] = simulatedBoundingBox;
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

      return; // Exit early, don't fetch
    }

    // Normal fetch flow when no simulated imagery
    if (!cityName || !date || !imageryType) {
      setImageryData(null);
      setImageryStatus('idle');
      setImageryError(null);
      return;
    }

    const controller = new AbortController();

    const fetchImagery = async () => {
      setImageryStatus('loading');
      setImageryError(null);

      try {
        console.log(`🔄 [MapPanel] Fetching ${imageryLabel} imagery for ${cityName} on ${date}`);
        const params = new URLSearchParams({ city: cityName, date });
        const response = await fetch(`${API_BASE_URL}/imagery/${imageryType}?${params.toString()}`, {
          signal: controller.signal,
          credentials: 'include',
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          const message = payload?.error ?? 'Failed to fetch imagery.';
          throw new Error(message);
        }

        const imageryResponse = payload as ImageryResponse;
        setImageryData(imageryResponse);
        setImageryStatus('success');
        setImageryError(null);

        console.log(`✅ [MapPanel] ${imageryLabel} imagery loaded for ${cityName} on ${date}`);
        console.log(`📊 [MapPanel] Image length:`, imageryResponse.image.length, 'characters');
        console.log(`📍 [MapPanel] Bounding box:`, imageryResponse.bounding_box);

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

        // Capture the error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setImageryError(errorMessage);
        console.error('Failed to fetch imagery:', error);
      }
    };

    fetchImagery();
    return () => controller.abort();
  }, [cityName, date, imageryType, imageryLabel, simulatedImagery, simulatedBoundingBox, simulatedImageDate]);

  // Place a sticker at the given position with throttling
  const placeSticker = useCallback((lat: number, lng: number) => {
    if (imageryType !== 'ndvi') return;
    if (!placingMode) return;

    // Throttle placement to every 50ms when dragging
    const now = Date.now();
    if (now - lastPlacementTimeRef.current < 50) return;
    lastPlacementTimeRef.current = now;

    // Check if it's a placing mode (not a remove mode)
    const isPlacingMode = !placingMode.startsWith('remove');

    if (isPlacingMode) {
      const newSticker: Sticker = {
        id: `${placingMode}-${Date.now()}-${Math.random()}`,
        lat,
        lng,
        type: placingMode as StickerType,
      };
      setStickers(prev => [...prev, newSticker]);
      onStickerPlaced(lat, lng, placingMode as StickerType);
    }
  }, [imageryType, placingMode, onStickerPlaced]);

  // Handle map click to place or remove sticker (only for NDVI map)
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
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

  // Handle marker click for removal (only for NDVI map)
  const handleMarkerClick = (stickerId: string, stickerType: StickerType) => {
    // Only allow sticker removal on NDVI map
    if (imageryType !== 'ndvi') return;

    if (
      (placingMode === 'removeTree' && stickerType === 'tree') ||
      (placingMode === 'removeHouse' && stickerType === 'house')
    ) {
      setStickers(stickers.filter((s) => s.id !== stickerId));
      console.log(`${stickerType.toUpperCase()} removed:`, stickerId);
    }
  };

  // Handle map center change with debouncing for smoother movement
  const handleCenterChanged = useCallback(() => {
    if (!map || !onMapCenterChange || isUpdatingFromProps) return;

    const center = map.getCenter();
    if (!center) return;

    const newCenter = { lat: center.lat(), lng: center.lng() };

    // Check if center actually changed (avoid unnecessary updates)
    if (lastCenterRef.current &&
        Math.abs(lastCenterRef.current.lat - newCenter.lat) < 0.0001 &&
        Math.abs(lastCenterRef.current.lng - newCenter.lng) < 0.0001) {
      return;
    }

    lastCenterRef.current = newCenter;

    // Debounce the update to reduce frequency
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onMapCenterChange(newCenter);
    }, 150); // 150ms debounce for smooth panning
  }, [map, onMapCenterChange, isUpdatingFromProps]);

  // Handle map zoom change with debouncing
  const handleZoomChanged = useCallback(() => {
    if (!map || !onMapZoomChange || isUpdatingFromProps) return;

    const zoom = map.getZoom();
    if (zoom === undefined) return;

    // Check if zoom actually changed
    if (lastZoomRef.current === zoom) return;

    lastZoomRef.current = zoom;

    // Debounce the update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onMapZoomChange(zoom);
    }, 150); // 150ms debounce for smooth zooming
  }, [map, onMapZoomChange, isUpdatingFromProps]);

  const composedClass = className ? `${baseClass} ${className}` : baseClass;

  // Check if error is about missing thermal imagery
  const isSatelliteDataError = imageryError?.includes('No valid thermal imagery found') ||
                                imageryError?.includes('No valid ndvi imagery found') ||
                                imageryError?.includes('No imagery found');

  // Get icon component and color for each sticker type
  const getStickerIconComponent = (type: StickerType) => {
    const iconMap: Record<StickerType, { Icon: any; color: string }> = {
      tree: { Icon: GiIcons.GiPineTree, color: '#22c55e' },
      shrub: { Icon: GiIcons.GiFlowerPot, color: '#4ade80' },
      grass: { Icon: GiIcons.GiGrass, color: '#86efac' },
      building: { Icon: GiIcons.GiModernCity, color: '#94a3b8' },
      road: { Icon: GiIcons.GiRoad, color: '#64748b' },
      waterbody: { Icon: GiIcons.GiWaterDrop, color: '#3b82f6' }
    };
    return iconMap[type];
  };

  return (
    <section className={composedClass}>
      {/* Imagery Status Indicator */}
      {imageryStatus === 'success' && imageryData && (
        <div className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          ✓ {imageryLabel} imagery loaded ({imageryData.image_date})
        </div>
      )}

      <div className="flex flex-1 items-center justify-center">
        {/* Show error screen if imagery failed to load */}
        {imageryStatus === 'error' ? (
          <div className="flex flex-col items-center justify-center gap-4 text-slate-400" style={{ minHeight: '320px' }}>
            {/* Satellite Icon (grayed out) */}
            <div className="relative opacity-50">
              <img
                src="/Settilite.png"
                alt="Satellite"
                className="h-32 w-32 object-contain grayscale"
              />
            </div>

            {/* Error message */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2 text-red-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {isSatelliteDataError
                    ? 'Satellite Could Not Retrieve Imagery'
                    : 'Failed to Load Imagery'}
                </span>
              </div>
              <span className="text-xs opacity-75 max-w-xs">
                {isSatelliteDataError
                  ? `No ${imageryLabel} data available for ${cityName} on ${date}. Try a different date or location.`
                  : `Unable to load ${imageryLabel} imagery. Please check your connection and try again.`}
              </span>
            </div>
          </div>
        ) : loadError ? (
          <div className="text-sm text-red-500">Error loading maps. Please check your connection.</div>
        ) : !isLoaded || imageryStatus === 'loading' || imageryStatus === 'idle' ? (
          <div className="flex flex-col items-center justify-center gap-4 text-slate-400" style={{ minHeight: '320px' }}>
            {/* Satellite Image */}
            <div className="relative">
              <img
                src="/Settilite.png"
                alt="Satellite"
                className="h-32 w-32 animate-pulse object-contain"
              />
            </div>

            {/* Loading text */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"/>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm font-medium">
                  Connecting to LANDSAT 9 Satellite
                </span>
              </div>
              <span className="text-xs opacity-75">
                {!isLoaded ? 'Initializing map interface...' : `Retrieving ${imageryLabel} data...`}
              </span>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onClick={handleMapClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onLoad={(mapInstance) => setMap(mapInstance)}
            onUnmount={() => setMap(null)}
            onCenterChanged={handleCenterChanged}
            onZoomChanged={handleZoomChanged}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
              draggableCursor: placingMode ? 'crosshair' : 'default',
              backgroundColor: 'transparent',
              // Enable smooth animations and gestures
              gestureHandling: 'greedy',
              // Disable tilt for smoother 2D panning
              tilt: 0,
              styles: [
                // Make all geometry transparent/invisible
                { elementType: 'geometry', stylers: [{ visibility: 'off' }] },
                { elementType: 'geometry.fill', stylers: [{ visibility: 'off' }] },
                { elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },

                // Keep labels visible with good contrast
                { elementType: 'labels.text.stroke', stylers: [{ color: '#000000', weight: 3 }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },

                // Roads - semi-transparent overlay
                { featureType: 'road', elementType: 'geometry', stylers: [{ visibility: 'on', color: '#ffffff' }] },
                { featureType: 'road', elementType: 'geometry.fill', stylers: [{ visibility: 'on', color: '#ffffff', lightness: 100 }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'on', color: '#000000', weight: 0.5 }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
                { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#000000', weight: 2 }] },

                // Highways - slightly more visible
                { featureType: 'road.highway', elementType: 'geometry', stylers: [{ visibility: 'on', color: '#ffeb3b', lightness: 50 }] },
                { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ visibility: 'on', color: '#000000', weight: 1 }] },

                // Water - keep transparent
                { featureType: 'water', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
                { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
                { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#000000', weight: 2 }] },

                // Administrative boundaries
                { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ visibility: 'on', color: '#ffffff', weight: 1 }] },
              ],
            }}
          >

            {/* Tree and House Markers - Only show on NDVI map */}
            {imageryType === 'ndvi' && stickers.map((sticker) => (
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