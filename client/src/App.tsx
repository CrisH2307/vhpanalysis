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
  };

  const handleClearAll = () => {
    setShouldClearAll(true);
    console.log('All stickers cleared');
  };

  const handleClearAllComplete = () => {
    setShouldClearAll(false);
  };

  const toggleSimulationMode = () => {
    setSimulationMode((prev) => !prev);
  };

 return (
  <div className="flex min-h-screen flex-col bg-slate-800">
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
