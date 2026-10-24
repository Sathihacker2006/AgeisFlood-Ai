import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Mountain,
  Waves,
  Shield,
  AlertTriangle,
  Building2,
  MapPin,
  Route,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

interface Terrain3DLegendProps {
  showTerrainMesh: boolean;
  setShowTerrainMesh: (val: boolean) => void;
  showWaterSurface: boolean;
  setShowWaterSurface: (val: boolean) => void;
  showRoads3D: boolean;
  setShowRoads3D: (val: boolean) => void;
  showBridges3D: boolean;
  setShowBridges3D: (val: boolean) => void;
  showFacilities3D: boolean;
  setShowFacilities3D: (val: boolean) => void;
  showIsolated3D: boolean;
  setShowIsolated3D: (val: boolean) => void;
  showRoutes3D: boolean;
  setShowRoutes3D: (val: boolean) => void;
  verticalExaggeration: number;
  waterLevelOffset: number;
  waterOpacity: number;
  eventId: string;
}

export const Terrain3DLegend: React.FC<Terrain3DLegendProps> = ({
  showTerrainMesh,
  setShowTerrainMesh,
  showWaterSurface,
  setShowWaterSurface,
  showRoads3D,
  setShowRoads3D,
  showBridges3D,
  setShowBridges3D,
  showFacilities3D,
  setShowFacilities3D,
  showIsolated3D,
  setShowIsolated3D,
  showRoutes3D,
  setShowRoutes3D,
  verticalExaggeration,
  waterLevelOffset,
  waterOpacity,
  eventId,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'terrain' | 'flood' | 'infrastructure'>('all');

  // Count active layers
  const totalLayers = 7;
  const activeCount = [
    showTerrainMesh,
    showWaterSurface,
    showRoads3D,
    showBridges3D,
    showFacilities3D,
    showIsolated3D,
    showRoutes3D,
  ].filter(Boolean).length;

  // Elevation metadata per event
  const elevationInfo = {
    'kentucky-2022': {
      valley: '220m ASL (River Valley)',
      ridge: '450m ASL (Appalachian Ridge)',
      geology: 'Dendritic Hollows / Karst Plateau',
    },
    'houston-harvey-2017': {
      valley: '12m ASL (Buffalo Bayou)',
      ridge: '28m ASL (Coastal Prairie)',
      geology: 'Shallow Floodplain Depression',
    },
    'emilia-romagna-2023': {
      valley: '30m ASL (Po Basin Plain)',
      ridge: '140m ASL (Apennine Foothills)',
      geology: 'Alluvial Fan & River Levees',
    },
  }[eventId] || {
    valley: '100m ASL (Valley Floor)',
    ridge: '380m ASL (Ridge Crest)',
    geology: 'Digital Elevation Model (3DEP)',
  };

  return (
    <aside
      aria-label="3D Terrain & Inundation Symbology Legend"
      className="absolute bottom-4 left-4 z-20 transition-all duration-300 ease-in-out pointer-events-auto"
    >
      {!isExpanded ? (
        /* Collapsed Pill Button */
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-500/70 transition-all group"
          title="Click to expand persistent 3D symbology legend"
        >
          <div className="p-1 rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-400 group-hover:scale-105 transition-transform">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-tight">3D Symbology Legend</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            {activeCount}/{totalLayers} Active
          </span>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors ml-0.5" />
        </button>
      ) : (
        /* Expanded Legend Panel */
        <div className="w-[330px] sm:w-[360px] max-h-[75vh] flex flex-col rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl text-xs text-slate-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight text-xs flex items-center gap-1.5">
                  3D Symbology Legend
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                    {activeCount}/{totalLayers} ON
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Real-time surface, hydraulics & infrastructure states
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Collapse Legend"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-950/40 border-b border-slate-800 text-[10px]">
            <span className="text-slate-500 font-medium mr-1">Filter:</span>
            {(['all', 'terrain', 'flood', 'infrastructure'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 rounded capitalize transition-colors font-medium ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scrollable Legend Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
            {/* 1. TERRAIN & HYPSOMETRIC ELEVATION */}
            {(activeCategory === 'all' || activeCategory === 'terrain') && (
              <div
                className={`rounded-lg p-2.5 border transition-all ${
                  showTerrainMesh
                    ? 'bg-slate-800/50 border-slate-700/80'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
                    <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Topographic DEM Surface</span>
                  </div>
                  <button
                    onClick={() => setShowTerrainMesh(!showTerrainMesh)}
                    className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors text-slate-300 hover:text-white bg-slate-800 border border-slate-700"
                    title={showTerrainMesh ? 'Click to hide terrain mesh' : 'Click to show terrain mesh'}
                  >
                    {showTerrainMesh ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-400">HIDDEN</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hypsometric Gradient Bar */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Hypsometric Tint Elevation Ramp</span>
                    <span className="font-mono text-cyan-400">{verticalExaggeration.toFixed(1)}× Exag</span>
                  </div>
                  <div className="h-3 rounded w-full bg-gradient-to-r from-emerald-900 via-amber-800 to-slate-400 border border-slate-700 relative flex items-center justify-between px-1.5 text-[8px] font-mono font-bold text-white shadow-inner">
                    <span>Valley Low</span>
                    <span>Mid Slope</span>
                    <span>Peak Crest</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                    <span>{elevationInfo.valley}</span>
                    <span>{elevationInfo.ridge}</span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-emerald-800 border border-emerald-500/50"></span>
                    <span>Valley Trough</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-slate-300 border border-slate-400"></span>
                    <span>Ridge Summits</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FLOOD INUNDATION SURFACE */}
            {(activeCategory === 'all' || activeCategory === 'flood') && (
              <div
                className={`rounded-lg p-2.5 border transition-all ${
                  showWaterSurface
                    ? 'bg-slate-800/50 border-cyan-800/60'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
                    <Waves className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Flood Inundation Surface</span>
                  </div>
                  <button
                    onClick={() => setShowWaterSurface(!showWaterSurface)}
                    className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors text-slate-300 hover:text-white bg-slate-800 border border-slate-700"
                    title={showWaterSurface ? 'Click to hide water surface' : 'Click to show water surface'}
                  >
                    {showWaterSurface ? (
                      <>
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-300">ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-400">HIDDEN</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3 rounded bg-cyan-500/70 border border-cyan-300/80 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
                      <div>
                        <div className="text-slate-200 font-medium">Volumetric Water Sheet</div>
                        <div className="text-[9px] text-slate-400">Synthetic hydraulic crest elevation</div>
                      </div>
                    </div>
                    <span className="font-mono text-cyan-300 text-[10px] bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                      {waterLevelOffset >= 0 ? `+${waterLevelOffset.toFixed(1)}` : waterLevelOffset.toFixed(1)} m
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                    <span>Fluid Translucency:</span>
                    <span className="font-mono text-slate-300">{Math.round(waterOpacity * 100)}%</span>
                  </div>
                  <div className="text-[9px] text-cyan-400/80 italic leading-tight">
                    * Interactive depth offset simulates crest wave surge along valley floors.
                  </div>
                </div>
              </div>
            )}

            {/* 3. INFRASTRUCTURE & NETWORK STATES */}
            {(activeCategory === 'all' || activeCategory === 'infrastructure') && (
              <div className="rounded-lg p-2.5 bg-slate-800/50 border border-slate-700/80 space-y-2.5">
                <div className="font-bold text-slate-100 text-[11px] pb-1 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Infrastructure & Hazard States</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-normal">Context Synced</span>
                </div>

                {/* Roads */}
                <div
                  className={`p-2 rounded bg-slate-900/70 border transition-all ${
                    showRoads3D ? 'border-slate-800' : 'border-slate-800/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/60">
                    <div className="font-semibold text-slate-200 text-[10px] flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-amber-400"></span>
                      <span>3D Road Network</span>
                    </div>
                    <button
                      onClick={() => setShowRoads3D(!showRoads3D)}
                      className="text-[9px] font-mono text-slate-400 hover:text-white"
                    >
                      {showRoads3D ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded-sm bg-emerald-500 shadow-sm"></span>
                        <span className="text-slate-300">Safe / Passable Segment</span>
                      </div>
                      <span className="font-mono text-[9px] text-emerald-400">Score &lt; 0.35</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded-sm bg-amber-500"></span>
                        <span className="text-slate-300">Vulnerable / At-Risk</span>
                      </div>
                      <span className="font-mono text-[9px] text-amber-400">Moderate Hazard</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded-sm bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"></span>
                        <span className="text-slate-300 font-medium text-rose-300">Submerged / Severed</span>
                      </div>
                      <span className="font-mono text-[9px] text-rose-400 font-bold">Impassable</span>
                    </div>
                  </div>
                </div>

                {/* Bridges */}
                <div
                  className={`p-2 rounded bg-slate-900/70 border transition-all ${
                    showBridges3D ? 'border-slate-800' : 'border-slate-800/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/60">
                    <div className="font-semibold text-slate-200 text-[10px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-cyan-400"></span>
                      <span>Bridge Structures</span>
                    </div>
                    <button
                      onClick={() => setShowBridges3D(!showBridges3D)}
                      className="text-[9px] font-mono text-slate-400 hover:text-white"
                    >
                      {showBridges3D ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-emerald-400"></span>
                        <span className="text-slate-300">Intact Elevated Deck</span>
                      </div>
                      <span className="font-mono text-[9px] text-emerald-400">Passable</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.7)]"></span>
                        <span className="text-slate-300 font-medium text-rose-300">Submerged Deck Arch</span>
                      </div>
                      <span className="font-mono text-[9px] text-rose-400 font-bold">Structural Hazard</span>
                    </div>
                  </div>
                </div>

                {/* Isolated Communities */}
                <div
                  className={`p-2 rounded bg-slate-900/70 border transition-all ${
                    showIsolated3D ? 'border-slate-800' : 'border-slate-800/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/60">
                    <div className="font-semibold text-slate-200 text-[10px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Isolated Population Pockets</span>
                    </div>
                    <button
                      onClick={() => setShowIsolated3D(!showIsolated3D)}
                      className="text-[9px] font-mono text-slate-400 hover:text-white"
                    >
                      {showIsolated3D ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-ping"></span>
                      <span className="text-slate-300">Pulsing Hazard Beacon</span>
                    </div>
                    <span className="text-[9px] text-rose-300 font-mono">0 Outbound Roads</span>
                  </div>
                </div>

                {/* Response Centers & Route Corridors */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <div
                    className={`p-1.5 rounded bg-slate-900/70 border text-[10px] space-y-1 transition-all ${
                      showFacilities3D ? 'border-slate-800' : 'border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300 flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 text-blue-400" />
                        EOC Towers
                      </span>
                      <button
                        onClick={() => setShowFacilities3D(!showFacilities3D)}
                        className="text-[8px] font-mono text-slate-500 hover:text-white"
                      >
                        {showFacilities3D ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="text-[9px] text-blue-300">Staging Hubs</div>
                  </div>

                  <div
                    className={`p-1.5 rounded bg-slate-900/70 border text-[10px] space-y-1 transition-all ${
                      showRoutes3D ? 'border-slate-800' : 'border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300 flex items-center gap-1">
                        <Route className="w-2.5 h-2.5 text-cyan-400" />
                        Route Corridors
                      </span>
                      <button
                        onClick={() => setShowRoutes3D(!showRoutes3D)}
                        className="text-[8px] font-mono text-slate-500 hover:text-white"
                      >
                        {showRoutes3D ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="text-[9px] text-cyan-300">Optimal Ingress</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-3.5 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-cyan-400" />
              Click any layer badge to toggle visibility
            </span>
            <span className="font-mono text-slate-400">{eventId}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
