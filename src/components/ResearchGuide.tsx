import React, { useState } from 'react';
import { ShieldAlert, BookOpen, GitMerge, FileText, CheckCircle, ChevronRight, AlertTriangle, ArrowRight } from 'lucide-react';

interface ModuleDef {
  letter: string;
  name: string;
  role: string;
  inputs: string;
  outputs: string;
  keyLibraries: string;
}

const MODULES: ModuleDef[] = [
  {
    letter: 'A',
    name: 'Remote Sensing Acquisition & Calibration',
    role: 'Acquires raw Sentinel-1 GRD and Sentinel-2 L2A granules, applies radiometric calibration, speckle filtering, and georeferencing.',
    inputs: 'ESA Copernicus Open Access Hub / ASF Vertex granules (SAFE format)',
    outputs: 'Radiometrically calibrated, terrain-corrected GeoTIFF rasters (EPSG:32617)',
    keyLibraries: 'rasterio, gdal, pyproj, snappy'
  },
  {
    letter: 'B',
    name: 'AI Flood Segmentation',
    role: 'Executes deep learning segmentation (U-Net) on normalized SAR/optical channels to predict pixel-level inundation probability.',
    inputs: '3-band normalized tensor (VV, VH, VV/VH dB backscatter)',
    outputs: 'Float32 continuous flood probability raster P(Flood) ∈ [0, 1]',
    keyLibraries: 'PyTorch, segmentation-models-pytorch, albumentations'
  },
  {
    letter: 'C',
    name: 'Geospatial Vectorization & Cleanup',
    role: 'Thresholds probability raster, filters small noisy specks via mathematical morphology, and vectorizes connected components into GeoJSON.',
    inputs: 'Probability raster P(Flood) and calibrated cutoff threshold τ',
    outputs: 'GeoJSON Polygon FeatureCollection with geodesic area (km²) and perimeter',
    keyLibraries: 'rasterio.features, shapely, geopandas'
  },
  {
    letter: 'D',
    name: 'Infrastructure Impact Assessment',
    role: 'Performs spatial intersections between OpenStreetMap road polylines, bridges, and flood polygons to calculate length affected and impact scores.',
    inputs: 'OSM road network GeoPackage and flood vector polygons',
    outputs: 'Road segments enriched with affectedLength, meanProb, and ImpactScore',
    keyLibraries: 'geopandas.sjoin, shapely.geometry, rtree'
  },
  {
    letter: 'E',
    name: 'Road Network Graph Construction',
    role: 'Converts road geometries into a mathematical graph G = (V, E), where intersections are vertices and segments are directional edges.',
    inputs: 'Enriched road linestrings and facility centroids',
    outputs: 'NetworkX multidigraph with length, travel time, and flood attributes',
    keyLibraries: 'osmnx, networkx, scipy.spatial'
  },
  {
    letter: 'F',
    name: 'Connectivity & Reachability Engine',
    role: 'Identifies bridge articulation cuts via Tarjan’s algorithm, computes dynamic edge impedance penalties, and runs shortest path search.',
    inputs: 'Road graph G and active dispatch center origin node',
    outputs: 'Reachability tree, alternate flood-safe bypass routes, and unreachable node set',
    keyLibraries: 'networkx.algorithms.shortest_paths, scipy.sparse.csgraph'
  },
  {
    letter: 'G',
    name: 'Risk & Priority Analysis',
    role: 'Flags communities with zero passable routes as Candidate Potentially Isolated Areas and ranks evacuation urgency.',
    inputs: 'Unreachable graph nodes, population census, and critical health clinics',
    outputs: 'Ranked candidate isolation register with route failure diagnostics',
    keyLibraries: 'pandas, geopandas'
  },
  {
    letter: 'H',
    name: 'GIS Visualization & Decision Dashboard',
    role: 'Presents interactive cartographic layers, scenario simulation controls, click-to-inspect evidence panels, and export capabilities.',
    inputs: 'Vector layers, graph outputs, and remote sensing imagery',
    outputs: 'Responsive Leaflet/MapLibre web interface with GeoJSON exports',
    keyLibraries: 'React, Leaflet, Tailwind CSS, Lucide'
  },
  {
    letter: 'I',
    name: 'Evaluation, Uncertainty & Validation',
    role: 'Quantifies model uncertainty via Monte Carlo Dropout, cross-validates against independent ground truth, and tracks provenance.',
    inputs: 'Multi-event holdout datasets and official emergency agency disaster maps',
    outputs: 'IoU, Dice, Precision-Recall curves, and spatial error residual maps',
    keyLibraries: 'scikit-learn, rasterio, matplotlib'
  },
  {
    letter: 'J',
    name: 'Deployment & Operational Packaging',
    role: 'Containers and API services for near-real-time automated disaster ingestion and client delivery.',
    inputs: 'Trained model weights and spatial processing pipelines',
    outputs: 'FastAPI microservices, Docker containers, PostGIS spatial database',
    keyLibraries: 'FastAPI, Docker, PostGIS, Celery'
  }
];

export const ResearchGuide: React.FC = () => {
  const [selectedModuleLetter, setSelectedModuleLetter] = useState('A');

  const selectedModule = MODULES.find((m) => m.letter === selectedModuleLetter) || MODULES[0];

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200 space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          System Architecture, Ethics & Scientific Foundations
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          10-Module Pipeline Architecture & Operational Safety Protocol
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          Complete structural blueprint connecting remote sensing, deep learning segmentation, GIS spatial joins,
          graph theory reachability, and emergency decision-support protocols.
        </p>
      </div>

      {/* Mandatory Operational & Ethical Safety Charter (Section 41) */}
      <div className="bg-rose-950/20 border border-rose-800/60 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Mandatory Operational Safety & Non-Definitive Decision Support Charter
          </h3>
        </div>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            Emergency disaster management involves life-critical logistics. In strict adherence to operational safety principles,
            this platform functions as an <strong>analytical decision-support system</strong>, not an autonomous rescue authority.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-mono font-bold text-rose-400 block mb-1">
                PROHIBITED GROUND-TRUTH CLAIMS
              </span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>• Never claim that a road is definitively "destroyed" from satellite imagery alone.</li>
                <li>• Never claim that a community is definitively "100% physically isolated".</li>
                <li>• Never automatically dispatch rescue boats or helicopters without human authorization.</li>
              </ul>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-mono font-bold text-emerald-400 block mb-1">
                MANDATORY SCIENTIFIC TERMINOLOGY
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li>• Use: <strong className="text-cyan-300">"Detected flood area"</strong> instead of "confirmed flood extent".</li>
                <li>• Use: <strong className="text-cyan-300">"Potentially affected road"</strong> instead of "closed/destroyed road".</li>
                <li>• Use: <strong className="text-cyan-300">"Candidate potentially isolated area"</strong> with field verification tag.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Module Pipeline Interactive Explorer (Section 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              The 10 Interconnected Modules (Modules A through J)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">End-to-End Pipeline</span>
        </div>

        {/* Module Step Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MODULES.map((mod) => {
            const isSelected = mod.letter === selectedModuleLetter;
            return (
              <button
                key={mod.letter}
                onClick={() => setSelectedModuleLetter(mod.letter)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-400 shadow-sm ring-1 ring-cyan-400/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-cyan-400">
                  MODULE {mod.letter}
                </div>
                <div className="text-xs font-semibold text-white truncate mt-0.5">
                  {mod.name.split(' ')[0]} {mod.name.split(' ')[1] || ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Module Detail Panel */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 font-mono flex items-center justify-center text-xs font-bold border border-cyan-500/30">
                {selectedModule.letter}
              </span>
              {selectedModule.name}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Tech: <span className="text-cyan-300">{selectedModule.keyLibraries}</span>
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedModule.role}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                Data Inputs
              </span>
              <span className="text-slate-300 font-mono text-[11px]">{selectedModule.inputs}</span>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                Data Outputs
              </span>
              <span className="text-cyan-300 font-mono text-[11px]">{selectedModule.outputs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Research Contribution Formulation (Section 42) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <FileText className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Formulated Research Contribution & Impact
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Traditional flood mapping stops at generating a 2D water polygon raster. Conversely, traditional road navigation systems
          rely on user incident reports or static road network closures. Neither system alone answers the emergency responder's critical question:
          <em> "Which specific communities are completely unreachable right now, and which bridge was the primary point of failure?"</em>
        </p>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-serif italic text-cyan-200 text-xs text-center">
          "Integrating all-weather Sentinel-1 SAR flood segmentation with infrastructure-aware graph reachability analysis
          enables rapid, automated identification of candidate isolated populations and critical bridge articulation choke points
          during catastrophic flooding."
        </div>
      </div>
    </div>
  );
};
