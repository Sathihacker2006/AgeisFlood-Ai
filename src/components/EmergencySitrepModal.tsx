import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  ShieldAlert,
  Waves,
  Building2,
  AlertTriangle,
  Route,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { FloodEventStudyArea, ScenarioType } from '../types/flood';
import { getHydrologicalProfile } from '../data/hydrologicalData';

interface EmergencySitrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FloodEventStudyArea;
  scenario: ScenarioType;
  totalFloodedAreaKm2: number;
  affectedRoadLengthKm: number;
  affectedBridgesCount: number;
  isolatedCount: number;
  currentTimeStep?: string;
  currentStageMeters?: number;
}

export const EmergencySitrepModal: React.FC<EmergencySitrepModalProps> = ({
  isOpen,
  onClose,
  event,
  scenario,
  totalFloodedAreaKm2,
  affectedRoadLengthKm,
  affectedBridgesCount,
  isolatedCount,
  currentTimeStep,
  currentStageMeters,
}) => {
  const [copied, setCopied] = useState(false);
  const profile = event.hydrologicalProfile || getHydrologicalProfile(event.id);
  const activeStage = currentStageMeters ?? profile.peakStageMeters;

  if (!isOpen) return null;

  const sitrepId = `SITREP-${event.id.toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const generationTimeUTC = new Date().toUTCString();

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const reportData = {
      reportId: sitrepId,
      timestampUTC: generationTimeUTC,
      studyArea: {
        id: event.id,
        name: event.name,
        location: event.location,
        country: event.country,
        coordinates: event.center,
      },
      hydrology: {
        gaugeStation: profile.gaugeStationName,
        gaugeId: profile.gaugeStationId,
        basin: profile.riverBasin,
        currentStageMeters: activeStage,
        peakCrestMeters: profile.peakStageMeters,
        majorFloodThresholdMeters: profile.majorFloodStageMeters,
        activeStep: currentTimeStep || 'T-0h (Peak)',
      },
      infrastructureImpact: {
        scenario,
        floodedAreaKm2: totalFloodedAreaKm2,
        affectedRoadsKm: affectedRoadLengthKm,
        affectedBridgesCount,
        isolatedCommunitiesCount: isolatedCount,
      },
      evacuationManifest: event.candidateIsolatedAreas.map((iso, idx) => ({
        rank: idx + 1,
        name: iso.name,
        type: iso.type,
        populationAtRisk: iso.estimatedPopulation,
        status: iso.isIsolated ? 'CUT_OFF_REQUIRES_DISPATCH' : 'PASSABLE',
        recommendedModality: iso.requiredAssistanceMode,
        coordinates: iso.position,
      })),
      singlePointsOfFailureBridges: event.bridges
        .filter((b) => b.isArticulationPoint)
        .map((b) => ({
          bridgeId: b.id,
          name: b.name,
          waterway: b.waterwayName,
          roadName: b.roadName,
          detourDistanceKm: b.detourDistanceKm,
        })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sitrepId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const textSummary = `
======================================================
AEGISFLOOD AI - OPERATIONAL SITUATION REPORT (SITREP)
REF: ${sitrepId}
GENERATED: ${generationTimeUTC}
STUDY AREA: ${event.name} (${event.location})
======================================================
1. HYDROLOGICAL THREAT LEVEL:
   - River Basin: ${profile.riverBasin}
   - Gauge Station: ${profile.gaugeStationName} (${profile.gaugeStationId})
   - Active Stage: ${activeStage.toFixed(2)} m (Crest: ${profile.peakStageMeters} m)
   - Status: ${activeStage >= profile.majorFloodStageMeters ? 'CRITICAL MAJOR FLOOD OVERTOPPING' : 'ELEVATED FLOOD STAGE'}

2. DISASTER EXTENT & INFRASTRUCTURE TALLY:
   - Inundation Extent: ${totalFloodedAreaKm2.toFixed(2)} km²
   - Road Infrastructure Impassable: ${affectedRoadLengthKm.toFixed(1)} km
   - Critical Bridges Compromised: ${affectedBridgesCount}
   - Candidate Isolated Communities: ${isolatedCount}

3. PRIORITY EVACUATION MANIFEST:
${event.candidateIsolatedAreas
  .map(
    (iso, i) =>
      `   [P${i + 1}] ${iso.name} | Pop: ${iso.estimatedPopulation} | Modality: ${iso.requiredAssistanceMode}`
  )
  .join('\n')}

4. CRITICAL CUT-EDGE BRIDGES:
${event.bridges
  .filter((b) => b.isArticulationPoint)
  .map((b) => `   - ${b.name} (${b.waterwayName}) -> Detour: +${b.detourDistanceKm} km`)
  .join('\n')}
======================================================
    `.trim();

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Emergency Incident Situation Report (SITREP)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  OPERATIONAL COMMAND BRIEFING
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 font-mono">
                <span>{sitrepId}</span>
                <span>·</span>
                <span>{generationTimeUTC}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Copy text summary to clipboard"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${copied ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Download machine-readable JSON format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5"
              title="Print official emergency briefing format"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print SITREP</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Executive Incident Overview
              </span>
              <span className="font-mono text-cyan-400 text-[11px]">{event.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Flooded Extent</span>
                <div className="text-xl font-mono font-bold text-cyan-400 mt-0.5">
                  {totalFloodedAreaKm2.toFixed(2)} <span className="text-xs font-normal">km²</span>
                </div>
                <span className="text-[10px] text-slate-500">SAR verified surface</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Impassable Roads</span>
                <div className="text-xl font-mono font-bold text-amber-400 mt-0.5">
                  {affectedRoadLengthKm.toFixed(1)} <span className="text-xs font-normal">km</span>
                </div>
                <span className="text-[10px] text-slate-500">P &gt; 0.60 water depth</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Bridges Compromised</span>
                <div className="text-xl font-mono font-bold text-rose-400 mt-0.5">
                  {affectedBridgesCount} <span className="text-xs font-normal">structures</span>
                </div>
                <span className="text-[10px] text-slate-500">Overtopped / scour risk</span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Isolated Pop. Enclaves</span>
                <div className="text-xl font-mono font-bold text-rose-400 mt-0.5">
                  {isolatedCount} <span className="text-xs font-normal">communities</span>
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium">Zero ground ingress</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs">
              {event.description} Remote sensing satellite SAR pass confirms widespread valley bottom inundation.
              Emergency medical services and relief supplies must rely on specialized shallow-draft or rotary-wing
              transit until stage recession below action threshold.
            </p>
          </div>

          {/* Hydrological Gauge Intelligence */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                Hydrological Telemetry & River Gauge Stage
              </span>
              <span className="font-mono text-slate-400 text-[11px]">{profile.gaugeStationId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400">Monitoring Station</span>
                <div className="font-semibold text-white">{profile.gaugeStationName}</div>
                <div className="text-[10px] text-slate-400 font-mono">{profile.riverBasin}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400">Current Gauge Stage</span>
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {activeStage.toFixed(2)} m{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({(activeStage * 3.28084).toFixed(1)} ft)
                  </span>
                </div>
                <div className="text-[10px] text-rose-400 font-mono">
                  Major Flood Threshold: {profile.majorFloodStageMeters} m
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400">Historic Peak Crest</span>
                <div className="text-lg font-mono font-bold text-rose-400">
                  {profile.peakStageMeters} m{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({(profile.peakStageMeters * 3.28084).toFixed(1)} ft)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Crest Time: {profile.crestTimestamp}</div>
              </div>
            </div>
          </div>

          {/* Priority Evacuation & Rescue Manifest */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Priority Evacuation & Rescue Manifest
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {event.candidateIsolatedAreas.length} Target Enclaves Identified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                    <th className="py-2 px-2">Priority</th>
                    <th className="py-2 px-2">Community / Enclave</th>
                    <th className="py-2 px-2">Est. Pop</th>
                    <th className="py-2 px-2">Isolation Status</th>
                    <th className="py-2 px-2">Mandated Rescue Modality</th>
                    <th className="py-2 px-2">Cut-off Road/Bridge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {event.candidateIsolatedAreas.map((iso, idx) => (
                    <tr key={iso.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-2 font-bold text-rose-400">P{idx + 1}</td>
                      <td className="py-2 px-2 font-sans font-semibold text-white">
                        {iso.name}
                        <span className="block text-[10px] font-mono text-slate-400">{iso.type}</span>
                      </td>
                      <td className="py-2 px-2 text-cyan-300 font-bold">{iso.estimatedPopulation}</td>
                      <td className="py-2 px-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                          ISOLATED
                        </span>
                      </td>
                      <td className="py-2 px-2 font-sans text-amber-300 font-medium">
                        {iso.requiredAssistanceMode}
                      </td>
                      <td className="py-2 px-2 text-[10px] text-slate-400">
                        {iso.nearestSeveredBridgeId ? `Bridge: ${iso.nearestSeveredBridgeId}` : 'Road Flooded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graph Cut-Edges & Single Point of Failure Articulation Points */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <Route className="w-4 h-4 text-amber-400" />
                Critical Graph Articulation Bridges (Single Points of Failure)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Topological Cut-Edges</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.bridges
                .filter((b) => b.isArticulationPoint)
                .map((bridge) => (
                  <div key={bridge.id} className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{bridge.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                        CUT-EDGE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Crosses: <span className="text-cyan-300">{bridge.waterwayName}</span> · Road:{' '}
                      <span className="text-slate-200">{bridge.roadName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                      <span>Betweenness: {(bridge.betweennessCentrality * 100).toFixed(0)}%</span>
                      <span className="text-amber-400 font-semibold">Detour: +{bridge.detourDistanceKm} km</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Incident Command Recommendations */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Incident Commander Directive & Field Rules of Engagement
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
              <li>Deploy high-clearance military transport only along primary road spines where P(Flood) &lt; 0.40.</li>
              <li>Pre-stage swiftwater rescue squads at designated Emergency Operations Hubs.</li>
              <li>Establish aerial reconnaissance pass to verify candidate isolated areas before committing heavy ground apparatus.</li>
              <li>Continuously monitor river gauge telemetry against major flood threshold before re-opening critical bridge decks.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>AegisFlood AI · Spatial Decision Support System</span>
          <span className="text-slate-500">Confidential · For Authorized Emergency Personnel Only</span>
        </div>
      </div>
    </div>
  );
};
