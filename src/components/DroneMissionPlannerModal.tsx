import React, { useState, useMemo } from 'react';
import {
  X,
  Plane,
  Navigation,
  Battery,
  Clock,
  Compass,
  MapPin,
  ShieldAlert,
  Layers,
  CheckCircle,
  Truck,
  Anchor,
  Send,
  Download,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { FloodEventStudyArea, ResponseLocation, CandidateIsolatedArea, Coordinate } from '../types/flood';
import { haversineDistanceMeters } from '../utils/geoCalculations';

export interface DroneMissionPlan {
  id: string;
  mode: 'drone' | 'ground' | 'amphibious';
  departureHub: ResponseLocation;
  targetArea: CandidateIsolatedArea;
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  batteryUsagePercent?: number;
  payloadType: 'recon_sensor' | 'medical_kit' | 'satellite_comm' | 'rations';
  payloadWeightKg: number;
  flightCeilingAglMeters: number;
  isFeasible: boolean;
  statusMessage: string;
  waypoints: {
    name: string;
    lat: number;
    lng: number;
    altMeters: number;
    action: string;
  }[];
}

interface DroneMissionPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FloodEventStudyArea;
  activeDispatchCenter: ResponseLocation;
  theme?: 'dark' | 'light';
  onDeployMissionToMap?: (mission: DroneMissionPlan) => void;
}

export const DroneMissionPlannerModal: React.FC<DroneMissionPlannerModalProps> = ({
  isOpen,
  onClose,
  event,
  activeDispatchCenter,
  theme = 'dark',
  onDeployMissionToMap,
}) => {
  const isLight = theme === 'light';

  const [selectedHubId, setSelectedHubId] = useState<string>(activeDispatchCenter?.id || event.responseCenters[0]?.id || '');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(event.candidateIsolatedAreas[0]?.id || '');
  const [missionMode, setMissionMode] = useState<'drone' | 'amphibious' | 'ground'>('drone');
  const [payloadType, setPayloadType] = useState<'medical_kit' | 'recon_sensor' | 'satellite_comm' | 'rations'>('medical_kit');
  const [cruiseSpeedKmh, setCruiseSpeedKmh] = useState<number>(65); // 65 km/h for heavy-lift enterprise drone
  const [flightCeilingAglMeters, setFlightCeilingAglMeters] = useState<number>(90); // 90m AGL
  const [isSimulatingLaunch, setIsSimulatingLaunch] = useState(false);
  const [deployedSuccess, setDeployedSuccess] = useState(false);

  // Active departure hub
  const departureHub = useMemo(() => {
    return event.responseCenters.find((rc) => rc.id === selectedHubId) || event.responseCenters[0];
  }, [event.responseCenters, selectedHubId]);

  // Active target area
  const targetArea = useMemo(() => {
    return event.candidateIsolatedAreas.find((ia) => ia.id === selectedTargetId) || event.candidateIsolatedAreas[0];
  }, [event.candidateIsolatedAreas, selectedTargetId]);

  // Calculate mission parameters
  const missionPlan = useMemo<DroneMissionPlan>(() => {
    if (!departureHub || !targetArea) {
      return {
        id: 'mission-null',
        mode: missionMode,
        departureHub,
        targetArea,
        totalDistanceKm: 0,
        estimatedTimeMinutes: 0,
        payloadType,
        payloadWeightKg: 0,
        flightCeilingAglMeters,
        isFeasible: false,
        statusMessage: 'Invalid hub or target configuration',
        waypoints: [],
      };
    }

    const directDistanceM = haversineDistanceMeters(
      departureHub.position.lat,
      departureHub.position.lng,
      targetArea.position.lat,
      targetArea.position.lng
    );
    const directDistanceKm = directDistanceM / 1000;

    let payloadWeight = 2.5; // kg
    if (payloadType === 'recon_sensor') payloadWeight = 1.2;
    if (payloadType === 'satellite_comm') payloadWeight = 4.8;
    if (payloadType === 'rations') payloadWeight = 6.0;

    if (missionMode === 'drone') {
      // Round trip distance + 15% maneuvering / climb reserve
      const oneWayKm = directDistanceKm * 1.08;
      const roundTripKm = oneWayKm * 2;
      const speedKmPerMin = cruiseSpeedKmh / 60;
      const flightDurationMinutes = roundTripKm / speedKmPerMin;
      // Typical enterprise battery rate: ~3.2% per km under payload
      const baseConsumption = roundTripKm * 2.8;
      const payloadPenalty = payloadWeight * 2.2;
      const totalBatteryUsed = Math.min(100, Math.round(baseConsumption + payloadPenalty));
      const isFeasible = totalBatteryUsed <= 82; // 18% emergency RTH margin required

      // Synthesize 5 tactical flight waypoints
      const midLat = (departureHub.position.lat + targetArea.position.lat) / 2;
      const midLng = (departureHub.position.lng + targetArea.position.lng) / 2;

      const waypoints = [
        {
          name: `WP1: Takeoff & Climb`,
          lat: departureHub.position.lat,
          lng: departureHub.position.lng,
          altMeters: flightCeilingAglMeters,
          action: 'Vertical ascent, GPS RTK fix established',
        },
        {
          name: `WP2: Ingress Transit Corridor`,
          lat: departureHub.position.lat * 0.65 + targetArea.position.lat * 0.35,
          lng: departureHub.position.lng * 0.65 + targetArea.position.lng * 0.35,
          altMeters: flightCeilingAglMeters,
          action: 'Cruise level flight, powerline radar avoidance active',
        },
        {
          name: `WP3: Flood Inundation Boundary Check`,
          lat: midLat,
          lng: midLng,
          altMeters: flightCeilingAglMeters,
          action: 'Downlink optical & thermal telemetry',
        },
        {
          name: `WP4: Target Drop / Recon Zone`,
          lat: targetArea.position.lat,
          lng: targetArea.position.lng,
          altMeters: 25, // Low descent for payload winch / drop
          action: `Deploy ${payloadType.replace('_', ' ')} (${payloadWeight} kg) to community LZ`,
        },
        {
          name: `WP5: Egress & Recovery (RTH)`,
          lat: departureHub.position.lat,
          lng: departureHub.position.lng,
          altMeters: 0,
          action: 'Autonomous precision landing at launch pad',
        },
      ];

      return {
        id: `UAV-${Date.now().toString().slice(-4)}`,
        mode: 'drone',
        departureHub,
        targetArea,
        totalDistanceKm: parseFloat(roundTripKm.toFixed(1)),
        estimatedTimeMinutes: parseFloat(flightDurationMinutes.toFixed(1)),
        batteryUsagePercent: totalBatteryUsed,
        payloadType,
        payloadWeightKg: payloadWeight,
        flightCeilingAglMeters,
        isFeasible,
        statusMessage: isFeasible
          ? `Feasible: ${100 - totalBatteryUsed}% battery reserve remaining at landing.`
          : `CAUTION: Round-trip distance (${roundTripKm.toFixed(1)} km) exceeds safety battery reserve threshold!`,
        waypoints,
      };
    } else if (missionMode === 'amphibious') {
      // Amphibious carrier overland distance (follows road corridor with detours)
      const roadDetourKm = directDistanceKm * 1.45;
      const speedKmPerMin = 35 / 60; // 35 km/h through mud/water
      const durationMinutes = roadDetourKm / speedKmPerMin;

      return {
        id: `AMPH-${Date.now().toString().slice(-4)}`,
        mode: 'amphibious',
        departureHub,
        targetArea,
        totalDistanceKm: parseFloat(roadDetourKm.toFixed(1)),
        estimatedTimeMinutes: parseFloat(durationMinutes.toFixed(1)),
        payloadType,
        payloadWeightKg: 1200, // Heavy equipment & personnel
        flightCeilingAglMeters: 0,
        isFeasible: true,
        statusMessage: 'Feasible: Amphibious tracked carrier traverses shallow flooded roadways up to 1.2m depth.',
        waypoints: [
          {
            name: 'Staging Depot Departure',
            lat: departureHub.position.lat,
            lng: departureHub.position.lng,
            altMeters: 0,
            action: 'FMTV / LARC-V loaded with personnel',
          },
          {
            name: 'Inundation Water Entry Point',
            lat: departureHub.position.lat * 0.4 + targetArea.position.lat * 0.6,
            lng: departureHub.position.lng * 0.4 + targetArea.position.lng * 0.6,
            altMeters: 0,
            action: 'Transition to water-propulsion drive',
          },
          {
            name: 'Community Egress Beachhead',
            lat: targetArea.position.lat,
            lng: targetArea.position.lng,
            altMeters: 0,
            action: 'Arrival at isolated community center',
          },
        ],
      };
    } else {
      // Ground ambulance / fire
      const isSevered = targetArea.isIsolated;
      const detourKm = targetArea.shortestPathDistanceKm || directDistanceKm * 1.6;
      const durationMinutes = isSevered ? 999 : detourKm / (50 / 60);

      return {
        id: `GND-${Date.now().toString().slice(-4)}`,
        mode: 'ground',
        departureHub,
        targetArea,
        totalDistanceKm: parseFloat(detourKm.toFixed(1)),
        estimatedTimeMinutes: isSevered ? 0 : parseFloat(durationMinutes.toFixed(1)),
        payloadType,
        payloadWeightKg: 450,
        flightCeilingAglMeters: 0,
        isFeasible: !isSevered,
        statusMessage: isSevered
          ? 'IMPASSABLE: Primary and secondary road corridors are submerged (P > 0.65). Ground units cannot reach destination without amphibious or air support!'
          : 'Passable: Ground units can navigate via alternate elevated detour route.',
        waypoints: [],
      };
    }
  }, [departureHub, targetArea, missionMode, payloadType, cruiseSpeedKmh, flightCeilingAglMeters]);

  if (!isOpen) return null;

  const handleDeployToMap = () => {
    setIsSimulatingLaunch(true);
    setDeployedSuccess(false);

    setTimeout(() => {
      setIsSimulatingLaunch(false);
      setDeployedSuccess(true);
      if (onDeployMissionToMap) {
        onDeployMissionToMap(missionPlan);
      }
    }, 600);
  };

  const handleDownloadFlightManifest = () => {
    const manifest = {
      missionCallsign: missionPlan.id,
      timestamp: new Date().toISOString(),
      platform: missionPlan.mode === 'drone' ? 'Autonomous Heavy-Lift Enterprise UAV' : missionPlan.mode === 'amphibious' ? 'Amphibious All-Terrain Transport' : 'Ground Emergency Rescue Unit',
      departureHub: missionPlan.departureHub.name,
      targetIsolatedCommunity: missionPlan.targetArea.name,
      estimatedCommunityPopulation: missionPlan.targetArea.estimatedPopulation,
      totalDistanceKm: missionPlan.totalDistanceKm,
      estimatedFlightDurationMinutes: missionPlan.estimatedTimeMinutes,
      batteryConsumptionForecast: `${missionPlan.batteryUsagePercent || 'N/A'}%`,
      payload: {
        type: missionPlan.payloadType,
        weightKg: missionPlan.payloadWeightKg,
      },
      flightCeilingAGL: `${missionPlan.flightCeilingAglMeters} meters`,
      safetyVerdict: missionPlan.statusMessage,
      waypoints: missionPlan.waypoints,
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisFlood_MissionPlan_${missionPlan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                Emergency Response Logistics
              </div>
              <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Rescue Corridor & UAV Drone Recon Mission Planner
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            aria-label="Close Mission Planner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Top Control Bar: Hub, Target, Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Departure Hub */}
            <div className={`p-3 rounded-lg border space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Launch & Recovery Hub:
              </label>
              <select
                value={selectedHubId}
                onChange={(e) => setSelectedHubId(e.target.value)}
                className={`w-full border rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                {event.responseCenters.map((rc) => (
                  <option key={rc.id} value={rc.id}>
                    {rc.name} ({rc.availableUnits} units available)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Isolated Community */}
            <div className={`p-3 rounded-lg border space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Target Isolated Community:
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className={`w-full border rounded px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                {event.candidateIsolatedAreas.map((ia) => (
                  <option key={ia.id} value={ia.id}>
                    {ia.name} (Pop: {ia.estimatedPopulation.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Transport Mode Toggle */}
            <div className={`p-3 rounded-lg border space-y-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <label className={`font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                Transportation Vector:
              </label>
              <div className="grid grid-cols-3 gap-1 pt-0.5">
                <button
                  onClick={() => setMissionMode('drone')}
                  className={`py-1 rounded text-center font-semibold text-[11px] transition-colors border ${
                    missionMode === 'drone'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🛸 UAV Drone
                </button>
                <button
                  onClick={() => setMissionMode('amphibious')}
                  className={`py-1 rounded text-center font-semibold text-[11px] transition-colors border ${
                    missionMode === 'amphibious'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🚜 Amphibious
                </button>
                <button
                  onClick={() => setMissionMode('ground')}
                  className={`py-1 rounded text-center font-semibold text-[11px] transition-colors border ${
                    missionMode === 'ground'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🚑 Standard
                </button>
              </div>
            </div>
          </div>

          {/* Drone-Specific Parameters (if UAV Mode) */}
          {missionMode === 'drone' && (
            <div className={`p-4 rounded-lg border space-y-3 ${
              isLight ? 'bg-cyan-50/50 border-cyan-200' : 'bg-cyan-950/20 border-cyan-900/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
                  isLight ? 'text-cyan-900' : 'text-cyan-300'
                }`}>
                  <Plane className="w-3.5 h-3.5" />
                  Heavy-Lift Recon & Cargo UAV Telemetry Configuration
                </span>
                <span className={`font-mono text-[10px] ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                  DJI Matrice 350 RTK / Heavy Cargo Hexacopter
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payload Type */}
                <div>
                  <label className={`block mb-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Mission Payload:
                  </label>
                  <select
                    value={payloadType}
                    onChange={(e) => setPayloadType(e.target.value as any)}
                    className={`w-full border rounded px-2 py-1 text-xs font-medium cursor-pointer ${
                      isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-950 text-slate-200 border-slate-700'
                    }`}
                  >
                    <option value="medical_kit">Emergency Trauma & Insulin Kit (2.5 kg)</option>
                    <option value="recon_sensor">Thermal / Optical 30x Zoom Gimbal (1.2 kg)</option>
                    <option value="satellite_comm">Satellite Starlink Emergency Beacon (4.8 kg)</option>
                    <option value="rations">Emergency Water Rations & MREs (6.0 kg)</option>
                  </select>
                </div>

                {/* Cruise Speed */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={isLight ? 'text-slate-700' : 'text-slate-400'}>Cruise Speed:</span>
                    <span className="font-mono text-cyan-400 font-bold">{cruiseSpeedKmh} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    step="5"
                    value={cruiseSpeedKmh}
                    onChange={(e) => setCruiseSpeedKmh(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer h-1"
                  />
                </div>

                {/* Flight Altitude Ceiling */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={isLight ? 'text-slate-700' : 'text-slate-400'}>Altitude AGL:</span>
                    <span className="font-mono text-cyan-400 font-bold">{flightCeilingAglMeters}m AGL</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="10"
                    value={flightCeilingAglMeters}
                    onChange={(e) => setFlightCeilingAglMeters(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer h-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mission Metrics Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {missionMode === 'drone' ? 'Round-Trip Distance' : 'Travel Distance'}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-1">
                {missionPlan.totalDistanceKm} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {missionMode === 'drone' ? 'Direct aerial trajectory' : 'Road network corridor'}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Estimated Transit Time
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-400 mt-1">
                {missionPlan.estimatedTimeMinutes > 0 ? `${missionPlan.estimatedTimeMinutes} min` : 'N/A (BLOCKED)'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {missionMode === 'drone' ? `Cruising at ${cruiseSpeedKmh} km/h` : 'Surface terrain speed'}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {missionMode === 'drone' ? 'Forecast Battery Margin' : 'Cargo Capacity'}
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                {missionMode === 'drone'
                  ? `${100 - (missionPlan.batteryUsagePercent || 0)}% reserve`
                  : `${missionPlan.payloadWeightKg} kg`}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {missionMode === 'drone' ? `Consumes ${missionPlan.batteryUsagePercent}% power` : 'Full payload loadout'}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Operational Safety Verdict
              </div>
              <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
                missionPlan.isFeasible ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {missionPlan.isFeasible ? (
                  <>
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>MISSION CLEAR</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>NO-GO / HIGH RISK</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {missionPlan.isFeasible ? 'Within safe operational envelope' : 'Violates safety boundaries'}
              </div>
            </div>
          </div>

          {/* Operational Safety Verdict Banner */}
          <div className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
            missionPlan.isFeasible
              ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
              : isLight ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-rose-950/30 border-rose-800 text-rose-300'
          }`}>
            {missionPlan.isFeasible ? (
              <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
            )}
            <div>
              <span className="font-bold">Mission Assessment: </span>
              {missionPlan.statusMessage}
            </div>
          </div>

          {/* Waypoints Flight Path Table */}
          {missionPlan.waypoints.length > 0 && (
            <div className="space-y-2">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Tactical Waypoint Sequence & Corridor Flight Plan
              </div>
              <div className={`rounded-lg border overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] uppercase font-semibold ${
                      isLight ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-950 text-slate-400 border-b border-slate-800'
                    }`}>
                      <th className="py-2 px-3">Waypoint Leg</th>
                      <th className="py-2 px-3">WGS84 Coordinates</th>
                      <th className="py-2 px-3">Altitude AGL</th>
                      <th className="py-2 px-3">Planned Flight Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-[11px] ${
                    isLight ? 'divide-slate-200 bg-white text-slate-700' : 'divide-slate-800/80 bg-slate-950/40 text-slate-300'
                  }`}>
                    {missionPlan.waypoints.map((wp, idx) => (
                      <tr key={idx} className="hover:bg-slate-500/5">
                        <td className="py-2 px-3 font-semibold text-cyan-400">{wp.name}</td>
                        <td className="py-2 px-3 font-mono text-[10px]">
                          {wp.lat.toFixed(4)}°N, {Math.abs(wp.lng).toFixed(4)}°W
                        </td>
                        <td className="py-2 px-3 font-mono">{wp.altMeters}m</td>
                        <td className="py-2 px-3 text-slate-400">{wp.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFlightManifest}
              className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Download machine-readable mission flight manifest in JSON format"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Flight Manifest JSON</span>
            </button>
            {deployedSuccess && (
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold animate-pulse">
                <CheckCircle className="w-3.5 h-3.5" />
                Active on GIS Map!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              Close
            </button>
            <button
              onClick={handleDeployToMap}
              disabled={isSimulatingLaunch || !missionPlan.isFeasible}
              className={`px-4 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${isSimulatingLaunch ? 'animate-bounce' : ''}`} />
              <span>{isSimulatingLaunch ? 'Transmitting Corridor...' : 'Project Flight Path to GIS Map'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
