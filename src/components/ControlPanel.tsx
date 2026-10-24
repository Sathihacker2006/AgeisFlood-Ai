import React, { useState } from 'react';
import { Sliders, Shield, AlertTriangle, Building2, MapPin, ChevronDown, ChevronUp, Radio, Crosshair, Waves } from 'lucide-react';
import { FloodEventStudyArea, ScenarioType, ImpactFormulaWeights, ResponseLocation } from '../types/flood';

interface ControlPanelProps {
  event: FloodEventStudyArea;
  scenario: ScenarioType;
  setScenario: (sc: ScenarioType) => void;
  threshold: number;
  setThreshold: (th: number) => void;
  weights: ImpactFormulaWeights;
  setWeights: (w: ImpactFormulaWeights) => void;
  activeDispatchCenter: ResponseLocation;
  setActiveDispatchCenter: (center: ResponseLocation) => void;
  totalFloodedAreaKm2: number;
  affectedRoadLengthKm: number;
  affectedBridgesCount: number;
  isolatedCount: number;
  meanConfidencePercent: number;
  isCoordinateInspectionActive?: boolean;
  setIsCoordinateInspectionActive?: (active: boolean) => void;
  showHydrograph?: boolean;
  setShowHydrograph?: (show: boolean) => void;
  theme?: 'dark' | 'light';
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  event,
  scenario,
  setScenario,
  threshold,
  setThreshold,
  weights,
  setWeights,
  activeDispatchCenter,
  setActiveDispatchCenter,
  totalFloodedAreaKm2,
  affectedRoadLengthKm,
  affectedBridgesCount,
  isolatedCount,
  meanConfidencePercent,
  isCoordinateInspectionActive,
  setIsCoordinateInspectionActive,
  showHydrograph,
  setShowHydrograph,
  theme = 'dark',
}) => {
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const isLight = theme === 'light';

  const handleWeightChange = (key: keyof ImpactFormulaWeights, value: number) => {
    const safeVal = isNaN(value) ? 0.25 : value;
    setWeights({
      w1_affectedLength: typeof weights?.w1_affectedLength === 'number' ? weights.w1_affectedLength : 0.35,
      w2_meanProbability: typeof weights?.w2_meanProbability === 'number' ? weights.w2_meanProbability : 0.25,
      w3_maxProbability: typeof weights?.w3_maxProbability === 'number' ? weights.w3_maxProbability : 0.25,
      w4_criticality: typeof weights?.w4_criticality === 'number' ? weights.w4_criticality : 0.15,
      [key]: safeVal,
    });
  };

  return (
    <div className={`border-b px-6 py-4 transition-colors ${
      isLight ? 'bg-white border-slate-300 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* High-Level Analytical KPI Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className={`rounded-lg p-3 border transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
            Detected Flood Extent
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              {totalFloodedAreaKm2.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>km²</span>
          </div>
          <div className={`text-[11px] mt-1 truncate ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {event.polygons.length} discrete inundation zones
          </div>
        </div>

        <div className={`rounded-lg p-3 border transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
            Potentially Affected Roads
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              {affectedRoadLengthKm.toFixed(1)}
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>km</span>
          </div>
          <div className={`text-[11px] mt-1 truncate ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            OSM segments intersecting P &gt; {(threshold * 100).toFixed(0)}%
          </div>
        </div>

        <div className={`rounded-lg p-3 border transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
            Critical Bridges At Risk
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              {affectedBridgesCount}
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>structures</span>
          </div>
          <div className={`text-[11px] mt-1 truncate ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Includes {event.bridges.filter(b => b.isArticulationPoint).length} articulation cut-edges
          </div>
        </div>

        <div className={`rounded-lg p-3 border transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className={`text-[11px] font-medium uppercase tracking-wider flex items-center justify-between ${
            isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'
          }`}>
            <span>Candidate Isolated Areas</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              {isolatedCount}
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>communities</span>
          </div>
          <div className={`text-[11px] font-medium mt-1 truncate ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>
            Requires field verification
          </div>
        </div>

        <div className={`rounded-lg p-3 border transition-colors col-span-2 md:col-span-1 ${
          isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className={`text-[11px] font-medium uppercase tracking-wider flex items-center justify-between ${
            isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'
          }`}>
            <span>Model Confidence</span>
            <Shield className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tabular-nums ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              {meanConfidencePercent.toFixed(1)}
            </span>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>%</span>
          </div>
          <div className={`text-[11px] mt-1 truncate font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {event.satelliteMetadata.sensor} ({event.satelliteMetadata.polarization})
          </div>
        </div>
      </div>

      {/* Interactive Controls & Scenario Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pt-2 border-t text-xs ${
        isLight ? 'border-slate-200 text-slate-800' : 'border-slate-800/80 text-slate-300'
      }`}>
        {/* Scenario Selection Segmented Tabs */}
        <div className="flex items-center gap-3">
          <span className={`font-medium whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Disruption Scenario:</span>
          <div className={`flex items-center p-1 rounded-lg border ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setScenario('scenario-1')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                scenario === 'scenario-1'
                  ? isLight ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. High-Confidence (P&gt;0.85)
            </button>
            <button
              onClick={() => setScenario('scenario-2')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                scenario === 'scenario-2'
                  ? isLight ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Moderate + High (P&gt;0.60)
            </button>
            <button
              onClick={() => setScenario('scenario-3')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                scenario === 'scenario-3'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. Bridges Severed
            </button>
            <button
              onClick={() => setScenario('scenario-4')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                scenario === 'scenario-4'
                  ? isLight ? 'bg-amber-600 text-white font-bold shadow-sm' : 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4. Probabilistic Sim
            </button>
          </div>
        </div>

        {/* Probability Threshold Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`font-medium whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>P(Flood) Cutoff:</span>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={typeof threshold === 'number' && !isNaN(threshold) ? threshold : 0.65}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setThreshold(isNaN(val) ? 0.65 : val);
              }}
              className="w-24 accent-cyan-500 cursor-pointer"
            />
            <span className={`font-mono tabular-nums font-semibold w-9 text-right ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
              {((typeof threshold === 'number' && !isNaN(threshold) ? threshold : 0.65) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Active Dispatch Root Selector */}
          <div className={`flex items-center gap-2 pl-3 border-l ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
            <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <span className={`font-medium whitespace-nowrap ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Origin Hub:</span>
            <select
              value={activeDispatchCenter?.id || (event.responseCenters?.[0]?.id ?? '')}
              onChange={(e) => {
                const found = event.responseCenters.find(c => c.id === e.target.value);
                if (found) setActiveDispatchCenter(found);
              }}
              className={`border rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[220px] truncate cursor-pointer ${
                isLight ? 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400' : 'bg-slate-950 text-slate-200 border-slate-700'
              }`}
            >
              {event.responseCenters.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Weight tuning button toggle */}
          <button
            onClick={() => setShowWeightSliders(!showWeightSliders)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border font-medium transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Sliders className={`w-3 h-3 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            Impact Formula Weights
            {showWeightSliders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Coordinate & Flood Probability Inspector Toggle */}
          {setIsCoordinateInspectionActive && (
            <button
              onClick={() => setIsCoordinateInspectionActive(!isCoordinateInspectionActive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                isCoordinateInspectionActive
                  ? isLight
                    ? 'bg-cyan-600 text-white font-bold border-cyan-600 shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm shadow-cyan-500/30'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="Toggle real-time cursor coordinate and flood probability inspection tool"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isCoordinateInspectionActive ? 'animate-spin' : ''}`} />
              <span>Inspector Probe</span>
              <span className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                isCoordinateInspectionActive
                  ? isLight ? 'bg-cyan-800 text-white font-bold' : 'bg-slate-950 text-cyan-300 font-bold'
                  : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>
                {isCoordinateInspectionActive ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Historical Trend Line Chart Hydrograph Toggle */}
          {setShowHydrograph && (
            <button
              onClick={() => setShowHydrograph(!showHydrograph)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                showHydrograph
                  ? isLight
                    ? 'bg-cyan-600 text-white font-bold border-cyan-600 shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm shadow-cyan-500/30'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="Toggle historical simulated water level rise trend line chart (Recharts) & flooding progression timeline"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Water Level Trend</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                showHydrograph
                  ? isLight ? 'bg-cyan-800 text-white font-bold' : 'bg-slate-950 text-cyan-300 font-bold'
                  : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>
                {showHydrograph ? 'CHART ON' : 'TREND'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Configurable Impact Formula Weight Sliders */}
      {showWeightSliders && (
        <div className={`mt-3 p-3 border rounded-lg text-xs space-y-2.5 transition-colors ${
          isLight ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-sm' : 'bg-slate-950/90 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Formula: ImpactScore = 100 × [w₁·Ratio + w₂·MeanP + w₃·MaxP + w₄·(Class/5)]
            </span>
            <span className={`text-[11px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
              Sum of weights: {(
                (weights?.w1_affectedLength ?? 0.35) +
                (weights?.w2_meanProbability ?? 0.25) +
                (weights?.w3_maxProbability ?? 0.25) +
                (weights?.w4_criticality ?? 0.15)
              ).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
            <div>
              <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                <span>w₁ Length Ratio</span>
                <span className={`font-mono ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>{(weights?.w1_affectedLength ?? 0.35).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.05"
                value={typeof weights?.w1_affectedLength === 'number' && !isNaN(weights.w1_affectedLength) ? weights.w1_affectedLength : 0.35}
                onChange={(e) => handleWeightChange('w1_affectedLength', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                <span>w₂ Mean Flood Prob</span>
                <span className={`font-mono ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>{(weights?.w2_meanProbability ?? 0.25).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.05"
                value={typeof weights?.w2_meanProbability === 'number' && !isNaN(weights.w2_meanProbability) ? weights.w2_meanProbability : 0.25}
                onChange={(e) => handleWeightChange('w2_meanProbability', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                <span>w₃ Max Flood Prob</span>
                <span className={`font-mono ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>{(weights?.w3_maxProbability ?? 0.25).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.60"
                step="0.05"
                value={typeof weights?.w3_maxProbability === 'number' && !isNaN(weights.w3_maxProbability) ? weights.w3_maxProbability : 0.25}
                onChange={(e) => handleWeightChange('w3_maxProbability', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className={`flex justify-between mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                <span>w₄ Road Criticality</span>
                <span className={`font-mono ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}>{(weights?.w4_criticality ?? 0.15).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.05"
                value={typeof weights?.w4_criticality === 'number' && !isNaN(weights.w4_criticality) ? weights.w4_criticality : 0.15}
                onChange={(e) => handleWeightChange('w4_criticality', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
