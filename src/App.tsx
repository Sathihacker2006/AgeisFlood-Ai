import React, { useState, useMemo, useRef, useEffect } from 'react';
import { STUDY_AREAS } from './data/mockEvents';
import { FloodEventStudyArea, ScenarioType, ImpactFormulaWeights, ResponseLocation, CandidateIsolatedArea } from './types/flood';
import { TopBar } from './components/TopBar';
import { ControlPanel } from './components/ControlPanel';
import { MapView, MapViewRef } from './components/MapView';
import { Terrain3DView } from './components/Terrain3DView';
import { InspectionDrawer } from './components/InspectionDrawer';
import { ConnectivityGraphView } from './components/ConnectivityGraphView';
import { DatasetExplorer } from './components/DatasetExplorer';
import { ModelArchitecturesView } from './components/ModelArchitecturesView';
import { ResearchGuide } from './components/ResearchGuide';
import { Terrain3DEvaluationView } from './components/Terrain3DEvaluationView';
import { HydrologicalTrendChart } from './components/HydrologicalTrendChart';
import { EmergencySitrepModal } from './components/EmergencySitrepModal';
import { SatelliteSwipeModal } from './components/SatelliteSwipeModal';
import { DroneMissionPlannerModal, DroneMissionPlan } from './components/DroneMissionPlannerModal';
import { GisExportImportModal } from './components/GisExportImportModal';
import { SarPolarimetryModal } from './components/SarPolarimetryModal';
import { EmergencyEvacuationModal } from './components/EmergencyEvacuationModal';
import { evaluateIsolationForScenario, calculateRoadImpactScore, getImpactCategory } from './utils/geoCalculations';

export default function App() {
  const [activeTab, setActiveTab] = useState<'gis' | '3d' | 'network' | 'dataset' | 'models' | 'safety' | '3d-eval'>('gis');
  const [selectedEventId, setSelectedEventId] = useState<string>(STUDY_AREAS[0].id);
  const [scenario, setScenario] = useState<ScenarioType>('scenario-1');
  const [threshold, setThreshold] = useState<number>(0.65);
  const [weights, setWeights] = useState<ImpactFormulaWeights>({
    w1_affectedLength: 0.35,
    w2_meanProbability: 0.25,
    w3_maxProbability: 0.25,
    w4_criticality: 0.15,
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [isCoordinateInspectionActive, setIsCoordinateInspectionActive] = useState(false);
  const [showHydrograph, setShowHydrograph] = useState<boolean>(true);
  const [activeTimeStepPoint, setActiveTimeStepPoint] = useState<any>(null);
  const [isSitrepModalOpen, setIsSitrepModalOpen] = useState(false);
  const [isSatelliteSwipeModalOpen, setIsSatelliteSwipeModalOpen] = useState(false);
  const [isDronePlannerModalOpen, setIsDronePlannerModalOpen] = useState(false);
  const [isGisExportModalOpen, setIsGisExportModalOpen] = useState(false);
  const [isSarPolarimetryModalOpen, setIsSarPolarimetryModalOpen] = useState(false);
  const [isEvacuationModalOpen, setIsEvacuationModalOpen] = useState(false);
  const [activeDroneMission, setActiveDroneMission] = useState<DroneMissionPlan | null>(null);
  const [activeEvacuationRoute, setActiveEvacuationRoute] = useState<{ waypoints: [number, number][]; shelterName: string } | null>(null);
  const [customImportedGeoJson, setCustomImportedGeoJson] = useState<any | null>(null);

  // Field Daylight vs. Night Ops High-Contrast Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('aegisflood_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch (_e) {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem('aegisflood_theme', theme);
    } catch (_e) {
      // ignore
    }
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  // Imperative MapView Ref
  const mapViewRef = useRef<MapViewRef>(null);

  // Current active event
  const selectedEvent = useMemo(() => {
    return STUDY_AREAS.find((e) => e.id === selectedEventId) || STUDY_AREAS[0];
  }, [selectedEventId]);

  // Active Dispatch Root Center
  const [activeDispatchCenterId, setActiveDispatchCenterId] = useState<string>(
    selectedEvent.responseCenters[0]?.id || ''
  );

  const activeDispatchCenter = useMemo(() => {
    return (
      selectedEvent.responseCenters.find((c) => c.id === activeDispatchCenterId) ||
      selectedEvent.responseCenters[0]
    );
  }, [selectedEvent, activeDispatchCenterId]);

  // Synchronize activeDispatchCenterId when switching study areas
  useEffect(() => {
    if (selectedEvent.responseCenters && selectedEvent.responseCenters.length > 0) {
      if (!selectedEvent.responseCenters.some((rc) => rc.id === activeDispatchCenterId)) {
        setActiveDispatchCenterId(selectedEvent.responseCenters[0].id);
      }
    }
  }, [selectedEvent, activeDispatchCenterId]);

  // Selected feature for Inspection Drawer
  const [inspectionState, setInspectionState] = useState<{
    type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon' | null;
    data: any;
  }>({
    type: null,
    data: null,
  });

  // Automatically trigger imperative flyTo / zoom on MapView whenever inspectionState changes
  useEffect(() => {
    if (inspectionState.type && inspectionState.data && mapViewRef.current) {
      mapViewRef.current.flyToFeature(inspectionState.type, inspectionState.data);
    }
  }, [inspectionState]);

  // Dynamically evaluate isolation and metrics for current event & scenario
  const evaluatedEvent = useMemo<FloodEventStudyArea>(() => {
    const updatedCandidates: CandidateIsolatedArea[] = selectedEvent.candidateIsolatedAreas.map((cand) => {
      const isIso = evaluateIsolationForScenario(
        cand,
        scenario,
        selectedEvent.bridges,
        selectedEvent.roads,
        threshold
      );
      return {
        ...cand,
        isIsolated: isIso,
      };
    });

    return {
      ...selectedEvent,
      candidateIsolatedAreas: updatedCandidates,
    };
  }, [selectedEvent, scenario, threshold]);

  // Analytical aggregates
  const totalFloodedAreaKm2 = useMemo(() => {
    return selectedEvent.polygons.reduce((acc, p) => acc + p.areaKm2, 0);
  }, [selectedEvent]);

  const affectedRoadLengthKm = useMemo(() => {
    return selectedEvent.roads.reduce((acc, r) => {
      const score = calculateRoadImpactScore(r, weights);
      const cat = getImpactCategory(score);
      return cat !== 'SAFE' ? acc + r.affectedLengthMeters / 1000 : acc;
    }, 0);
  }, [selectedEvent, weights]);

  const affectedBridgesCount = useMemo(() => {
    return selectedEvent.bridges.filter((b) => {
      if (scenario === 'scenario-3') return b.floodProbability > 0.5;
      return b.floodProbability >= threshold;
    }).length;
  }, [selectedEvent, scenario, threshold]);

  const isolatedCount = useMemo(() => {
    return evaluatedEvent.candidateIsolatedAreas.filter((c) => c.isIsolated).length;
  }, [evaluatedEvent]);

  const meanConfidencePercent = useMemo(() => {
    const sum = selectedEvent.polygons.reduce((acc, p) => acc + p.meanFloodProbability, 0);
    return selectedEvent.polygons.length > 0 ? (sum / selectedEvent.polygons.length) * 100 : 92.4;
  }, [selectedEvent]);

  // Feature selection handler
  const handleSelectFeature = (
    type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon',
    data: any
  ) => {
    setInspectionState({ type, data });
  };

  // Re-run simulation
  const handleRefreshAnalysis = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* 3-Zone Top Bar with Theme Toggle */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedEvent={selectedEvent}
        onEventChange={(id) => {
          setSelectedEventId(id);
          const found = STUDY_AREAS.find((e) => e.id === id);
          if (found && found.responseCenters.length > 0) {
            setActiveDispatchCenterId(found.responseCenters[0].id);
          }
          setInspectionState({ type: null, data: null });
        }}
        events={STUDY_AREAS}
        onRefreshAnalysis={handleRefreshAnalysis}
        isSimulating={isSimulating}
        onOpenSitrep={() => setIsSitrepModalOpen(true)}
        onOpenSatelliteSwipe={() => setIsSatelliteSwipeModalOpen(true)}
        onOpenDronePlanner={() => setIsDronePlannerModalOpen(true)}
        onOpenGisExport={() => setIsGisExportModalOpen(true)}
        onOpenSarPolarimetry={() => setIsSarPolarimetryModalOpen(true)}
        onOpenEvacuationPlanner={() => setIsEvacuationModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 2D GIS OPERATIONS COMMAND CENTER */}
        {activeTab === 'gis' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Control & KPI Panel */}
            <ControlPanel
              event={selectedEvent}
              scenario={scenario}
              setScenario={setScenario}
              threshold={threshold}
              setThreshold={setThreshold}
              weights={weights}
              setWeights={setWeights}
              activeDispatchCenter={activeDispatchCenter}
              setActiveDispatchCenter={(c: ResponseLocation) => setActiveDispatchCenterId(c.id)}
              totalFloodedAreaKm2={activeTimeStepPoint ? activeTimeStepPoint.floodedAreaKm2 : totalFloodedAreaKm2}
              affectedRoadLengthKm={affectedRoadLengthKm}
              affectedBridgesCount={affectedBridgesCount}
              isolatedCount={isolatedCount}
              meanConfidencePercent={meanConfidencePercent}
              isCoordinateInspectionActive={isCoordinateInspectionActive}
              setIsCoordinateInspectionActive={setIsCoordinateInspectionActive}
              showHydrograph={showHydrograph}
              setShowHydrograph={setShowHydrograph}
              theme={theme}
            />

            {/* 2D Map Canvas, Historical Trend Line Chart and Inspection Drawer */}
            <div className="flex-1 flex flex-row overflow-hidden relative">
              <MapView
                ref={mapViewRef}
                event={evaluatedEvent}
                scenario={scenario}
                threshold={threshold}
                weights={weights}
                activeDispatchCenter={activeDispatchCenter}
                onSelectFeature={handleSelectFeature}
                selectedFeatureId={inspectionState.data?.id}
                selectedFeatureData={inspectionState.data}
                isCoordinateInspectionActive={isCoordinateInspectionActive}
                setIsCoordinateInspectionActive={setIsCoordinateInspectionActive}
                theme={theme}
                activeDroneMission={activeDroneMission}
                onClearDroneMission={() => setActiveDroneMission(null)}
                customImportedGeoJson={customImportedGeoJson}
                onClearCustomGeoJson={() => setCustomImportedGeoJson(null)}
                activeTimeStepPoint={activeTimeStepPoint}
                activeEvacuationRoute={activeEvacuationRoute}
                onClearEvacuationRoute={() => setActiveEvacuationRoute(null)}
              />

              {/* Historical Trend Line Chart (Recharts) Progression Dock */}
              {showHydrograph && (
                <div
                  className={`absolute bottom-4 left-4 z-20 pointer-events-auto transition-all duration-300 max-w-3xl ${
                    inspectionState.type ? 'right-4 md:right-[436px]' : 'right-4 md:right-16'
                  }`}
                >
                  <HydrologicalTrendChart
                    event={selectedEvent}
                    onActiveTimeStepChange={(point) => setActiveTimeStepPoint(point)}
                    theme={theme}
                  />
                </div>
              )}

              {inspectionState.type && (
                <InspectionDrawer
                  key={inspectionState.data?.id || inspectionState.data?.osmId || `${inspectionState.type}-${Date.now()}`}
                  selectedType={inspectionState.type}
                  selectedData={inspectionState.data}
                  onClose={() => setInspectionState({ type: null, data: null })}
                  event={selectedEvent}
                  onSelectFeature={handleSelectFeature}
                  isCoordinateInspectionActive={isCoordinateInspectionActive}
                  setIsCoordinateInspectionActive={setIsCoordinateInspectionActive}
                  theme={theme}
                />
              )}
            </div>
          </div>
        )}

        {/* DEDICATED 3D DIGITAL TWIN & TERRAIN INUNDATION PAGE */}
        {activeTab === '3d' && (
          <div className="flex-1 flex flex-row overflow-hidden relative w-full h-full">
            <Terrain3DView
              event={evaluatedEvent}
              scenario={scenario}
              threshold={threshold}
              weights={weights}
              activeDispatchCenter={activeDispatchCenter}
              onSelectFeature={handleSelectFeature}
              selectedFeatureId={inspectionState.data?.id}
            />

            {inspectionState.type && (
              <InspectionDrawer
                key={inspectionState.data?.id || inspectionState.data?.osmId || `${inspectionState.type}-${Date.now()}`}
                selectedType={inspectionState.type}
                selectedData={inspectionState.data}
                onClose={() => setInspectionState({ type: null, data: null })}
                event={selectedEvent}
                onSelectFeature={handleSelectFeature}
                isCoordinateInspectionActive={isCoordinateInspectionActive}
                setIsCoordinateInspectionActive={setIsCoordinateInspectionActive}
              />
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <ConnectivityGraphView
            event={evaluatedEvent}
            scenario={scenario}
            activeDispatchCenter={activeDispatchCenter}
          />
        )}

        {activeTab === 'dataset' && <DatasetExplorer />}

        {activeTab === 'models' && <ModelArchitecturesView />}

        {activeTab === 'safety' && <ResearchGuide />}

        {activeTab === '3d-eval' && <Terrain3DEvaluationView />}
      </main>

      {/* Emergency Incident SITREP Briefing Modal */}
      <EmergencySitrepModal
        isOpen={isSitrepModalOpen}
        onClose={() => setIsSitrepModalOpen(false)}
        event={selectedEvent}
        scenario={scenario}
        totalFloodedAreaKm2={activeTimeStepPoint ? activeTimeStepPoint.floodedAreaKm2 : totalFloodedAreaKm2}
        affectedRoadLengthKm={affectedRoadLengthKm}
        affectedBridgesCount={affectedBridgesCount}
        isolatedCount={isolatedCount}
        currentTimeStep={activeTimeStepPoint?.timestamp}
        currentStageMeters={activeTimeStepPoint?.stageMeters}
      />

      {/* Satellite Multi-Sensor Optical & SAR Swipe Comparator Modal */}
      <SatelliteSwipeModal
        isOpen={isSatelliteSwipeModalOpen}
        onClose={() => setIsSatelliteSwipeModalOpen(false)}
        event={selectedEvent}
      />

      {/* Autonomous UAV Drone Recon Mission Planner Modal */}
      <DroneMissionPlannerModal
        isOpen={isDronePlannerModalOpen}
        onClose={() => setIsDronePlannerModalOpen(false)}
        event={selectedEvent}
        activeDispatchCenter={activeDispatchCenter}
        theme={theme}
        onDeployMissionToMap={(mission) => {
          setActiveDroneMission(mission);
          setIsDronePlannerModalOpen(false);
          setActiveTab('gis');
        }}
      />

      {/* GIS Interoperability Suite (Export GeoJSON / KML & Ingestion) Modal */}
      <GisExportImportModal
        isOpen={isGisExportModalOpen}
        onClose={() => setIsGisExportModalOpen(false)}
        event={selectedEvent}
        theme={theme}
        onImportCustomGeoJSON={(geoJson) => {
          setCustomImportedGeoJson(geoJson);
          setIsGisExportModalOpen(false);
          setActiveTab('gis');
        }}
      />

      {/* Sentinel-1 SAR Polarimetric Physics Analyzer Modal */}
      <SarPolarimetryModal
        isOpen={isSarPolarimetryModalOpen}
        onClose={() => setIsSarPolarimetryModalOpen(false)}
        event={selectedEvent}
        theme={theme}
      />

      {/* Emergency Evacuation Corridor & Shelter Allocation Planner Modal */}
      <EmergencyEvacuationModal
        isOpen={isEvacuationModalOpen}
        onClose={() => setIsEvacuationModalOpen(false)}
        event={selectedEvent}
        theme={theme}
        onDeployEvacRouteToMap={(waypoints, shelterName) => {
          setActiveEvacuationRoute({ waypoints, shelterName });
          setIsEvacuationModalOpen(false);
          setActiveTab('gis');
        }}
      />
    </div>
  );
}
