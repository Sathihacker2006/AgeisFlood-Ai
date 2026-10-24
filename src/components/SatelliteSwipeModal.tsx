import React, { useState, useRef } from 'react';
import {
  X,
  Layers,
  Sliders,
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Radio,
  Mountain,
} from 'lucide-react';
import { FloodEventStudyArea } from '../types/flood';

interface SatelliteSwipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FloodEventStudyArea;
}

export const SatelliteSwipeModal: React.FC<SatelliteSwipeModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [leftLayer, setLeftLayer] = useState<'pre_sar' | 'optical' | 'dem'>('pre_sar');
  const [rightLayer, setRightLayer] = useState<'post_sar' | 'optical' | 'dem'>('post_sar');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  if (!isOpen) return null;

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  const getImageForLayer = (layer: 'pre_sar' | 'post_sar' | 'optical' | 'dem') => {
    switch (layer) {
      case 'pre_sar':
        return event.sarPreFloodImage;
      case 'post_sar':
        return event.sarPostFloodImage;
      case 'optical':
        return event.opticalPostFloodImage;
      case 'dem':
        return event.demElevationImage;
    }
  };

  const getLayerLabel = (layer: 'pre_sar' | 'post_sar' | 'optical' | 'dem') => {
    switch (layer) {
      case 'pre_sar':
        return 'Pre-Flood Sentinel-1 SAR (Jul 21 Baseline)';
      case 'post_sar':
        return 'Post-Flood Sentinel-1 SAR (Jul 29 Inundation)';
      case 'optical':
        return 'Sentinel-2 Multi-Spectral False-Color (NIR/SWIR)';
      case 'dem':
        return '3DEP High-Resolution DEM Topographic Relief';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Satellite Multi-Sensor Optical & SAR Swipe Comparator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  DUAL-PASS SENSOR FUSION
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 font-mono">
                <span>{event.satelliteMetadata.platform}</span>
                <span>·</span>
                <span>Orbit: {event.satelliteMetadata.orbitMode} (Rel. {event.satelliteMetadata.relativeOrbit})</span>
                <span>·</span>
                <span>{event.satelliteMetadata.polarization}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Select layers for Left vs Right */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left Layer Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium font-mono text-[11px]">LEFT LENS:</span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
              <button
                onClick={() => setLeftLayer('pre_sar')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  leftLayer === 'pre_sar' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pre-Flood SAR
              </button>
              <button
                onClick={() => setLeftLayer('optical')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  leftLayer === 'optical' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Optical SWIR
              </button>
              <button
                onClick={() => setLeftLayer('dem')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  leftLayer === 'dem' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                DEM Relief
              </button>
            </div>
          </div>

          {/* Quick Slider Position Reset */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">Splitter:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSliderPosition(25)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
              >
                25%
              </button>
              <button
                onClick={() => setSliderPosition(50)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 font-bold text-cyan-400"
              >
                50% (Center)
              </button>
              <button
                onClick={() => setSliderPosition(75)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
              >
                75%
              </button>
            </div>
          </div>

          {/* Right Layer Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium font-mono text-[11px]">RIGHT LENS:</span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
              <button
                onClick={() => setRightLayer('post_sar')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  rightLayer === 'post_sar' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Post-Flood SAR
              </button>
              <button
                onClick={() => setRightLayer('optical')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  rightLayer === 'optical' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Optical SWIR
              </button>
              <button
                onClick={() => setRightLayer('dem')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  rightLayer === 'dem' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                DEM Relief
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Swipe Canvas */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          className="relative flex-1 bg-black overflow-hidden select-none cursor-ew-resize min-h-[460px]"
        >
          {/* Base Layer (Right image, displayed across full background) */}
          <div className="absolute inset-0">
            <img
              src={getImageForLayer(rightLayer)}
              alt="Right layer"
              className="w-full h-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
            />
            {/* Top Right Label */}
            <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 pointer-events-none shadow-lg">
              <span className="text-[10px] text-slate-400 block uppercase">Right View</span>
              {getLayerLabel(rightLayer)}
            </div>
          </div>

          {/* Overlay Layer (Left image clipped by splitter width) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100vw',
              }}
            >
              <img
                src={getImageForLayer(leftLayer)}
                alt="Left layer"
                className="w-full h-full object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Top Left Label */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 pointer-events-none shadow-lg">
              <span className="text-[10px] text-slate-400 block uppercase">Left View</span>
              {getLayerLabel(leftLayer)}
            </div>
          </div>

          {/* Vertical Divider Line with Grab Handle */}
          <div
            className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-20 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-2xl flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Bottom Center Instruction */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-400 pointer-events-none flex items-center gap-2 font-mono">
            <span>Drag slider horizontally to swipe between sensor acquisitions</span>
          </div>
        </div>

        {/* Footer Technical Metadata */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span>Spatial Resolution: 10m Ground Sample Distance</span>
            <span>·</span>
            <span>CRS: {event.satelliteMetadata.crs}</span>
            <span>·</span>
            <span>Processing: GRD Sigma-Naught (dB)</span>
          </div>
          <span className="text-cyan-400">Copernicus Sentinel-1 / USGS 3DEP</span>
        </div>
      </div>
    </div>
  );
};
