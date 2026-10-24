import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Waves,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Droplets,
  Layers,
} from 'lucide-react';
import { FloodEventStudyArea } from '../types/flood';
import { getHydrologicalProfile } from '../data/hydrologicalData';

interface HydrologicalTrendChartProps {
  event: FloodEventStudyArea;
  onActiveTimeStepChange?: (point: any) => void;
  theme?: 'dark' | 'light';
}

export const HydrologicalTrendChart: React.FC<HydrologicalTrendChartProps> = ({
  event,
  onActiveTimeStepChange,
  theme = 'dark',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeMetric, setActiveMetric] = useState<'stage' | 'discharge' | 'area'>('stage');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(6); // Default to peak crest
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const isLight = theme === 'light';

  const profile = event.hydrologicalProfile || getHydrologicalProfile(event.id);
  const data = profile.data;

  // Auto-play timer for progression visualization
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedPointIndex((prev) => {
          if (prev >= data.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, data.length]);

  // Notify parent if callback provided
  useEffect(() => {
    const point = data[selectedPointIndex];
    if (point && onActiveTimeStepChange) {
      onActiveTimeStepChange(point);
    }
  }, [selectedPointIndex, data, onActiveTimeStepChange]);

  // Reset selected point when event changes
  useEffect(() => {
    // Find crest index
    const crestIdx = data.findIndex((d) => d.status === 'Record Crest');
    setSelectedPointIndex(crestIdx >= 0 ? crestIdx : Math.floor(data.length / 2));
    setIsPlaying(false);
  }, [event.id, data]);

  const activePoint = data[selectedPointIndex] || data[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'Action Stage':
        return 'text-sky-400 bg-sky-950/60 border-sky-800';
      case 'Minor Flood':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'Moderate Flood':
        return 'text-orange-400 bg-orange-950/60 border-orange-800';
      case 'Major Flood':
      case 'Record Crest':
        return 'text-rose-400 bg-rose-950/60 border-rose-800';
      default:
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-2xl text-xs text-slate-200 z-50 min-w-[210px] pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5">
            <span className="font-mono text-cyan-400 font-semibold">{d.timestamp}</span>
            <span className="text-[10px] text-slate-400">{d.formattedTime}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gauge Stage:</span>
              <span className="font-mono font-bold text-white">
                {unitSystem === 'metric' ? `${d.stageMeters.toFixed(2)} m` : `${d.stageFeet.toFixed(1)} ft`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Stream Discharge:</span>
              <span className="font-mono text-cyan-300">
                {d.dischargeM3s.toLocaleString()} m³/s
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Flooded Extent:</span>
              <span className="font-mono text-amber-300">
                {d.floodedAreaKm2.toFixed(1)} km²
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Precipitation:</span>
              <span className="font-mono text-sky-300">
                {d.rainfallMmPerHour > 0 ? `${d.rainfallMmPerHour.toFixed(1)} mm/h` : '0 mm/h'}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Flood Classification:</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-semibold ${getStatusColor(d.status)}`}>
              {d.status}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`backdrop-blur-md border rounded-xl shadow-2xl transition-all duration-300 overflow-hidden text-xs ${
      isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/95 border-slate-800 text-slate-300'
    }`}>
      {/* Header Bar */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 ${
        isLight ? 'bg-slate-50/95 border-slate-200' : 'bg-slate-950/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg border shrink-0 ${
            isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60'
          }`}>
            <Waves className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-semibold text-xs truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Simulated Water Level Progression
              </h4>
              <span className={`text-[10px] font-mono hidden sm:inline ${isLight ? 'text-cyan-800 font-bold' : 'text-cyan-400/90'}`}>
                {profile.gaugeStationName}
              </span>
            </div>
            <div className={`text-[10px] flex items-center gap-2 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>{profile.gaugeStationId}</span>
              <span>·</span>
              <span>{profile.riverBasin}</span>
              <span>·</span>
              <span className={`font-mono font-semibold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                Peak: {unitSystem === 'metric' ? `${profile.peakStageMeters}m` : `${(profile.peakStageMeters * 3.28084).toFixed(1)}ft`} ({profile.crestTimestamp})
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Play/Pause Progression Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-500'
            }`}
            title={isPlaying ? 'Pause progression playback' : 'Play progression timeline sequence'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play Sequence'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setSelectedPointIndex(0);
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Reset to T-48h baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isExpanded ? 'Collapse chart panel' : 'Expand full trend chart'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsed Compact Ticker View */}
      {!isExpanded && (
        <div className="px-4 py-2 flex items-center justify-between text-xs bg-slate-900/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Step:</span>
              <span className="font-mono text-cyan-400 font-bold">{activePoint.timestamp}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Stage:</span>
              <span className="font-mono text-white font-bold">
                {unitSystem === 'metric' ? `${activePoint.stageMeters.toFixed(2)} m` : `${activePoint.stageFeet.toFixed(1)} ft`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="text-slate-400">Inundation:</span>
              <span className="font-mono text-amber-300 font-bold">{activePoint.floodedAreaKm2.toFixed(1)} km²</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-semibold ${getStatusColor(activePoint.status)}`}>
              {activePoint.status}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
          >
            View Trend Chart
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Full Interactive Chart Module */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Sub-header controls: Metric switcher, Units, and active point telemetry */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
            {/* Metric Segmented Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveMetric('stage')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeMetric === 'stage'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Water Stage (m)
              </button>
              <button
                onClick={() => setActiveMetric('discharge')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeMetric === 'discharge'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Discharge (m³/s)
              </button>
              <button
                onClick={() => setActiveMetric('area')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeMetric === 'area'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flooded Area (km²)
              </button>
            </div>

            {/* Units Toggle */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Units:</span>
              <button
                onClick={() => setUnitSystem('metric')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  unitSystem === 'metric' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Metric (m)
              </button>
              <span className="text-slate-600">/</span>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  unitSystem === 'imperial' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Imperial (ft)
              </button>
            </div>

            {/* Active Point Live Badge */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 text-[11px]">
              <span className="text-slate-400">Selected Step:</span>
              <span className="font-mono text-cyan-400 font-bold">{activePoint.timestamp}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-white font-semibold">
                {unitSystem === 'metric' ? `${activePoint.stageMeters.toFixed(2)}m` : `${activePoint.stageFeet.toFixed(1)}ft`}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getStatusColor(activePoint.status)}`}>
                {activePoint.status}
              </span>
            </div>
          </div>

          {/* Recharts Line Chart Container */}
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setSelectedPointIndex(e.activeTooltipIndex);
                  }
                }}
              >
                <defs>
                  <linearGradient id="waterStageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dischargeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />

                <XAxis
                  dataKey="timestamp"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  domain={['auto', 'auto']}
                  unit={
                    activeMetric === 'stage'
                      ? unitSystem === 'metric'
                        ? 'm'
                        : 'ft'
                      : activeMetric === 'discharge'
                      ? ''
                      : 'k'
                  }
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Flood Category Threshold Reference Lines */}
                {activeMetric === 'stage' && (
                  <>
                    <ReferenceLine
                      y={unitSystem === 'metric' ? profile.minorFloodStageMeters : profile.minorFloodStageMeters * 3.28084}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Minor Flood',
                        fill: '#f59e0b',
                        fontSize: 9,
                        position: 'insideTopRight',
                      }}
                    />
                    <ReferenceLine
                      y={unitSystem === 'metric' ? profile.majorFloodStageMeters : profile.majorFloodStageMeters * 3.28084}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Major Flood',
                        fill: '#f43f5e',
                        fontSize: 9,
                        position: 'insideTopRight',
                      }}
                    />
                    <ReferenceLine
                      y={unitSystem === 'metric' ? profile.recordCrestMeters : profile.recordCrestMeters * 3.28084}
                      stroke="#e11d48"
                      strokeWidth={1.5}
                      label={{
                        value: 'Record Crest',
                        fill: '#fda4af',
                        fontSize: 9,
                        position: 'insideBottomRight',
                      }}
                    />
                  </>
                )}

                {/* Vertical Active Playhead Line */}
                <ReferenceLine
                  x={activePoint.timestamp}
                  stroke="#22d3ee"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  label={{
                    value: 'Current Step',
                    fill: '#22d3ee',
                    fontSize: 9,
                    position: 'insideTopLeft',
                  }}
                />

                {/* Area Gradient Fill */}
                {activeMetric === 'stage' && (
                  <Area
                    type="monotone"
                    dataKey={unitSystem === 'metric' ? 'stageMeters' : 'stageFeet'}
                    stroke="none"
                    fill="url(#waterStageGradient)"
                  />
                )}
                {activeMetric === 'discharge' && (
                  <Area
                    type="monotone"
                    dataKey="dischargeM3s"
                    stroke="none"
                    fill="url(#dischargeGradient)"
                  />
                )}
                {activeMetric === 'area' && (
                  <Area
                    type="monotone"
                    dataKey="floodedAreaKm2"
                    stroke="none"
                    fill="url(#areaGradient)"
                  />
                )}

                {/* Primary Metric Line */}
                {activeMetric === 'stage' && (
                  <Line
                    type="monotone"
                    dataKey={unitSystem === 'metric' ? 'stageMeters' : 'stageFeet'}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: '#0891b2', r: 3, stroke: '#22d3ee', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                    name="Stage"
                  />
                )}

                {activeMetric === 'discharge' && (
                  <Line
                    type="monotone"
                    dataKey="dischargeM3s"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ fill: '#0284c7', r: 3, stroke: '#38bdf8', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                    name="Discharge"
                  />
                )}

                {activeMetric === 'area' && (
                  <Line
                    type="monotone"
                    dataKey="floodedAreaKm2"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    dot={{ fill: '#d97706', r: 3, stroke: '#fbbf24', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                    name="Inundation Extent"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Progression Timeline Scrubber Bar */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Timeline Scrubber: Click or drag to inspect flooding progression</span>
              </span>
              <span className="font-mono text-cyan-300">
                {activePoint.formattedTime} ({activePoint.timestamp})
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={Math.max(0, (data?.length || 1) - 1)}
                step={1}
                value={typeof selectedPointIndex === 'number' && !isNaN(selectedPointIndex) ? selectedPointIndex : 0}
                onChange={(e) => {
                  setIsPlaying(false);
                  const parsed = parseInt(e.target.value, 10);
                  setSelectedPointIndex(isNaN(parsed) ? 0 : parsed);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Timeline Tick Labels */}
            <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5">
              <span>{data[0]?.timestamp} (Baseline)</span>
              <span className="text-rose-400 font-semibold">T-0h (Peak Crest)</span>
              <span>{data[data.length - 1]?.timestamp} (Recession)</span>
            </div>
          </div>

          {/* Hydrological Stage Metrics Footer Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Normal Stage</div>
              <div className="font-mono text-emerald-400 font-semibold mt-0.5">
                {unitSystem === 'metric' ? `${profile.normalStageMeters} m` : `${(profile.normalStageMeters * 3.28084).toFixed(1)} ft`}
              </div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Major Flood Stage</div>
              <div className="font-mono text-rose-400 font-semibold mt-0.5">
                {unitSystem === 'metric' ? `${profile.majorFloodStageMeters} m` : `${(profile.majorFloodStageMeters * 3.28084).toFixed(1)} ft`}
              </div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Peak Crest Recorded</div>
              <div className="font-mono text-white font-bold mt-0.5">
                {unitSystem === 'metric' ? `${profile.peakStageMeters} m` : `${(profile.peakStageMeters * 3.28084).toFixed(1)} ft`}
              </div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Simulated Peak Area</div>
              <div className="font-mono text-amber-300 font-semibold mt-0.5">
                {data.find(d => d.status === 'Record Crest')?.floodedAreaKm2.toFixed(1) || '20.3'} km²
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
