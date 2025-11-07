import React from 'react';
import LeftToolbar from './components/LeftToolbar';
import MapPanel from './components/MapPanel';
import ScorePanel from './components/ScorePanel';
import LayoutHeader from './components/LayoutHeader';

const App = () => {
  
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <LayoutHeader />
      <div className="flex flex-1">
        <LeftToolbar />
        <main className="grid flex-1 gap-5 py-6 md:grid-cols-3">
          <MapPanel
            title="Map 1"
            subtitle="Simulation Map"
            description="Placeholder for the primary map visualization."
          />
          <MapPanel
            title="Map 2"
            subtitle="Heat / Resource Map"
            description="Placeholder for comparison or resource view."
          />
          <ScorePanel />
        </main>
      </div>
    </div>
  );
};

export default App;
