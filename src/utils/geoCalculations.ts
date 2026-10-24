import { ImpactFormulaWeights, RoadSegment, CandidateIsolatedArea, BridgeNode, ScenarioType } from '../types/flood';

/**
 * Calculates road impact score from configurable weights
 * Formula:
 * ImpactScore = 100 * (w1 * affected_ratio + w2 * mean_prob + w3 * max_prob + w4 * (criticality / 5))
 */
export function calculateRoadImpactScore(
  road: RoadSegment,
  weights: ImpactFormulaWeights
): number {
  const normCriticality = road.criticalityWeight / 5.0;
  const rawScore = 
    weights.w1_affectedLength * road.affectedLengthRatio +
    weights.w2_meanProbability * road.meanFloodProbability +
    weights.w3_maxProbability * road.maxFloodProbability +
    weights.w4_criticality * normCriticality;

  return Math.min(100, Math.max(0, Math.round(rawScore * 100 * 10) / 10));
}

/**
 * Categorizes impact score into standard non-definitive emergency classes
 */
export function getImpactCategory(score: number): 'SAFE' | 'POTENTIALLY_AFFECTED' | 'HIGHLY_AFFECTED' {
  if (score >= 65) return 'HIGHLY_AFFECTED';
  if (score >= 35) return 'POTENTIALLY_AFFECTED';
  return 'SAFE';
}

/**
 * Calculates Great Circle distance between two coordinates in kilometers (Haversine)
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine)
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Point in polygon check using ray-casting algorithm
 * @param point [lat, lng]
 * @param polygonCoords Array of [lat, lng]
 */
export function isPointInPolygon(point: [number, number], polygonCoords: [number, number][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0];
    const yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0];
    const yj = polygonCoords[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Determines whether a candidate community is isolated under the given scenario & active response center
 */
export function evaluateIsolationForScenario(
  candidate: CandidateIsolatedArea,
  scenario: ScenarioType,
  bridges: BridgeNode[],
  roads: RoadSegment[],
  threshold: number
): boolean {
  // If road or bridge serving the area has high inundation
  if (scenario === 'scenario-1') {
    // Only high confidence: P > 0.85
    const severedBridge = bridges.find(b => b.id === candidate.nearestSeveredBridgeId);
    const severedRoad = roads.find(r => r.id === candidate.nearestSeveredRoadId);
    
    const bridgeCut = severedBridge ? severedBridge.floodProbability > 0.85 : false;
    const roadCut = severedRoad ? severedRoad.maxFloodProbability > 0.85 : false;
    return bridgeCut || roadCut;
  }

  if (scenario === 'scenario-2') {
    // Moderate + high confidence: P > threshold (or default 0.60)
    const effectiveThreshold = Math.min(0.60, threshold);
    const severedBridge = bridges.find(b => b.id === candidate.nearestSeveredBridgeId);
    const severedRoad = roads.find(r => r.id === candidate.nearestSeveredRoadId);
    
    const bridgeCut = severedBridge ? severedBridge.floodProbability >= effectiveThreshold : false;
    const roadCut = severedRoad ? severedRoad.maxFloodProbability >= effectiveThreshold : false;
    return bridgeCut || roadCut;
  }

  if (scenario === 'scenario-3') {
    // Critical bridge removals: any articulation bridge severed
    const severedBridge = bridges.find(b => b.id === candidate.nearestSeveredBridgeId);
    if (severedBridge && severedBridge.isArticulationPoint && severedBridge.floodProbability > 0.50) {
      return true;
    }
    const severedRoad = roads.find(r => r.id === candidate.nearestSeveredRoadId);
    return severedRoad ? severedRoad.maxFloodProbability > 0.70 : false;
  }

  if (scenario === 'scenario-4') {
    // Probabilistic simulation: consider estimated failed routes
    return candidate.failedRoutesCount >= 2;
  }

  return candidate.isIsolated;
}
