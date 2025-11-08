import * as GiIcons from 'react-icons/gi';
import * as MdIcons from 'react-icons/md';
import * as IoIcons from 'react-icons/io';

type StickerType = 'tree' | 'shrub' | 'grass' | 'building' | 'road' | 'waterbody';
type PlacingMode = StickerType | `remove${Capitalize<StickerType>}` | null;

type LeftToolbarProps = {
  placingMode: PlacingMode;
  onSetPlacingMode: (mode: PlacingMode) => void;
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
    'flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-slate-300 transition-all hover:bg-slate-600 hover:text-white active:scale-95';

  const activeButtonClass =
    'flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg ring-2 ring-blue-400';

  const GiPineTree = GiIcons.GiPineTree as React.ComponentType<{ className?: string }>;
  const GiFlowerPot = GiIcons.GiFlowerPot as React.ComponentType<{ className?: string }>;
  const GiGrass = GiIcons.GiGrass as React.ComponentType<{ className?: string }>;
  const GiModernCity = GiIcons.GiModernCity as React.ComponentType<{ className?: string }>;
  const GiRoad = GiIcons.GiRoad as React.ComponentType<{ className?: string }>;
  const GiWaterDrop = GiIcons.GiWaterDrop as React.ComponentType<{ className?: string }>;
  const MdClose = MdIcons.MdClose as React.ComponentType<{ className?: string }>;
  const IoMdRefresh = IoIcons.IoMdRefresh as React.ComponentType<{ className?: string }>;
  const IoMdPlay = IoIcons.IoMdPlay as React.ComponentType<{ className?: string }>;


  return (
    <aside className="flex flex-col gap-3 border-r border-slate-300 bg-slate-800 p-3 shadow-lg overflow-y-auto">
      {/* Tree Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Add tree"
          className={placingMode === 'tree' ? activeButtonClass : buttonClass}
          title="Add tree"
          onClick={() => onSetPlacingMode(placingMode === 'tree' ? null : 'tree')}
        >
          <GiPineTree className="h-6 w-6 text-green-500" />
        </button>
        <button
          type="button"
          aria-label="Remove tree"
          className={placingMode === 'removeTree' ? activeButtonClass : buttonClass}
          title="Remove tree"
          onClick={() => onSetPlacingMode(placingMode === 'removeTree' ? null : 'removeTree')}
        >
          <div className="relative">
            <GiPineTree className="h-6 w-6 text-red-500" />
            <MdClose className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      {/* Shrub Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Add shrub"
          className={placingMode === 'shrub' ? activeButtonClass : buttonClass}
          title="Add shrub"
          onClick={() => onSetPlacingMode(placingMode === 'shrub' ? null : 'shrub')}
        >
          <GiFlowerPot className="h-6 w-6 text-green-400" />
        </button>
        <button
          type="button"
          aria-label="Remove shrub"
          className={placingMode === 'removeShrub' ? activeButtonClass : buttonClass}
          title="Remove shrub"
          onClick={() => onSetPlacingMode(placingMode === 'removeShrub' ? null : 'removeShrub')}
        >
          <div className="relative">
            <GiFlowerPot className="h-6 w-6 text-red-500" />
            <MdClose className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      {/* Grass Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Add grass"
          className={placingMode === 'grass' ? activeButtonClass : buttonClass}
          title="Add grass"
          onClick={() => onSetPlacingMode(placingMode === 'grass' ? null : 'grass')}
        >
          <GiGrass className="h-6 w-6 text-green-300" />
        </button>
        <button
          type="button"
          aria-label="Remove grass"
          className={placingMode === 'removeGrass' ? activeButtonClass : buttonClass}
          title="Remove grass"
          onClick={() => onSetPlacingMode(placingMode === 'removeGrass' ? null : 'removeGrass')}
        >
          <div className="relative">
            <GiGrass className="h-6 w-6 text-red-500" />
            <MdClose className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      {/* Building Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Add building"
          className={placingMode === 'building' ? activeButtonClass : buttonClass}
          title="Add building"
          onClick={() => onSetPlacingMode(placingMode === 'building' ? null : 'building')}
        >
          <GiModernCity className="h-6 w-6 text-slate-400" />
        </button>
        <button
          type="button"
          aria-label="Remove building"
          className={placingMode === 'removeBuilding' ? activeButtonClass : buttonClass}
          title="Remove building"
          onClick={() => onSetPlacingMode(placingMode === 'removeBuilding' ? null : 'removeBuilding')}
        >
          <div className="relative">
            <GiModernCity className="h-6 w-6 text-red-500" />
            <MdClose className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      {/* Road Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Add road"
          className={placingMode === 'road' ? activeButtonClass : buttonClass}
          title="Add road"
          onClick={() => onSetPlacingMode(placingMode === 'road' ? null : 'road')}
        >
          <GiRoad className="h-6 w-6 text-slate-500" />
        </button>
        <button
          type="button"
          aria-label="Remove road"
          className={placingMode === 'removeRoad' ? activeButtonClass : buttonClass}
          title="Remove road"
          onClick={() => onSetPlacingMode(placingMode === 'removeRoad' ? null : 'removeRoad')}
        >
          <div className="relative">
            <GiRoad className="h-6 w-6 text-red-500" />
            <MdClose className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      {/* Waterbody Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Add waterbody"
          className={placingMode === 'waterbody' ? activeButtonClass : buttonClass}
          title="Add waterbody"
          onClick={() => onSetPlacingMode(placingMode === 'waterbody' ? null : 'waterbody')}
        >
          <GiWaterDrop className="h-6 w-6 text-blue-500" />
        </button>
        <button
          type="button"
          aria-label="Remove waterbody"
          className={placingMode === 'removeWaterbody' ? activeButtonClass : buttonClass}
          title="Remove waterbody"
          onClick={() => onSetPlacingMode(placingMode === 'removeWaterbody' ? null : 'removeWaterbody')}
        >
          <div className="relative">
            <GiWaterDrop className="h-6 w-6 text-red-500" />
            <MdClose className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      <div className="h-px w-full bg-slate-600" />

      {/* Utility Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label="Clear all"
          className={buttonClass}
          title="Clear all"
          onClick={onClearAll}
        >
          <IoMdRefresh className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Toggle simulation"
          className={simulationEnabled ? activeButtonClass : buttonClass}
          title="Toggle simulation view"
          onClick={onToggleSimulation}
        >
          <IoMdPlay className="h-6 w-6" />
        </button>
      </div>
    </aside>
  );
};

export default LeftToolbar;