import { useState } from 'react';
import LayoutHeader from './components/LayoutHeader';
import LeftToolbar from './components/LeftToolbar';
import MapPanel from './components/MapPanel';
import ScorePanel from './components/ScorePanel';


const App = () => {
  const [selectedCity, setSelectedCity] = useState('Brampton');
  const [selectedDate, setSelectedDate] = useState('2022-01-01');
  const [placingMode, setPlacingMode] = useState<'tree' | 'house' | 'removeTree' | 'removeHouse' | null>(null);
  const [shouldClearAll, setShouldClearAll] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [hasScenarioChanges, setHasScenarioChanges] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);

  // Shared map state for synchronized panning and zooming
  const [sharedMapCenter, setSharedMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [sharedMapZoom, setSharedMapZoom] = useState<number | undefined>(undefined);

  const handleCitySubmit = (city: string) => {
    setSelectedCity(city);
    console.log('City changed to:', city);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    console.log('Date changed to:', date);
  };

  const handleSetPlacingMode = (mode: 'tree' | 'house' | 'removeTree' | 'removeHouse' | null) => {
    setPlacingMode(mode);
  };

  const handleStickerPlaced = (lat: number, lng: number, type: 'tree' | 'house') => {
    // Log to console (terminal)
    console.log(`${type.toUpperCase()} placed at coordinates:`, { latitude: lat, longitude: lng });
    setPlacingMode(null); // Turn off placing mode after placing
    setHasScenarioChanges(true);
    setSimulationMessage(null);
  };

  const handleClearAll = () => {
    setShouldClearAll(true);
    console.log('All stickers cleared');
  };

  const handleClearAllComplete = () => {
    setShouldClearAll(false);
    setHasScenarioChanges(false);
    setSimulationMode(false);
    setSimulationMessage(null);
  };

  const toggleSimulationMode = () => {
    if (!hasScenarioChanges) {
      setSimulationMessage('Add or remove a tree/house before running simulation.');
      return;
    }
    setSimulationMode((prev) => !prev);
    setSimulationMessage(null);
  };

  const handleStickerCountChange = (count: number) => {
    const hasChanges = count > 0;
    setHasScenarioChanges((prev) => {
      if (!hasChanges && prev) {
        setSimulationMode(false);
        setSimulationMessage(null);
      }
      return hasChanges;
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-800">
      {simulationMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4">
          <div className="max-w-sm rounded-3xl border border-amber-300 bg-slate-900/90 p-6 text-center shadow-2xl">
            <h2 className="text-lg font-semibold text-amber-200">Simulation Not Ready</h2>
            <p className="mt-3 text-sm text-slate-100">{simulationMessage}</p>
            <button
              type="button"
              className="mt-5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
              onClick={() => setSimulationMessage(null)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
      <LayoutHeader
      city={selectedCity}
      date={selectedDate}
      onCitySubmit={handleCitySubmit}
      onDateChange={handleDateChange}
    />
    <div className="flex flex-1">
      <LeftToolbar
        placingMode={placingMode}
        onSetPlacingMode={handleSetPlacingMode}
        onClearAll={handleClearAll}
        simulationEnabled={simulationMode}
        onToggleSimulation={toggleSimulationMode}
      />
      <main className="grid flex-1 gap-2 p-2 md:grid-cols-3">
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
          onStickerChange={handleStickerCountChange}
          overlayOpacity={overlayOpacity}
          onOverlayOpacityChange={setOverlayOpacity}
          showOpacityControl
        />
        {!simulationMode ? (
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
          overlayOpacity={overlayOpacity}
        />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-2 py-1 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>Map 2</span>
                <span>Original</span>
              </div>
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
                overlayOpacity={overlayOpacity}
              />
            </div>
            <div className="rounded-2xl border border-dashed border-amber-400 bg-slate-900/60 px-2 py-1 shadow-inner">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-300">
                <span>Map 2</span>
                <span>Simulated</span>
              </div>
              <div className="mb-2 text-xs text-slate-400">
                Scenario preview (same data for now)
              </div>
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
                overlayOpacity={overlayOpacity}
              />
            </div>
          </div>
        )}
        <ScorePanel />
      </main>
    </div>
  </div>
);

};

export default App;
