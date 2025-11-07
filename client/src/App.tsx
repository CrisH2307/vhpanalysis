import { useState } from 'react';
import LayoutHeader from './components/LayoutHeader';
import LeftToolbar from './components/LeftToolbar';
import MapPanel from './components/MapPanel';
import ScorePanel from './components/ScorePanel';

const App = () => {
  const [selectedCity, setSelectedCity] = useState('Toronto');
  const [placingMode, setPlacingMode] = useState<'tree' | 'house' | 'removeTree' | 'removeHouse' | null>(null);
  const [shouldClearAll, setShouldClearAll] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <LayoutHeader selectedCity={selectedCity} onCityChange={setSelectedCity} />
      <div className="flex flex-1">
        <LeftToolbar
          placingMode={placingMode}
          onSetPlacingMode={handleSetPlacingMode}
          onClearAll={handleClearAll}
        />
        <main className="grid flex-1 gap-5 p-6 md:grid-cols-3">
          <MapPanel
            cityName={selectedCity}
            placingMode={placingMode}
            onStickerPlaced={handleStickerPlaced}
            shouldClearAll={shouldClearAll}
            onClearAll={handleClearAllComplete}
          />
          <MapPanel
            cityName={selectedCity}
            placingMode={placingMode}
            onStickerPlaced={handleStickerPlaced}
            shouldClearAll={shouldClearAll}
            onClearAll={handleClearAllComplete}
          />
          <ScorePanel />
        </main>
      </div>
    </div>
  );
};

export default App;
