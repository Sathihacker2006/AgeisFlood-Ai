import React, { useState } from 'react';
import { FloodEventStudyArea, ScenarioType, ResponseLocation, BridgeNode, RoadSegment } from '../types/flood';
import { Activity, Network, AlertTriangle, ShieldCheck, GitCommit, Split, CornerDownRight } from 'lucide-react';

interface ConnectivityGraphViewProps {
  event: FloodEventStudyArea;
  scenario: ScenarioType;
  activeDispatchCenter: ResponseLocation;
}

export const ConnectivityGraphView: React.FC<ConnectivityGraphViewProps> = ({
  event,
  scenario,
  activeDispatchCenter,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200 space-y-6">
      {/* Title & Pipeline Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
            Module E & F — Road Network Graph & Connectivity Engine
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Graph Topology & Reachability Analysis: G = (V, E)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            The physical road network is abstracted into a weighted directional graph where intersections and critical facilities
            form vertices <span className="font-mono text-cyan-300">V</span>, and road segments form edges <span className="font-mono text-cyan-300">E</span>.
            Inundated road segments and bridge articulation cuts apply impedance penalties to identify disconnected components.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Active Dispatch Root</div>
          <div className="text-xs font-bold text-cyan-400 font-mono truncate max-w-[200px]">
            {activeDispatchCenter.name}
          </div>
        </div>
      </div>

      {/* Graph Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] uppercase font-mono text-slate-400 flex items-center justify-between">
            <span>Total Graph Vertices</span>
            <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {event.responseCenters.length + event.candidateIsolatedAreas.length + event.bridges.length + 8}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Intersections & facilities</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] uppercase font-mono text-slate-400 flex items-center justify-between">
            <span>Graph Edges</span>
            <Network className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {event.roads.length * 2}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Bi-directional road links</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] uppercase font-mono text-slate-400 flex items-center justify-between">
            <span>Bridge Articulation Cuts</span>
            <Split className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {event.bridges.filter((b) => b.isArticulationPoint).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Disconnection choke points</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] uppercase font-mono text-slate-400 flex items-center justify-between">
            <span>Isolated Subgraphs</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {event.candidateIsolatedAreas.filter((c) => c.isIsolated).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Candidate disconnected clusters</div>
        </div>
      </div>

      {/* SVG Interactive Topology Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Schematic Topological Disruption Graph
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Dispatch Root
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Reachable Node
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Isolated Node
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Articulation Bridge
            </span>
          </div>
        </div>

        {/* SVG Diagram Canvas */}
        <div className="bg-slate-950 rounded-lg border border-slate-800 p-6 flex justify-center items-center overflow-x-auto min-h-[380px]">
          <svg viewBox="0 0 880 340" className="w-full max-w-[880px] h-auto text-xs font-mono">
            {/* Defs for gradients & markers */}
            <defs>
              <linearGradient id="edgePassable" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="edgeBlocked" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>

            {/* Edge 1: Root EOC (100, 170) -> Node JCT-A (240, 110) */}
            <line x1="120" y1="170" x2="240" y2="110" stroke="#10b981" strokeWidth="3" />
            <text x="160" y="130" fill="#94a3b8" fontSize="10">KY-15 North (88 km/h)</text>

            {/* Edge 2: Root EOC (100, 170) -> Node JCT-B (240, 230) */}
            <line x1="120" y1="170" x2="240" y2="230" stroke="#10b981" strokeWidth="3" />
            <text x="155" y="215" fill="#94a3b8" fontSize="10">Scenic Ridge Connector</text>

            {/* Edge 3: JCT-A (240, 110) -> Bridge KY-15 Viaduct (420, 110) [BLOCKED IN FLOOD] */}
            <line
              x1="240"
              y1="110"
              x2="420"
              y2="110"
              stroke="#f43f5e"
              strokeWidth="3.5"
              strokeDasharray="6,4"
            />
            <text x="300" y="100" fill="#f43f5e" fontSize="10" fontWeight="bold">
              [SEVERED] P(F)=94%
            </text>

            {/* Edge 4: Bridge KY-15 (420, 110) -> Candidate Node Clayhole (620, 80) */}
            <line x1="420" y1="110" x2="620" y2="80" stroke="#f43f5e" strokeWidth="3" strokeDasharray="6,4" />
            <text x="500" y="85" fill="#f43f5e" fontSize="10">Clayhole Branch Access</text>

            {/* Edge 5: Bridge KY-15 (420, 110) -> Candidate Node Lost Creek (640, 150) */}
            <line x1="420" y1="110" x2="640" y2="150" stroke="#f43f5e" strokeWidth="3" strokeDasharray="6,4" />
            <text x="510" y="145" fill="#f43f5e" fontSize="10">KY-28 East Corridor</text>

            {/* Edge 6: JCT-B (240, 230) -> High Elevation Bypass (460, 250) [SAFE PASSABLE] */}
            <line x1="240" y1="230" x2="460" y2="250" stroke="#10b981" strokeWidth="3" />
            <text x="320" y="235" fill="#10b981" fontSize="10">Buckhorn Mountain Ridge</text>

            {/* Edge 7: Bypass (460, 250) -> Buckhorn Shelter (680, 250) [REACHABLE] */}
            <line x1="460" y1="250" x2="680" y2="250" stroke="#10b981" strokeWidth="3" />
            <text x="540" y="240" fill="#10b981" fontSize="10">Passable Emergency Route</text>

            {/* Edge 8: Bypass (460, 250) -> Lost Creek (640, 150) [CROSSES FLOODED HOLLOW] */}
            <line x1="460" y1="250" x2="640" y2="150" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="5,4" />
            <text x="530" y="200" fill="#f43f5e" fontSize="9">Secondary Hollow Crossing (Failed)</text>

            {/* NODES */}
            {/* Root Node: Dispatch EOC */}
            <g transform="translate(100, 170)">
              <circle r="16" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
              <text textAnchor="middle" y="4" fill="#0f172a" fontSize="10" fontWeight="bold">EOC</text>
              <text textAnchor="middle" y="28" fill="#38bdf8" fontSize="11" fontWeight="bold">
                {activeDispatchCenter.contactCallsign}
              </text>
              <text textAnchor="middle" y="40" fill="#94a3b8" fontSize="9">Origin Root Node</text>
            </g>

            {/* Intermediate JCT-A */}
            <g transform="translate(240, 110)">
              <circle r="10" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
              <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="10">JCT-A (KY-15)</text>
            </g>

            {/* Intermediate JCT-B */}
            <g transform="translate(240, 230)">
              <circle r="10" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
              <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="10">JCT-B (High Route)</text>
            </g>

            {/* Critical Bridge Articulation Point */}
            <g transform="translate(420, 110)">
              <circle r="14" fill="#f59e0b" stroke="#f43f5e" strokeWidth="3" />
              <text textAnchor="middle" y="4" fill="#0f172a" fontSize="9" fontWeight="bold">BRG</text>
              <text textAnchor="middle" y="26" fill="#f59e0b" fontSize="10" fontWeight="bold">
                Troublesome Creek Viaduct
              </text>
              <text textAnchor="middle" y="38" fill="#f43f5e" fontSize="9">
                Articulation Point Cut-Edge
              </text>
            </g>

            {/* High Elevation Junction */}
            <g transform="translate(460, 250)">
              <circle r="10" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
              <text textAnchor="middle" y="22" fill="#cbd5e1" fontSize="10">Buckhorn Pass</text>
            </g>

            {/* Target Node: Clayhole (ISOLATED) */}
            <g transform="translate(620, 80)">
              <circle r="14" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
              <text textAnchor="middle" y="4" fill="#ffffff" fontSize="9" fontWeight="bold">ISO-1</text>
              <text textAnchor="middle" y="24" fill="#f43f5e" fontSize="10" fontWeight="bold">
                Clayhole Hollow (Pop: 640)
              </text>
              <text textAnchor="middle" y="36" fill="#fca5a5" fontSize="9">
                CANDIDATE POTENTIALLY ISOLATED
              </text>
            </g>

            {/* Target Node: Lost Creek (ISOLATED) */}
            <g transform="translate(640, 150)">
              <circle r="14" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
              <text textAnchor="middle" y="4" fill="#ffffff" fontSize="9" fontWeight="bold">ISO-2</text>
              <text textAnchor="middle" y="24" fill="#f43f5e" fontSize="10" fontWeight="bold">
                Lost Creek Settlement (Pop: 420)
              </text>
              <text textAnchor="middle" y="36" fill="#fca5a5" fontSize="9">
                CANDIDATE POTENTIALLY ISOLATED
              </text>
            </g>

            {/* Target Node: Buckhorn Shelter (REACHABLE) */}
            <g transform="translate(680, 250)">
              <circle r="14" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <text textAnchor="middle" y="4" fill="#ffffff" fontSize="9" fontWeight="bold">OK</text>
              <text textAnchor="middle" y="24" fill="#10b981" fontSize="10" fontWeight="bold">
                Buckhorn Shelter (Pop: 180)
              </text>
              <text textAnchor="middle" y="36" fill="#86efac" fontSize="9">
                PASSABLE REACHABLE ROUTE
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Network Theory Methodology & Mathematical Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
            Tarjan's Bridge-Finding & Articulation Point Theory
          </div>
          <p className="text-slate-400 leading-relaxed">
            In graph theory, an <strong>articulation point</strong> (or cut vertex) is a node whose removal increases the number
            of connected components of graph <span className="font-mono text-cyan-300">G</span>. A <strong>bridge</strong> (or cut edge)
            is an edge whose removal partitions the network.
          </p>
          <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] text-cyan-300">
            low[u] = min(disc[u], min_v(low[v]), min_w(disc[w]))
            <br />
            Edge (u, v) is a bridge if: low[v] &gt; disc[u]
          </div>
          <p className="text-slate-400 text-[11px]">
            In mountainous hollow networks (e.g. Eastern Kentucky), bridges across creeks are frequently single-point failures with zero redundancy.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
            Flood Impedance Penalty & Shortest Path Formulation
          </div>
          <p className="text-slate-400 leading-relaxed">
            Standard travel time along road segment <span className="font-mono text-cyan-300">e</span> is modulated by AI flood probability:
          </p>
          <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] text-amber-300">
            Cost(e) = (Length(e) / Speed(e)) × [1 + λ · P(Flood|e)²]
            <br />
            If P(Flood|e) &gt; Threshold: Cost(e) → ∞ (Edge severed)
          </div>
          <p className="text-slate-400 text-[11px]">
            Dijkstra's or A* algorithm computes the optimal path with dynamic impedance. If no finite-cost path exists from the active
            EOC, the destination is added to the <strong>Candidate Potentially Isolated</strong> register.
          </p>
        </div>
      </div>
    </div>
  );
};
