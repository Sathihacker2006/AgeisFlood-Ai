import React, { useState } from 'react';
import {
  Layers,
  Activity,
  Database,
  Cpu,
  ShieldAlert,
  RefreshCw,
  Mountain,
  Box,
  HelpCircle,
  FileText,
  Compass,
  ExternalLink,
  Sun,
  Moon,
  Plane,
  Download,
  Radio,
  Home,
} from 'lucide-react';
import { FloodEventStudyArea } from '../types/flood';
import { MapConfigHelpModal } from './MapConfigHelpModal';

interface TopBarProps {
  activeTab: 'gis' | '3d' | 'network' | 'dataset' | 'models' | 'safety' | '3d-eval';
  setActiveTab: (tab: 'gis' | '3d' | 'network' | 'dataset' | 'models' | 'safety' | '3d-eval') => void;
  selectedEvent: FloodEventStudyArea;
  onEventChange: (eventId: string) => void;
  events: FloodEventStudyArea[];
  onRefreshAnalysis: () => void;
  isSimulating: boolean;
  onOpenSitrep?: () => void;
  onOpenSatelliteSwipe?: () => void;
  onOpenDronePlanner?: () => void;
  onOpenGisExport?: () => void;
  onOpenSarPolarimetry?: () => void;
  onOpenEvacuationPlanner?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  selectedEvent,
  onEventChange,
  events,
  onRefreshAnalysis,
  isSimulating,
  onOpenSitrep,
  onOpenSatelliteSwipe,
  onOpenDronePlanner,
  onOpenGisExport,
  onOpenSarPolarimetry,
  onOpenEvacuationPlanner,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const isLight = theme === 'light';

  return (
    <header className={`flex items-center justify-between px-6 py-3.5 border-b backdrop-blur-md z-30 sticky top-0 transition-colors ${
      isLight ? 'bg-white/95 text-slate-900 border-slate-300 shadow-sm' : 'bg-slate-900/90 text-slate-100 border-slate-800'
    }`}>
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className={`text-lg font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isLight ? 'bg-cyan-600' : 'bg-cyan-400'}`}></span>
          AegisFlood AI
        </a>
        <span className={isLight ? 'text-slate-300 hidden sm:inline' : 'text-slate-600 hidden sm:inline'} aria-hidden="true">|</span>
        <select
          value={selectedEvent?.id || (events?.[0]?.id ?? '')}
          onChange={(e) => onEventChange(e.target.value)}
          className={`text-xs border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium cursor-pointer transition-colors ${
            isLight
              ? 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
          }`}
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.eventDate})
            </option>
          ))}
        </select>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className={`hidden lg:flex items-center gap-6 text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        <button
          onClick={() => setActiveTab('gis')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === 'gis'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          GIS Operations
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === '3d'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <Box className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          3D Digital Twin
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === 'network'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Connectivity Graph
        </button>
        <button
          onClick={() => setActiveTab('dataset')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === 'dataset'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          AI Dataset & Code
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === 'models'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Model Architecture
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === 'safety'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Operational Safety
        </button>
        <button
          onClick={() => setActiveTab('3d-eval')}
          className={`flex items-center gap-1.5 transition-colors pb-0.5 whitespace-nowrap ${
            activeTab === '3d-eval'
              ? isLight ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold' : 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : isLight ? 'hover:text-slate-950' : 'hover:text-slate-200'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          3D Research & Eval
        </button>
      </nav>

      {/* Zone 3: Actions & High-Contrast Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Emergency Field Daylight / Night Ops Theme Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm border ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 ring-1 ring-amber-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title={
              isLight
                ? 'Currently in High-Contrast Daylight Mode. Click to switch to Night Operations Dark Mode.'
                : 'Currently in Night Operations Dark Mode. Click to switch to High-Contrast Daylight Mode (optimized for direct sunlight field reading).'
            }
            aria-label="Toggle High-Contrast Field Theme"
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span className="hidden sm:inline">Daylight Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Night Mode</span>
              </>
            )}
          </button>
        )}

        {onOpenDronePlanner && (
          <button
            onClick={onOpenDronePlanner}
            className={`px-2.5 py-1.5 text-xs font-semibold border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isLight
                ? 'text-cyan-900 bg-cyan-100 hover:bg-cyan-200 border-cyan-300'
                : 'text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80'
            }`}
            title="Open Autonomous UAV Drone Recon Mission Planner & Multi-Modal Rescue Corridor Simulator"
          >
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Drone Mission</span>
          </button>
        )}

        {onOpenEvacuationPlanner && (
          <button
            onClick={onOpenEvacuationPlanner}
            className={`px-2.5 py-1.5 text-xs font-semibold border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isLight
                ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border-amber-300'
                : 'text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80'
            }`}
            title="Open Emergency Evacuation Corridor & Shelter Allocation Planner"
          >
            <Home className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden xl:inline">Shelters & Evac</span>
          </button>
        )}

        {onOpenGisExport && (
          <button
            onClick={onOpenGisExport}
            className={`px-2.5 py-1.5 text-xs font-semibold border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isLight
                ? 'text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border-emerald-300'
                : 'text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80'
            }`}
            title="Export GeoJSON, Google Earth KML files, or ingest custom hazard polygons"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">GIS Export</span>
          </button>
        )}

        {onOpenSarPolarimetry && (
          <button
            onClick={onOpenSarPolarimetry}
            className={`px-2.5 py-1.5 text-xs font-semibold border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isLight
                ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border-amber-300'
                : 'text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80'
            }`}
            title="Analyze Sentinel-1 dual-polarization SAR backscatter, volume scattering, and Otsu thresholding"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">SAR Radar</span>
          </button>
        )}

        {onOpenSatelliteSwipe && (
          <button
            onClick={onOpenSatelliteSwipe}
            className={`px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isLight
                ? 'text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
                : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border-slate-700'
            }`}
            title="Open Sentinel-1 SAR & Optical dual-sensor swipe comparison tool"
          >
            <Compass className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <span className="hidden md:inline">Satellite Lens</span>
          </button>
        )}

        {onOpenSitrep && (
          <button
            onClick={onOpenSitrep}
            className={`px-2.5 py-1.5 text-xs font-semibold border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              isLight
                ? 'text-rose-900 bg-rose-100 hover:bg-rose-200 border-rose-300'
                : 'text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80'
            }`}
            title="Generate and export emergency situation briefing report (SITREP)"
          >
            <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
            <span>Incident SITREP</span>
          </button>
        )}

        <a
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
            isLight
              ? 'text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border-slate-700'
          }`}
          title="Open app directly in a full-screen standalone browser tab (completely free of any AI Studio watermark overlay)"
        >
          <ExternalLink className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          <span className="hidden sm:inline">Open Standalone Tab</span>
        </a>

        <button
          onClick={() => setIsHelpModalOpen(true)}
          className={`px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
            isLight
              ? 'text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border-slate-700'
          }`}
          title="Guide on configuring keyless map tiles and avoiding watermark dependencies"
        >
          <HelpCircle className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          <span className="hidden lg:inline">Tile & API Guide</span>
        </button>

        <button
          onClick={onRefreshAnalysis}
          disabled={isSimulating}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm disabled:opacity-50 ${
            isLight
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold'
              : 'bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSimulating ? 'Computing Graph...' : 'Re-Run Graph Analysis'}</span>
          <span className="sm:hidden">Run</span>
        </button>
      </div>

      {/* Map Config & Watermark Info Modal */}
      <MapConfigHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </header>
  );
};
