/**
 * AI-Powered Flood Damage and Connectivity Mapping Platform
 * Core TypeScript definitions for Remote Sensing, GIS, Network Graph, and Provenance
 */

export type SensorType = 'Sentinel-1-SAR' | 'Sentinel-2-Optical' | 'Multi-Modal-Fusion';

export type RoadClassification = 
  | 'motorway' 
  | 'trunk' 
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'residential' 
  | 'service';

export type ImpactCategory = 'SAFE' | 'POTENTIALLY_AFFECTED' | 'HIGHLY_AFFECTED';

export type ConfidenceLevel = 'LOW CONFIDENCE' | 'MEDIUM CONFIDENCE' | 'HIGH CONFIDENCE';

export type ScenarioType = 
  | 'scenario-1' // High-confidence flood impact only (P > 0.85)
  | 'scenario-2' // Moderate + high-confidence flood impact (P > 0.60)
  | 'scenario-3' // Potentially affected bridges severed
  | 'scenario-4'; // Probabilistic Monte Carlo network disruption

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface SatelliteMetadata {
  sensor: SensorType;
  platform: string;
  orbitMode: 'Ascending' | 'Descending';
  polarization: 'VV' | 'VH' | 'VV+VH';
  spatialResolutionMeters: number;
  preEventAcquisitionDate: string;
  postEventAcquisitionDate: string;
  relativeOrbit: number;
  crs: string;
  processingLevel: 'GRD (Ground Range Detected)' | 'L2A (Bottom of Atmosphere)';
  incidenceAngleMeanDeg: number;
  cloudCoverPercent?: number;
  provenanceSource: string;
}

export interface FloodPolygon {
  id: string;
  name: string;
  areaKm2: number;
  perimeterKm: number;
  meanFloodProbability: number;
  confidence: ConfidenceLevel;
  maxDepthEstimateMeters: number;
  sourceSensor: SensorType;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][]; // [lat, lng] array for leaflet polygon
  };
}

export interface RoadSegment {
  id: string;
  osmId: string;
  name: string;
  classification: RoadClassification;
  totalLengthMeters: number;
  affectedLengthMeters: number;
  affectedLengthRatio: number; // 0 to 1
  meanFloodProbability: number; // 0 to 1
  maxFloodProbability: number; // 0 to 1
  criticalityWeight: number; // 1 to 5 based on road hierarchy
  impactScore: number; // 0 to 100 calculated from formula
  impactCategory: ImpactCategory;
  isBridge: boolean;
  bridgeId?: string;
  geometry: [number, number][]; // Array of [lat, lng]
  nearestFloodPolygonId: string;
  speedLimitKmh: number;
  nominalTravelTimeSec: number;
  evidence: {
    sarBackscatterDeltaDb: number;
    ndwiOpticalIndex?: number;
    terrainElevationMeters: number;
    sarConfidence: number;
  };
}

export interface BridgeNode {
  id: string;
  osmId: string;
  name: string;
  waterwayName: string;
  roadName: string;
  position: Coordinate;
  isArticulationPoint: boolean; // Graph edge/node whose removal disconnects regions
  betweennessCentrality: number; // 0 to 1
  networkRedundancy: 'SINGLE_CHOKE_POINT' | 'MODERATE_DETOUR' | 'HIGH_REDUNDANCY';
  floodProbability: number;
  isSeveredInScenario: boolean;
  detourDistanceKm: number;
  estimatedDetourTimeMinutes: number;
}

export interface ResponseLocation {
  id: string;
  name: string;
  type: 'Emergency Operations Center' | 'Hospital & Trauma Center' | 'Fire & Rescue Station' | 'Evacuation Shelter' | 'Aviation Staging Depot';
  position: Coordinate;
  availableUnits: number;
  contactCallsign: string;
  isActiveDispatch: boolean;
}

export interface CandidateIsolatedArea {
  id: string;
  name: string;
  type: 'Village / Hamlet' | 'Residential Community' | 'Critical Health Clinic' | 'Community School & Shelter';
  position: Coordinate;
  estimatedPopulation: number;
  isIsolated: boolean; // Dynamic based on active scenario and dispatch center
  shortestPathDistanceKm: number;
  shortestPathTravelTimeMinutes: number;
  failedRoutesCount: number;
  nearestSeveredRoadId?: string;
  nearestSeveredBridgeId?: string;
  modelConfidence: ConfidenceLevel;
  requiredAssistanceMode: 'High-Clearance Military Truck' | 'Swiftwater Rescue Boat' | 'Rotary-Wing Air Evacuation' | 'Amphibious Tracked Carrier';
  fieldVerificationStatus: 'REQUIRES IMMEDIATE FIELD VERIFICATION' | 'RECONNAISSANCE SATELLITE PASS SCHEDULED';
  pathGeometry?: [number, number][];
  alternativePathGeometry?: [number, number][];
}

export interface NetworkGraphNode {
  id: string;
  label: string;
  position: Coordinate;
  isResponseHub: boolean;
  isIsolatedCandidate: boolean;
  connectedEdges: string[];
}

export interface NetworkGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  roadId: string;
  lengthMeters: number;
  isPassable: boolean;
  weight: number; // impedance = length * penalty
  floodProbability: number;
}

export interface WaterLevelTrendPoint {
  timestamp: string; // e.g. "T-48h", "T-24h", "T-0h (Peak)", "T+24h"
  formattedTime: string; // e.g. "Jul 26 12:00", "Jul 27 00:00"
  stageMeters: number; // simulated river gauge water stage in meters
  stageFeet: number; // stage in feet
  dischargeM3s: number; // streamflow discharge rate (m³/s)
  floodedAreaKm2: number; // simulated inundation extent (km²)
  rainfallMmPerHour: number; // precipitation intensity (mm/h)
  status: 'Normal' | 'Action Stage' | 'Minor Flood' | 'Moderate Flood' | 'Major Flood' | 'Record Crest';
}

export interface HydrologicalProfile {
  gaugeStationName: string;
  gaugeStationId: string;
  riverBasin: string;
  normalStageMeters: number;
  actionStageMeters: number;
  minorFloodStageMeters: number;
  moderateFloodStageMeters: number;
  majorFloodStageMeters: number;
  recordCrestMeters: number;
  peakStageMeters: number;
  crestTimestamp: string;
  data: WaterLevelTrendPoint[];
}

export interface FloodEventStudyArea {
  id: string;
  name: string;
  location: string;
  country: string;
  eventDate: string;
  description: string;
  center: Coordinate;
  defaultZoom: number;
  boundingBox: BoundingBox;
  satelliteMetadata: SatelliteMetadata;
  polygons: FloodPolygon[];
  roads: RoadSegment[];
  bridges: BridgeNode[];
  responseCenters: ResponseLocation[];
  candidateIsolatedAreas: CandidateIsolatedArea[];
  sarPreFloodImage: string;
  sarPostFloodImage: string;
  opticalPostFloodImage: string;
  demElevationImage: string;
  hydrologicalProfile?: HydrologicalProfile;
}

export interface ImpactFormulaWeights {
  w1_affectedLength: number; // weight for affected length ratio (default 0.35)
  w2_meanProbability: number; // weight for mean flood probability (default 0.25)
  w3_maxProbability: number; // weight for max flood probability (default 0.25)
  w4_criticality: number; // weight for road classification criticality (default 0.15)
}
