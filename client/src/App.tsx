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
      />
      <main className="grid flex-1 gap-5 p-6 md:grid-cols-3">
        <MapPanel
          cityName={selectedCity}
          date={selectedDate}
          imageryType="ndvi"
          placingMode={placingMode}
          onStickerPlaced={handleStickerPlaced}
          shouldClearAll={shouldClearAll}
          onClearAll={handleClearAllComplete}
        />
        <MapPanel
          cityName={selectedCity}
          date={selectedDate}
          imageryType="heat"
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
