import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  Compass,
  Activity,
  ArrowRight,
  HelpCircle,
  Target,
  Crosshair,
  Wrench,
  Check,
  Truck,
  PhoneCall,
  Waves,
  Shield,
  CloudRain,
  Droplets,
  Radio,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { FloodEventStudyArea } from '../types/flood';

interface InspectionDrawerProps {
  selectedType: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon' | 'gauge' | null;
  selectedData: any;
  onClose: () => void;
  event: FloodEventStudyArea;
  onSelectFeature?: (
    type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon' | 'gauge',
    data: any
  ) => void;
  isCoordinateInspectionActive?: boolean;
  setIsCoordinateInspectionActive?: (active: boolean) => void;
  theme?: 'dark' | 'light';
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  selectedType,
  selectedData,
  onClose,
  event,
  onSelectFeature,
  isCoordinateInspectionActive,
  setIsCoordinateInspectionActive,
  theme = 'dark',
}) => {
  const [sarViewTab, setSarViewTab] = useState<'pre_post' | 'radar_delta' | 'optical'>('pre_post');
  const [simulatedBridgeDefense, setSimulatedBridgeDefense] = useState<'none' | 'berm' | 'severed'>('none');
  const [isDispatchTasked, setIsDispatchTasked] = useState(false);
  const isLight = theme === 'light';

  if (!selectedType || !selectedData) return null;

  const handleRecenterSelf = () => {
    if (onSelectFeature && selectedType) {
      onSelectFeature(selectedType, selectedData);
    }
  };

  return (
    <div className={`w-full md:w-[420px] border-l flex flex-col h-full overflow-y-auto text-xs shadow-2xl z-20 animate-slide-in-right transition-colors ${
      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
    }`}>
      {/* Header with Recenter, Probe Toggle and Close Actions */}
      <div className={`p-4 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 transition-colors ${
        isLight ? 'bg-slate-100/95 border-slate-300' : 'bg-slate-950/80 border-slate-800'
      }`}>
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
            {selectedType === 'road' && 'Road Infrastructure Element'}
            {selectedType === 'bridge' && 'Critical Bridge Articulation Point'}
            {selectedType === 'isolated' && 'Candidate Potentially Isolated Area'}
            {selectedType === 'response' && 'Emergency Operations Center'}
            {selectedType === 'polygon' && 'Detected Flood Vector Polygon'}
            {selectedType === 'gauge' && 'Hydro-Meteorological Rain Gauge Station'}
          </div>
          <h3 className={`text-sm font-semibold truncate max-w-[280px] ${isLight ? 'text-slate-950' : 'text-white'}`}>
            {selectedData.name || selectedData.osmId || selectedData.id}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {setIsCoordinateInspectionActive && (
            <button
              onClick={() => setIsCoordinateInspectionActive(!isCoordinateInspectionActive)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                isCoordinateInspectionActive
                  ? isLight
                    ? 'bg-cyan-600 text-white font-bold border-cyan-600 shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : isLight
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Live Coordinate & Flood Probability Inspector Control"
            >
              <Crosshair className={`w-3 h-3 ${isCoordinateInspectionActive ? 'animate-spin' : isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              <span>Probe: {isCoordinateInspectionActive ? 'ON' : 'OFF'}</span>
            </button>
          )}
          <button
            onClick={handleRecenterSelf}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-medium transition-colors ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-cyan-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
            }`}
            title="Recenter and zoom to this feature on the map"
          >
            <Target className="w-3 h-3" />
            Recenter
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            aria-label="Close inspection panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ROAD INSPECTION */}
        {selectedType === 'road' && (
          <>
            {/* Status and Classification */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Impact Category:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    selectedData.currentCategory === 'HIGHLY_AFFECTED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : selectedData.currentCategory === 'POTENTIALLY_AFFECTED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedData.currentCategory?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Road Classification:</span>
                <span className="text-white font-mono uppercase">{selectedData.classification}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">OSM Identifier:</span>
                <span className="text-cyan-400 font-mono">{selectedData.osmId}</span>
              </div>
            </div>

            {/* Impact Metric Breakdown */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-white uppercase tracking-wider mb-1">
                Quantitative Flood Metrics
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Total Length</span>
                  <span className="font-mono text-white text-sm font-semibold">
                    {(selectedData.totalLengthMeters / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Affected Length</span>
                  <span className="font-mono text-rose-400 text-sm font-semibold">
                    {(selectedData.affectedLengthMeters / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Segment Inundation %</span>
                  <span className="font-mono text-amber-400 text-sm font-semibold">
                    {(selectedData.affectedLengthRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Mean P(Flood)</span>
                  <span className="font-mono text-cyan-400 text-sm font-semibold">
                    {(selectedData.meanFloodProbability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Calculated Impact Score:</span>
                <span className="font-mono font-bold text-base text-rose-400">
                  {selectedData.currentImpactScore ?? selectedData.impactScore} / 100
                </span>
              </div>

              {selectedData.nearestFloodPolygonId && (
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Intersecting Flood Zone:</span>
                  <button
                    onClick={() => {
                      const poly = event.polygons.find((p) => p.id === selectedData.nearestFloodPolygonId);
                      if (poly && onSelectFeature) onSelectFeature('polygon', poly);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline text-[10px]"
                    title="Click to center and zoom map to this flood zone"
                  >
                    <Target className="w-3 h-3 text-cyan-400" />
                    <span className="truncate max-w-[200px]">
                      {event.polygons.find((p) => p.id === selectedData.nearestFloodPolygonId)?.name ||
                        selectedData.nearestFloodPolygonId}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Remote Sensing Supporting Evidence (Section 25) */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                  Supporting Remote-Sensing Imagery
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Sentinel-1 GRD</span>
              </div>

              {/* Imagery Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 text-[10px]">
                <button
                  onClick={() => setSarViewTab('pre_post')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    sarViewTab === 'pre_post' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Pre / Post SAR
                </button>
                <button
                  onClick={() => setSarViewTab('optical')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    sarViewTab === 'optical' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Optical / SWIR
                </button>
                <button
                  onClick={() => setSarViewTab('radar_delta')}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    sarViewTab === 'radar_delta' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Elevation / DEM
                </button>
              </div>

              {/* Image Previews */}
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video relative">
                {sarViewTab === 'pre_post' && (
                  <div className="grid grid-cols-2 h-full">
                    <div className="relative border-r border-slate-800">
                      <img
                        src={event.sarPreFloodImage}
                        alt="Pre-flood Sentinel-1 SAR"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono text-slate-300">
                        Pre: Normal (VV)
                      </span>
                    </div>
                    <div className="relative">
                      <img
                        src={event.sarPostFloodImage}
                        alt="Post-flood Sentinel-1 SAR"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 left-1 bg-rose-950/90 text-rose-300 border border-rose-800 px-1 py-0.5 rounded text-[9px] font-mono">
                        Post: Inundated (Dark)
                      </span>
                    </div>
                  </div>
                )}

                {sarViewTab === 'optical' && (
                  <div className="h-full relative">
                    <img
                      src={event.opticalPostFloodImage}
                      alt="Sentinel-2 Optical False Color"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300">
                      Sentinel-2 False Color (NIR/SWIR)
                    </span>
                  </div>
                )}

                {sarViewTab === 'radar_delta' && (
                  <div className="h-full relative">
                    <img
                      src={event.demElevationImage}
                      alt="Digital Elevation Model Topography"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300">
                      USGS 3DEP Digital Elevation (DEM)
                    </span>
                  </div>
                )}
              </div>

              {/* Physical Signal Provenance */}
              <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
                <div className="flex justify-between">
                  <span>SAR Backscatter Delta:</span>
                  <span className="text-cyan-400 font-semibold">
                    {selectedData.evidence.sarBackscatterDeltaDb.toFixed(1)} dB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Terrain Elevation:</span>
                  <span className="text-slate-200">
                    {selectedData.evidence.terrainElevationMeters} m ASL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SAR Detection Confidence:</span>
                  <span className="text-emerald-400 font-semibold">
                    {(selectedData.evidence.sarConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* BRIDGE INSPECTION */}
        {selectedType === 'bridge' && (
          <>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Bridge Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    selectedData.isCurrentlySevered
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedData.isCurrentlySevered ? 'POTENTIALLY SEVERED' : 'PASSABLE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Waterway Crossing:</span>
                <span className="text-white font-semibold">{selectedData.waterwayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Carried Roadway:</span>
                <span className="text-slate-200">{selectedData.roadName}</span>
              </div>
            </div>

            {/* Network Topology Criticality */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-semibold text-white uppercase tracking-wider">
                Graph Network Criticality Analysis
              </div>

              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Articulation Point (Cut-Edge):</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedData.isArticulationPoint ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {selectedData.isArticulationPoint ? 'YES (CRITICAL)' : 'NO'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {selectedData.isArticulationPoint
                    ? 'Removal of this bridge structurally partitions the road graph into two disconnected components, isolating downstream hollows.'
                    : 'Alternate bypass paths exist across parallel ridge connectors.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Betweenness Centrality</span>
                  <span className="font-mono text-cyan-400 text-sm font-semibold">
                    {(selectedData.betweennessCentrality * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Detour Penalty</span>
                  <span className="font-mono text-amber-400 text-sm font-semibold">
                    +{selectedData.detourDistanceKm} km
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive "What-If" Field Defense Sandbox */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  What-If Mitigation Simulation
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Interactive</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  onClick={() => setSimulatedBridgeDefense('none')}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition-colors ${
                    simulatedBridgeDefense === 'none'
                      ? 'bg-slate-800 text-white border-slate-600 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Baseline Model
                </button>
                <button
                  onClick={() => setSimulatedBridgeDefense('berm')}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition-colors ${
                    simulatedBridgeDefense === 'berm'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                      : 'bg-slate-900/60 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/40'
                  }`}
                >
                  Deploy Berm (+1.5m)
                </button>
                <button
                  onClick={() => setSimulatedBridgeDefense('severed')}
                  className={`py-1.5 px-2 rounded border text-center font-medium transition-colors ${
                    simulatedBridgeDefense === 'severed'
                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                      : 'bg-slate-900/60 text-rose-400 border-rose-900/50 hover:bg-rose-950/40'
                  }`}
                >
                  Force Severed
                </button>
              </div>

              {simulatedBridgeDefense === 'berm' && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Mobile Inundation Barrier Sim Active
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Synthetic sandbag dikes & high-volume dewatering pumps model effective clearance of +1.5m water stage. Structure estimated safe for emergency traffic.
                  </p>
                </div>
              )}

              {simulatedBridgeDefense === 'severed' && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    Catastrophic Deck Failure Simulated
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Traffic completely blocked across {selectedData.waterwayName}. Network reroutes all emergency transport adding {selectedData.detourDistanceKm} km detour.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* CANDIDATE ISOLATED AREA INSPECTION */}
        {selectedType === 'isolated' && (
          <>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Isolation Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedData.isIsolated
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedData.isIsolated ? 'CANDIDATE POTENTIALLY ISOLATED' : 'REACHABLE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Estimated Population:</span>
                <span className="text-white font-mono font-semibold">
                  {selectedData.estimatedPopulation.toLocaleString()} residents
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Community Type:</span>
                <span className="text-slate-200">{selectedData.type}</span>
              </div>
            </div>

            {/* Route Failure Diagnostics */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-white uppercase tracking-wider">
                Graph Reachability Diagnostics
              </div>
              <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded space-y-1 text-[11px]">
                <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Primary Ingress Corridor Severed
                </div>
                <p className="text-slate-400 text-[10px]">
                  Dispatch routing from active EOC failed across {selectedData.failedRoutesCount} candidate paths due to road/bridge inundation.
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-slate-300 pt-1">
                {selectedData.nearestSeveredBridgeId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Severed Bridge Choke:</span>
                    <button
                      onClick={() => {
                        const brg = event.bridges.find((b) => b.id === selectedData.nearestSeveredBridgeId);
                        if (brg && onSelectFeature) onSelectFeature('bridge', brg);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline text-[10px]"
                      title="Click to center and zoom map to this severed bridge"
                    >
                      <Target className="w-3 h-3 text-rose-400" />
                      <span className="truncate max-w-[190px]">
                        {event.bridges.find((b) => b.id === selectedData.nearestSeveredBridgeId)?.name ||
                          selectedData.nearestSeveredBridgeId}
                      </span>
                    </button>
                  </div>
                )}

                {selectedData.nearestSeveredRoadId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Severed Ingress Road:</span>
                    <button
                      onClick={() => {
                        const rd = event.roads.find((r) => r.id === selectedData.nearestSeveredRoadId);
                        if (rd && onSelectFeature) onSelectFeature('road', rd);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline text-[10px]"
                      title="Click to center and zoom map to this severed road"
                    >
                      <Target className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[190px]">
                        {event.roads.find((r) => r.id === selectedData.nearestSeveredRoadId)?.name ||
                          selectedData.nearestSeveredRoadId}
                      </span>
                    </button>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Recommended Rescue Mode:</span>
                  <span className="text-amber-400 font-semibold">{selectedData.requiredAssistanceMode}</span>
                </div>
              </div>
            </div>

            {/* Incident Dispatch & Tasking Sandbox */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  EOC Asset Dispatch Tasking
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Incident Command</span>
              </div>

              {!isDispatchTasked ? (
                <button
                  onClick={() => setIsDispatchTasked(true)}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Commit Dispatch Unit to {selectedData.name}</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Dispatch Tasking Active
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200">
                      TASKED
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Callsign:</span>
                      <span className="text-white font-bold">RESCUE-BRAVO-12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Asset:</span>
                      <span className="text-cyan-300">{selectedData.requiredAssistanceMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Transit:</span>
                      <span className="text-amber-300">~24 mins (Least-Impedance Corridor)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDispatchTasked(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline mt-1"
                  >
                    Cancel Tasking
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* FLOOD POLYGON INSPECTION */}
        {selectedType === 'polygon' && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Geodesic Area:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {selectedData.areaKm2.toFixed(2)} km²
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Perimeter:</span>
              <span className="font-mono text-slate-200">
                {selectedData.perimeterKm.toFixed(1)} km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Mean P(Flood):</span>
              <span className="font-mono text-cyan-400">
                {(selectedData.meanFloodProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Max Depth Est:</span>
              <span className="font-mono text-amber-400">
                {selectedData.maxDepthEstimateMeters} m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Detection Sensor:</span>
              <span className="font-mono text-slate-300">{selectedData.sourceSensor}</span>
            </div>
          </div>
        )}

        {/* RAIN GAUGE TELEMETRY STATION INSPECTION */}
        {selectedType === 'gauge' && (
          <div className="space-y-3">
            {/* Station Overview */}
            <div className={`p-3 rounded-lg border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Station Code:</span>
                <span className="font-mono font-bold text-cyan-400">{selectedData.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">River Drainage:</span>
                <span className="text-slate-200 font-semibold">{selectedData.streamName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Sub-Basin:</span>
                <span className="text-slate-300 text-[11px] truncate max-w-[200px]">{selectedData.basinName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Elevation:</span>
                <span className="font-mono text-slate-300">{selectedData.elevationMeters} m ASL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Flood Stage Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                    selectedData.stageStatus === 'Flash Flood Emergency'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : selectedData.stageStatus === 'Warning'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : selectedData.stageStatus === 'Advisory'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {selectedData.stageStatus}
                </span>
              </div>
            </div>

            {/* Precipitation Rate & Accumulation Grid */}
            <div className={`p-3 rounded-lg border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                Live Hydro-Meteorological Telemetry
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Instantaneous Rate</div>
                  <div className={`font-mono text-sm font-bold mt-0.5 ${
                    selectedData.currentRateMmPerHour > 25 ? 'text-rose-500' : selectedData.currentRateMmPerHour > 10 ? 'text-amber-500' : 'text-cyan-400'
                  }`}>
                    {selectedData.currentRateMmPerHour} mm/h
                  </div>
                </div>

                <div className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">1-Hour Accumulation</div>
                  <div className="font-mono text-sm font-bold text-slate-200 mt-0.5">
                    {selectedData.accumulation1hMm} mm
                  </div>
                </div>

                <div className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">6-Hour Accumulation</div>
                  <div className="font-mono text-sm font-bold text-slate-200 mt-0.5">
                    {selectedData.accumulation6hMm} mm
                  </div>
                </div>

                <div className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">24-Hour Storm Total</div>
                  <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">
                    {selectedData.accumulation24hMm} mm
                  </div>
                </div>
              </div>

              {/* Soil Saturation Indicator */}
              <div className="pt-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Soil Moisture Saturation (Infiltration Capacity)</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedData.soilSaturationPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      selectedData.soilSaturationPercent >= 95 ? 'bg-rose-500' : selectedData.soilSaturationPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedData.soilSaturationPercent}%` }}
                  />
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  {selectedData.soilSaturationPercent >= 95
                    ? 'CRITICAL SATURATION: Zero infiltration buffer. 100% of additional precipitation converts immediately to surface overland runoff.'
                    : 'Soil holding capacity remaining. Partial absorption active.'}
                </div>
              </div>
            </div>

            {/* Tactical Incident Action */}
            <div className={`p-3 rounded-lg border space-y-1.5 ${
              isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-950/20 border-amber-500/30'
            }`}>
              <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                Downstream Early Warning Threshold
              </div>
              <p className="text-[11px] text-slate-300">
                Data relayed to Unified Command every 5 minutes. Flash flood crest propagation lag to downstream road crossings is estimated at <strong>25–40 minutes</strong>.
              </p>
            </div>
          </div>
        )}

        {/* PROVENANCE AND ETHICAL SAFETY NOTICE (Prompt Section 41) */}
        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-[10px] text-amber-200/90 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-400 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            Operational Decision-Support Protocol
          </div>
          <p>
            All predictions shown are derived from Sentinel-1 SAR and GIS graph topology. Results represent
            <strong> candidate estimates</strong> and must not be treated as confirmed physical ground truth.
            Emergency dispatch requires field verification and local emergency coordinator authorization.
          </p>
        </div>
      </div>
    </div>
  );
};
