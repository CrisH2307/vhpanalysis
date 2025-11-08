import { useState, useEffect } from 'react';
import LeftToolbar from './components/LeftToolbar';
import LayoutHeader from './components/LayoutHeader';
import MapPanel from './components/MapPanel';
import ScorePanel from './components/ScorePanel';

type StickerType = 'tree' | 'shrub' | 'grass' | 'building' | 'road' | 'waterbody';
type PlacingMode = StickerType | `remove${Capitalize<StickerType>}` | null;

const App = () => {
  const [selectedCity, setSelectedCity] = useState('Brampton');
  const [selectedDate, setSelectedDate] = useState('2022-01-01');
  const [placingMode, setPlacingMode] = useState<PlacingMode>(null);
  const [shouldClearAll, setShouldClearAll] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [hasScenarioChanges, setHasScenarioChanges] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [cntMapsLoaded, setCntMapsLoaded] = useState(0);

  // Shared map state for synchronized panning and zooming
  const [sharedMapCenter, setSharedMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [sharedMapZoom, setSharedMapZoom] = useState<number | undefined>(undefined);

  // Three arrays to store sticker data: lat, lng, type
  const [stickerLats, setStickerLats] = useState<number[]>([]);
  const [stickerLngs, setStickerLngs] = useState<number[]>([]);
  const [stickerTypes, setStickerTypes] = useState<StickerType[]>([]);

  // State for simulated heatmap
  const [simulatedHeatmap, setSimulatedHeatmap] = useState<string | null>(null);
  const [simulatedBoundingBox, setSimulatedBoundingBox] = useState<number[] | null>(null);
  const [simulatedImageDate, setSimulatedImageDate] = useState<string | null>(null);

  // Log sticker arrays whenever they change
  useEffect(() => {
    if (stickerLats.length > 0) {
      console.log('=== STICKER DATA ===');
      console.log('Latitudes:', stickerLats);
      console.log('Longitudes:', stickerLngs);
      console.log('Types:', stickerTypes);
      console.log('Total stickers:', stickerLats.length);
    }
  }, [stickerLats, stickerLngs, stickerTypes]);

  const mapLoaded = () => {
    console.log('mapLoaded', cntMapsLoaded);
    setCntMapsLoaded(prev => prev + 1);
  }

  const handleCitySubmit = (city: string) => {
    setSelectedCity(city);
    console.log('City changed to:', city);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    console.log('Date changed to:', date);
  };

  const handleSetPlacingMode = (mode: PlacingMode) => {
    setPlacingMode(mode);
  };

  const handleStickerPlaced = (lat: number, lng: number, type: StickerType) => {
    // Add to the three arrays
    setStickerLats(prev => [...prev, lat]);
    setStickerLngs(prev => [...prev, lng]);
    setStickerTypes(prev => [...prev, type]);

    // Log to console (terminal)
    console.log(`${type.toUpperCase()} placed at coordinates:`, { latitude: lat, longitude: lng });
    // Keep placing mode active for continuous placement
    setHasScenarioChanges(true);
    setSimulationMessage(null);
  };

  const handleClearAll = () => {
    setShouldClearAll(true);
    // Clear all three arrays
    setStickerLats([]);
    setStickerLngs([]);
    setStickerTypes([]);
    setSimulationMode(false);
    console.log('All stickers cleared');
  };

  const handleClearAllComplete = () => {
    setShouldClearAll(false);
  };

  const simulate = async () => {
    // Check if there are scenario changes before allowing simulation
    if (!hasScenarioChanges) {
      setSimulationMessage('Add or remove a sticker before running simulation.');
      return;
    }

    const newSimulationMode = !simulationMode;
    console.log('🔄 [App] Toggling simulation mode:', newSimulationMode ? 'ON' : 'OFF');
    setSimulationMode(newSimulationMode);

    // When simulation is turned OFF, clear the simulated heatmap
    if (!newSimulationMode) {
      console.log('🧹 [App] Clearing simulated heatmap');
      setSimulatedHeatmap(null);
      setSimulatedBoundingBox(null);
      setSimulatedImageDate(null);
      setHasScenarioChanges(false);
      setSimulationMessage(null);
      return;
    }

    // When simulation is turned ON, prepare and send data to backend
    if (newSimulationMode && stickerLats.length > 0) {
      console.log('📍 [App] Number of stickers to simulate:', stickerLats.length);

      // Convert singular types to plural for backend
      const convertTypeToPluralBackendFormat = (type: StickerType): string => {
        const typeMap: Record<StickerType, string> = {
          tree: 'trees',
          shrub: 'shrubs',
          grass: 'grass',
          building: 'buildings',
          road: 'roads',
          waterbody: 'waterbodies',
        };
        return typeMap[type];
      };

      const simulationData = {
        lats: stickerLats,
        lons: stickerLngs,
        types: stickerTypes.map(convertTypeToPluralBackendFormat),
      };

      console.log('📦 [App] === SIMULATION DATA READY ===');
      console.log(JSON.stringify(simulationData, null, 2));
      console.log('🚀 [App] === SENDING TO BACKEND /simulate ===');

      try {
        const response = await fetch('http://localhost:3000/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(simulationData),
          credentials: 'include', // Important for session cookies
        });

        console.log('📡 [App] Response status:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [App] Simulation response received');
          console.log('📊 [App] Response keys:', Object.keys(result));

          // Store the heat_map_image, bounding_box, and image_date from result
          if (result.heat_map_image) {
            setSimulatedHeatmap(result.heat_map_image);
            setSimulatedBoundingBox(result.bounding_box || null);
            setSimulatedImageDate(result.image_date || null);
            console.log('✅ [App] Simulated heat map stored! Image length:', result.heat_map_image.length, 'characters');
            console.log('📍 [App] Bounding box:', result.bounding_box);
            console.log('📅 [App] Image date:', result.image_date);
            console.log('🗺️ [App] Map 2 (Simulated) will now display the NEW simulated heat map');
          } else {
            console.warn('⚠️ [App] No heat_map_image in response');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ [App] Simulation request failed:', response.status, errorText);
        }
      } catch (error) {
        console.error('❌ [App] Error sending simulation data:', error);
      }

    } else if (newSimulationMode && stickerLats.length === 0) {
      console.warn('⚠️ [App] No stickers placed. Add stickers before running simulation.');
    }
  };

  useEffect(() => {
    console.log('cntMapsLoaded', cntMapsLoaded);
  }, [cntMapsLoaded]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-800">
      <LayoutHeader
        city={selectedCity}
        date={selectedDate}
        onCitySubmit={handleCitySubmit}
        onDateChange={handleDateChange}
      />
      <div className="flex flex-1" style={{maxHeight: 'calc(100vh - 73px)'}}>
        <LeftToolbar
          placingMode={placingMode}
          onSetPlacingMode={handleSetPlacingMode}
          onClearAll={handleClearAll}
          simulationEnabled={simulationMode}
          onToggleSimulation={simulate}
        />
        <main className="grid flex-1 gap-2 p-2 md:grid-cols-3 md:auto-rows-fr">
          <div className="flex h-full flex-col gap-5">
            <div className="flex flex-1 flex-col rounded-2xl border border-slate-700 bg-slate-900/40 shadow-sm">
              <div className="m-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>Normalized Difference Vegetation Index</span>
              </div>
              <div className="flex flex-1">
                <MapPanel
                  cityName={selectedCity}
                  date={selectedDate}
                  imageryType="ndvi"
                  placingMode={placingMode}
                  onStickerPlaced={handleStickerPlaced}
                  shouldClearAll={shouldClearAll}
                  onClearAll={handleClearAllComplete}
                  sharedMapCenter={sharedMapCenter}
                  sharedMapZoom={sharedMapZoom}
                  onMapCenterChange={setSharedMapCenter}
                  onMapZoomChange={setSharedMapZoom}
                  cntMapsLoaded={cntMapsLoaded}
                  mapLoaded={mapLoaded}
                  className="h-full flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex h-full flex-col gap-2">
            <div className="flex flex-1 flex-col rounded-2xl border border-slate-700 bg-slate-900/40 shadow-sm">
              <div className="m-2 flex items-center justify-between text-xs uppercase text-slate-400">
                <span>Land Surface Temperature</span>
                <span>Original</span>
              </div>
              <div className="flex flex-1">
                <MapPanel
                  cityName={selectedCity}
                  date={selectedDate}
                  imageryType="heat"
                  placingMode={null}
                  onStickerPlaced={handleStickerPlaced}
                  shouldClearAll={shouldClearAll}
                  onClearAll={handleClearAllComplete}
                  sharedMapCenter={sharedMapCenter}
                  sharedMapZoom={sharedMapZoom}
                  onMapCenterChange={setSharedMapCenter}
                  onMapZoomChange={setSharedMapZoom}
                  cntMapsLoaded={cntMapsLoaded}
                  mapLoaded={mapLoaded}
                  className="h-full flex-1"
                />
              </div>
            </div>
            {simulationMode ? (
              <div className="flex flex-1 flex-col rounded-2xl border border-dashed border-amber-400 bg-slate-900/60 shadow-inner">
                <div className="m-2 flex items-center justify-between text-xs uppercase text-amber-300">
                  <span>Land Surface Temperature</span>
                  <span>Simulated</span>
                </div>
                <div className="text-xs text-slate-400 h-full w-full">
                    <MapPanel
                      cityName={selectedCity}
                      date={selectedDate}
                      imageryType="simulated_heat"
                      placingMode={null}
                      onStickerPlaced={handleStickerPlaced}
                      shouldClearAll={shouldClearAll}
                      onClearAll={handleClearAllComplete}
                      sharedMapCenter={sharedMapCenter}
                      sharedMapZoom={sharedMapZoom}
                      onMapCenterChange={setSharedMapCenter}
                      onMapZoomChange={setSharedMapZoom}
                      cntMapsLoaded={cntMapsLoaded}
                      mapLoaded={mapLoaded}
                      className="h-full flex-1"
                    />
                </div>
                
              </div>
            ) : null}
          </div>
          <div className="flex h-full flex-col">
            <ScorePanel className="flex-1" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;