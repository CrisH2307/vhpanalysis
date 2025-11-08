import {
  GiPineTree,
  GiFlowerPot,
  GiGrass,
  GiModernCity,
  GiRoad,
  GiWaterDrop
} from 'react-icons/gi';
import { MdClose } from 'react-icons/md';
import { IoMdRefresh, IoMdPlay } from 'react-icons/io';

// Type assertion to fix react-icons v5 TypeScript issue
const PineTree = GiPineTree as any;
const FlowerPot = GiFlowerPot as any;
const Grass = GiGrass as any;
const ModernCity = GiModernCity as any;
const Road = GiRoad as any;
const WaterDrop = GiWaterDrop as any;
const Close = MdClose as any;
const Refresh = IoMdRefresh as any;
const Play = IoMdPlay as any;

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
    'group relative flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white transition-all hover:bg-blue-500 active:bg-blue-700';

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
          <PineTree className="h-6 w-6 text-green-500" />
        </button>
        <button
          type="button"
          aria-label="Remove tree"
          className={placingMode === 'removeTree' ? activeButtonClass : buttonClass}
          title="Remove tree"
          onClick={() => onSetPlacingMode(placingMode === 'removeTree' ? null : 'removeTree')}
        >
          <div className="relative">
            <PineTree className="h-6 w-6 text-red-500" />
            <Close className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
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
          <FlowerPot className="h-6 w-6 text-green-400" />
        </button>
        <button
          type="button"
          aria-label="Remove shrub"
          className={placingMode === 'removeShrub' ? activeButtonClass : buttonClass}
          title="Remove shrub"
          onClick={() => onSetPlacingMode(placingMode === 'removeShrub' ? null : 'removeShrub')}
        >
          <div className="relative">
            <FlowerPot className="h-6 w-6 text-red-500" />
            <Close className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
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
          <Grass className="h-6 w-6 text-green-300" />
        </button>
        <button
          type="button"
          aria-label="Remove grass"
          className={placingMode === 'removeGrass' ? activeButtonClass : buttonClass}
          title="Remove grass"
          onClick={() => onSetPlacingMode(placingMode === 'removeGrass' ? null : 'removeGrass')}
        >
          <div className="relative">
            <Grass className="h-6 w-6 text-red-500" />
            <Close className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
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
          <ModernCity className="h-6 w-6 text-slate-400" />
        </button>
        <button
          type="button"
          aria-label="Remove building"
          className={placingMode === 'removeBuilding' ? activeButtonClass : buttonClass}
          title="Remove building"
          onClick={() => onSetPlacingMode(placingMode === 'removeBuilding' ? null : 'removeBuilding')}
        >
          <div className="relative">
            <ModernCity className="h-6 w-6 text-red-500" />
            <Close className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
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
          <Road className="h-6 w-6 text-slate-500" />
        </button>
        <button
          type="button"
          aria-label="Remove road"
          className={placingMode === 'removeRoad' ? activeButtonClass : buttonClass}
          title="Remove road"
          onClick={() => onSetPlacingMode(placingMode === 'removeRoad' ? null : 'removeRoad')}
        >
          <div className="relative">
            <Road className="h-6 w-6 text-red-500" />
            <Close className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
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
          <WaterDrop className="h-6 w-6 text-blue-500" />
        </button>
        <button
          type="button"
          aria-label="Remove waterbody"
          className={placingMode === 'removeWaterbody' ? activeButtonClass : buttonClass}
          title="Remove waterbody"
          onClick={() => onSetPlacingMode(placingMode === 'removeWaterbody' ? null : 'removeWaterbody')}
        >
          <div className="relative">
            <WaterDrop className="h-6 w-6 text-red-500" />
            <Close className="absolute -right-1 -top-1 h-3 w-3 text-white bg-red-600 rounded-full" />
          </div>
        </button>
      </div>

      <div className="h-px w-full bg-slate-600" />

      {/* Utility Buttons */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          aria-label="Clear all"
          className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg"
          title="Clear all"
          onClick={onClearAll}
        >
          Clear All
        </button>
        <button
          type="button"
          aria-label="Toggle simulation"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg"
          title="Toggle simulation view"
          onClick={onToggleSimulation}
        >
          Simulate
        </button>
      </div>
    </aside>
  );
};

export default LeftToolbar;
