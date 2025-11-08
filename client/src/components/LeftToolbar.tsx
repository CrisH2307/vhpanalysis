type LeftToolbarProps = {
  placingMode: 'tree' | 'house' | 'removeTree' | 'removeHouse' | null;
  onSetPlacingMode: (mode: 'tree' | 'house' | 'removeTree' | 'removeHouse' | null) => void;
  onClearAll: () => void;
  simulationEnabled: boolean;
  onToggleSimulation: () => void;
};

const LeftToolbar = ({
  placingMode,
  onSetPlacingMode,
  onClearAll,
  simulationEnabled,
  onToggleSimulation,
}: LeftToolbarProps) => {
  const buttonClass =
    'group relative flex h-12 w-12 items-center justify-center rounded-sm bg-slate-700 text-slate-300 transition-all hover:bg-slate-600 hover:text-white active:bg-slate-500';

  const activeButtonClass =
    'group relative flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white transition-all hover:bg-blue-500 active:bg-blue-700';

  return (
    <aside className="flex w-16 flex-col items-center gap-2 border-r border-slate-300 bg-slate-800 p-2 shadow-lg">
      {/* Add Tree */}
      <button
        type="button"
        aria-label="Add tree"
        className={placingMode === 'tree' ? activeButtonClass : buttonClass}
        title="Add tree"
        onClick={() => onSetPlacingMode(placingMode === 'tree' ? null : 'tree')}
      >
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          {/* Tree */}
          <path d="M12 2L8 8h2v2H7l-2 3h2v2H5l-2 3h7v6h4v-6h7l-2-3h-2v-2h2l-2-3h-3V8h2z" />
          {/* Plus sign */}
          <circle cx="19" cy="5" r="4" fill="#22c55e" stroke="white" strokeWidth="1" />
          <path d="M19 3v4M17 5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Remove Tree */}
      <button
        type="button"
        aria-label="Remove tree"
        className={placingMode === 'removeTree' ? activeButtonClass : buttonClass}
        title="Remove tree"
        onClick={() => onSetPlacingMode(placingMode === 'removeTree' ? null : 'removeTree')}
      >
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          {/* Tree */}
          <path d="M12 2L8 8h2v2H7l-2 3h2v2H5l-2 3h7v6h4v-6h7l-2-3h-2v-2h2l-2-3h-3V8h2z" />
          {/* Minus sign */}
          <circle cx="19" cy="5" r="4" fill="#ef4444" stroke="white" strokeWidth="1" />
          <path d="M17 5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Add House */}
      <button
        type="button"
        aria-label="Add house"
        className={placingMode === 'house' ? activeButtonClass : buttonClass}
        title="Add house"
        onClick={() => onSetPlacingMode(placingMode === 'house' ? null : 'house')}
      >
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          {/* House */}
          <path d="M12 3L4 9v12h16V9l-8-6zm0 2.3L18 10v9h-5v-6h-2v6H6v-9l6-4.7z" />
          {/* Plus sign */}
          <circle cx="19" cy="5" r="4" fill="#22c55e" stroke="white" strokeWidth="1" />
          <path d="M19 3v4M17 5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Remove House */}
      <button
        type="button"
        aria-label="Remove house"
        className={placingMode === 'removeHouse' ? activeButtonClass : buttonClass}
        title="Remove house"
        onClick={() => onSetPlacingMode(placingMode === 'removeHouse' ? null : 'removeHouse')}
      >
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          {/* House */}
          <path d="M12 3L4 9v12h16V9l-8-6zm0 2.3L18 10v9h-5v-6h-2v6H6v-9l6-4.7z" />
          {/* Minus sign */}
          <circle cx="19" cy="5" r="4" fill="#ef4444" stroke="white" strokeWidth="1" />
          <path d="M17 5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Clear All */}
      <button
        type="button"
        aria-label="Clear all"
        className={buttonClass}
        title="Clear all"
        onClick={onClearAll}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
      <div className="mt-3 h-px w-10 bg-slate-600" />
      <button
        type="button"
        aria-label="Toggle simulation"
        className={simulationEnabled ? activeButtonClass : buttonClass}
        title="Toggle simulation view"
        onClick={onToggleSimulation}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      
      

    </aside>
  );
};

export default LeftToolbar;
