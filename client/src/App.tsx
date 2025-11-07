import { useState } from 'react';
import LayoutHeader from './components/LayoutHeader';
import LeftToolbar from './components/LeftToolbar';
import MapPanel from './components/MapPanel';
import ScorePanel from './components/ScorePanel';

const App = () => {
  const [selectedCity, setSelectedCity] = useState('Toronto');

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <LayoutHeader selectedCity={selectedCity} onCityChange={setSelectedCity} />
      <div className="flex flex-1">
        <LeftToolbar />
        <main className="grid flex-1 gap-5 p-6 md:grid-cols-3">
          <MapPanel cityName={selectedCity} />
          <MapPanel cityName={selectedCity} />
          <ScorePanel />
        </main>
      </div>
    </div>
  );
};

export default App;
