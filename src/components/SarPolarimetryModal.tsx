import React, { useState } from 'react';
import {
  X,
  Radio,
  Sliders,
  Layers,
  Info,
  Maximize2,
  Sparkles,
  Zap,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { FloodEventStudyArea } from '../types/flood';

interface SarPolarimetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FloodEventStudyArea;
  theme?: 'dark' | 'light';
}

export const SarPolarimetryModal: React.FC<SarPolarimetryModalProps> = ({
  isOpen,
  onClose,
  event,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [polarizationMode, setPolarizationMode] = useState<'VV' | 'VH' | 'RATIO' | 'DUAL_RGB'>('VV');
  const [dbThreshold, setDbThreshold] = useState<number>(-16.5);
  const [showUrbanDoubleBounce, setShowUrbanDoubleBounce] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                Microwave Remote Sensing Physics
              </div>
              <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Sentinel-1 SAR Polarimetric Decomposition & Backscatter Physics Analyzer
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            aria-label="Close SAR Analyzer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Metadata Banner */}
          <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cyan-400 font-mono">
                {event.satelliteMetadata.sensor} ({event.satelliteMetadata.platform})
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">Orbit: {event.satelliteMetadata.orbitMode} ({event.satelliteMetadata.relativeOrbit})</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span>Incidence: ~{event.satelliteMetadata.incidenceAngleMeanDeg}°</span>
              <span>Res: {event.satelliteMetadata.spatialResolutionMeters}m GRD</span>
              <span className="text-cyan-400 font-bold">{event.satelliteMetadata.polarization} Active</span>
            </div>
          </div>

          {/* Polarization Mode Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`font-semibold uppercase tracking-wider text-[11px] ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Polarimetric Channel Decomposition Mode:
              </span>
              <span className="text-cyan-400 font-mono">
                {polarizationMode === 'VV' && 'Single Co-Pol: Surface Specular Reflection'}
                {polarizationMode === 'VH' && 'Cross-Pol: Vegetation Volume Scattering'}
                {polarizationMode === 'RATIO' && 'VV/VH Normalized Ratio: Flooded Urban & Canopy Index'}
                {polarizationMode === 'DUAL_RGB' && 'False Color Composite: R=VV, G=VH, B=VV/VH'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setPolarizationMode('VV')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  polarizationMode === 'VV'
                    ? isLight ? 'bg-cyan-100 border-cyan-500 ring-1 ring-cyan-500' : 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                    : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-cyan-400 flex items-center justify-between">
                  <span>VV Co-Pol</span>
                  <span className="text-[10px] font-mono">5.4 GHz</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Primary signal for open calm water detection. Specular reflection creates deep negative backscatter (-24 to -18 dB).
                </p>
              </button>

              <button
                onClick={() => setPolarizationMode('VH')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  polarizationMode === 'VH'
                    ? isLight ? 'bg-cyan-100 border-cyan-500 ring-1 ring-cyan-500' : 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                    : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-purple-400 flex items-center justify-between">
                  <span>VH Cross-Pol</span>
                  <span className="text-[10px] font-mono">Depolarized</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cross-polarized return. Detects volume scattering from submerged crop fields, flooded marshes, and tree canopies.
                </p>
              </button>

              <button
                onClick={() => setPolarizationMode('RATIO')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  polarizationMode === 'RATIO'
                    ? isLight ? 'bg-cyan-100 border-cyan-500 ring-1 ring-cyan-500' : 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                    : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>VV / VH Ratio</span>
                  <span className="text-[10px] font-mono">Quotient</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Normalized differential index. Minimizes wind-induced water surface roughness errors and identifies flooded roads.
                </p>
              </button>

              <button
                onClick={() => setPolarizationMode('DUAL_RGB')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  polarizationMode === 'DUAL_RGB'
                    ? isLight ? 'bg-cyan-100 border-cyan-500 ring-1 ring-cyan-500' : 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                    : isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-emerald-400 flex items-center justify-between">
                  <span>Dual-Pol RGB</span>
                  <span className="text-[10px] font-mono">3-Channel</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  False-color composite mapping: Red = VV, Green = VH, Blue = |VV - VH|. Separates urban structures from water bodies.
                </p>
              </button>
            </div>
          </div>

          {/* Interactive Calibration dB Threshold Tuner */}
          <div className={`p-4 rounded-lg border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-semibold uppercase tracking-wider text-[11px] ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  Otsu / Bimodal Gamma-0 Inundation Cutoff Threshold:
                </span>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  Pixels exhibiting backscatter coefficient below this value are classified as inundated surface water.
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-cyan-400 font-bold text-base">{dbThreshold.toFixed(1)} dB</span>
                <span className="text-[10px] text-slate-500 block">Sentinel-1 GRD σ°</span>
              </div>
            </div>

            <div className="pt-1">
              <input
                type="range"
                min="-24.0"
                max="-11.0"
                step="0.5"
                value={dbThreshold}
                onChange={(e) => setDbThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>-24.0 dB (Very Deep / Calm Water)</span>
                <span>-17.0 dB (Recommended Sentinel-1 Baseline)</span>
                <span>-11.0 dB (Rough Soil / Saturated Ground)</span>
              </div>
            </div>

            {/* Backscatter Distribution Histogram Simulation */}
            <div className={`p-3 rounded-lg border space-y-2 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Simulated SAR Histogram (Bi-modal Gaussian Decomposition)
              </div>
              <div className="h-16 flex items-end gap-1 pt-2">
                {Array.from({ length: 32 }).map((_, i) => {
                  const dbVal = -24 + (i / 31) * 13;
                  // Dual peak: Water peak around -19dB, Land peak around -13dB
                  const waterPeak = Math.exp(-Math.pow(dbVal - -19.5, 2) / 3.5) * 55;
                  const landPeak = Math.exp(-Math.pow(dbVal - -13.0, 2) / 4.5) * 45;
                  const height = Math.min(100, Math.max(8, waterPeak + landPeak));
                  const isWater = dbVal <= dbThreshold;

                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all group relative"
                      style={{
                        height: `${height}%`,
                        backgroundColor: isWater ? '#06b6d4' : '#64748b',
                      }}
                      title={`${dbVal.toFixed(1)} dB (${isWater ? 'Inundated Water' : 'Dry Terrain'})`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1">
                <span className="text-cyan-400 font-bold">Water Mode Peak (~ -19.5 dB)</span>
                <span className="text-slate-400">Decision Threshold: {dbThreshold.toFixed(1)} dB</span>
                <span className="text-slate-300 font-bold">Land Mode Peak (~ -13.0 dB)</span>
              </div>
            </div>
          </div>

          {/* Urban Double-Bounce & Penetration Mechanics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3.5 rounded-lg border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Urban Double-Bounce Scattering Anomaly
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When water inundates built environments, radar microwaves reflect off the smooth horizontal water surface, bounce off vertical building facades, and reflect back directly to the satellite receiver. This produces an intense <span className="text-amber-300 font-semibold">bright radar return (+3 to +8 dB)</span> rather than typical dark water, which AegisFlood AI handles via dual-stream cross-attention.
              </p>
            </div>

            <div className={`p-3.5 rounded-lg border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5 text-xs">
                <Activity className="w-4 h-4 text-cyan-400" />
                All-Weather Cloud & Night Penetration
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sentinel-1 operates at C-band microwave frequency (wavelength ~5.54 cm), which passes unimpeded through tropical storm cloud decks, monsoon squalls, heavy rainfall, and complete darkness. Unlike optical sensors (Sentinel-2 / Landsat) that are obscured by storm clouds, SAR operates reliably 24/7 in hurricane disaster zones.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Active Polarization: <strong className="text-cyan-400">{polarizationMode}</strong> at threshold <strong className="text-cyan-400">{dbThreshold.toFixed(1)} dB</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-md font-bold text-xs transition-colors ${
              isLight ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
