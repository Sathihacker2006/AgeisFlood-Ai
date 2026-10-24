import React from 'react';
import { Mountain, Layers, Eye, ShieldCheck, AlertTriangle, Cpu, Activity, ArrowRight, BarChart2 } from 'lucide-react';

export const Terrain3DEvaluationView: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Mountain className="w-3.5 h-3.5" />
          Advanced 3D Geospatial Module — Research & Evaluation Framework
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          3D Terrain & Inundation Analysis: Usability, Pipeline & Scientific Fidelity
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          The 3D module complements the 2D GIS system by rendering topographic elevation context, hydraulic valley channels,
          and bridge elevations. Below is the full 3D processing pipeline, the cognitive usability evaluation (2D vs. 3D),
          and the operational safety rules preventing false precision.
        </p>
      </div>

      {/* 3D Processing Pipeline Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Layers className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            End-to-End 3D Geospatial Integration Pipeline
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">1. DEM Ingestion</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Acquires Copernicus 30m Global DEM or USGS 3DEP 10m elevation rasters. Reprojects to local UTM CRS and builds a normalized heightfield matrix.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">EPSG:32617 · 10m GSD</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">2. Water Surface Draping</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              AI flood polygons are projected onto the terrain mesh. Water surface elevations are clamped to the hydraulic base stage of each river reach.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">MeshPhysicalMaterial · Depth Offset</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">3. 3D Infrastructure Ribbons</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              OpenStreetMap road polylines are draped over the terrain heightfield as continuous 3D tubes, colored by calculated Impact Scores.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">CatmullRomCurve3 · OSMnx G=(V,E)</div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">4. Graph Articulation Rendering</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Critical bridges and isolated candidate nodes are elevated in 3D space with beacon beacons and dynamic route corridors.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">Tarjan Cut-Edges · WebGL 60 FPS</div>
          </div>
        </div>
      </div>

      {/* 2D vs 3D Usability & Cognitive Tradeoff Evaluation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <BarChart2 className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Scientific Usability Comparison: 2D GIS vs 3D Geospatial Perspective
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                <th className="py-2.5 px-3">Decision Task</th>
                <th className="py-2.5 px-3">2D Cartographic GIS</th>
                <th className="py-2.5 px-3">3D Terrain & Inundation</th>
                <th className="py-2.5 px-3">Operational Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-[11px]">
              <tr>
                <td className="py-3 px-3 text-white font-medium">Measuring Exact Road Length Affected</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Superior (Zero distortion)</td>
                <td className="py-3 px-3 text-slate-400">Perspective foreshortening can distort distances</td>
                <td className="py-3 px-3 text-slate-300">Use 2D map for quantitative distance metrics and routing calculations.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-medium">Understanding Mountain Hollow Isolation</td>
                <td className="py-3 px-3 text-slate-400">Difficult without reading tight contour lines</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Superior (Instant spatial intuition)</td>
                <td className="py-3 px-3 text-slate-300">Use 3D to immediately see how steep valley walls trap floodwater and sever hollow roads.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-medium">Bridge Hydraulic Overtopping Assessment</td>
                <td className="py-3 px-3 text-slate-400">Shows overlap as flat 2D intersection</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Reveals bridge deck elevation vs water level</td>
                <td className="py-3 px-3 text-slate-300">Use 3D to evaluate whether a bridge deck is elevated above water stage or submerged.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-medium">Aviation / Helicopter Staging Paths</td>
                <td className="py-3 px-3 text-slate-400">No ridge obstacle visibility</td>
                <td className="py-3 px-3 text-emerald-400 font-semibold">Displays ridge barriers and valley ingress</td>
                <td className="py-3 px-3 text-slate-300">Crucial for rotary-wing air evacuation flight planning.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Safety Mandate: Distinguishing Physical Reality from 3D Modeling */}
      <div className="bg-amber-950/20 border border-amber-900/60 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Mandatory Operational Rule: Prevention of 3D False Precision
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In 3D scientific visualization, visual realism must never be conflated with empirical precision.
          The platform explicitly categorizes all layers into three distinct epistemological tiers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">
              1. Observed / Measured Data
            </span>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Satellite SAR C-band backscatter (dB)</li>
              <li>• USGS/Copernicus digital elevation models (DEM)</li>
              <li>• OpenStreetMap road network geometry</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block">
              2. AI Predictions & Estimates
            </span>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• AI flood probability masks P(Flood)</li>
              <li>• Vectorized flood boundary polygons</li>
              <li>• <strong>Estimated Flood Depth</strong> (hydraulic estimate)</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">
              3. Modeled Network Consequences
            </span>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• Road segment impact score (0–100)</li>
              <li>• Tarjan bridge cut-edge status</li>
              <li>• <strong>Candidate Potentially Isolated Areas</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
