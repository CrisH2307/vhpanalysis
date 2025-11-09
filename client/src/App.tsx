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
  const [simulationLoaded, setSimulationLoaded] = useState(false);

  // State for score
  const [score, setScore] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');

  const [date, setDate] = useState<string>('2025-01-01');

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

  useEffect(() => {
    if (cntMapsLoaded < 2) {
      setSimulationLoaded(false);
      setSimulationMode(false);
      setSimulationMessage(null);
      setSimulatedHeatmap(null);
      setSimulatedBoundingBox(null);
      setSimulatedImageDate(null);
      setStickerLats([]);
      setStickerLngs([]);
      setStickerTypes([]);
    }
  }, [cntMapsLoaded]);

  const mapLoaded = () => {
    console.log('mapLoaded', cntMapsLoaded);
    setCntMapsLoaded(prev => prev + 1);
  }

  const handleCitySubmit = (city: string) => {
    setScore(0);
    setExplanation('');
    setCntMapsLoaded(0);
    setSelectedCity(city);
    setSelectedDate(date)
    console.log('City changed to:', city);
    console.log('Date changed to:', date);
  };

  const handleDateChange = (date: string) => {
    console.log('Date changed to:', date);
    setDate(date);
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
    setSimulationLoaded(false);
    console.log('All stickers cleared');
  };

  const handleClearAllComplete = () => {
    setShouldClearAll(false);
  };

  const simulate = async () => {
    if (cntMapsLoaded < 2 || stickerLats.length === 0) {
      return;
    }
    
    // Check if there are scenario changes before allowing simulation
    setSimulationLoaded(false);
    setSimulationMode(true);
    if (!hasScenarioChanges) {
      setSimulationMessage('Add or remove a sticker before running simulation.');
      return;
    }

    // When simulation is turned ON, prepare and send data to backend
    if (stickerLats.length > 0) {
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
          setSimulationLoaded(true);
          const result = await response.json();
          console.log('✅ [App] Simulation response received');
          console.log('📊 [App] Response keys:', Object.keys(result));

          // Store the heat_map_image, bounding_box, and image_date from result
          if (result.heat_map_image) {
            setSimulatedHeatmap(result.heat_map_image);
            setSimulatedBoundingBox(result.bbox || null);
            setSimulatedImageDate(result.image_date || null);
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

    }
  };

  useEffect(() => {
    if (cntMapsLoaded === 2) {
      fetch(
        `http://localhost:3000/score?city=${selectedCity}&date=${selectedDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )
      .then(res => res.json())
      .then(data => {
        console.log('📊 [App] Score:', data);
        setScore(data.score);
        setExplanation(data.explanation);
      })
      .catch(error => {
        console.error('❌ [App] Error fetching score:', error);
      });
    }
  }, [cntMapsLoaded]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-800">
      <LayoutHeader
        city={selectedCity}
        date={date}
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
              <div className="flex flex-1 text-sm gap-3 text-slate-400 px-2 max-h-7 justify-between">
                <div className='flex items-center gap-2'>
                  <div style={{width: '15px', height: '15px', backgroundColor: '#3b6741'}}></div>
                  <span>Vegetation</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div style={{width: '15px', height: '15px', backgroundColor: '#a4c9a9'}}></div>
                  <span>Structures</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div style={{width: '15px', height: '15px', backgroundColor: '#d75642'}}></div>
                  <span>Water Bodies</span>
                </div>
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
              <div className="flex flex-1 text-sm gap-3 text-slate-400 px-2 max-h-7">
                <div className='flex items-center gap-2 w-full'>
                  <span>-10°C</span>
                  <div style={{flex: 1, width: '100%', height: '10px', background: 'linear-gradient(to right, #000004, #1b0c41, #4a0c6b, #780c6a, #a61a5e, #d12e52, #f54a43, #fe712e, #fca30e, #ecce00)'}}>

                  </div>
                  <span>+40°C</span>
                </div>
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
                      simulationLoaded={simulationLoaded}
                      simulatedHeatmap={simulatedHeatmap}
                      simulatedBoundingBox={simulatedBoundingBox}
                      className="h-full flex-1"
                    />
                </div>
                
              </div>
            ) : null}
          </div>
          <div className="flex h-full flex-col">
            <ScorePanel 
              className="flex-1" 
              score={score}
              explanation={explanation}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;