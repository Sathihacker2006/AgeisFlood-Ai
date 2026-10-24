import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import L from 'leaflet';
import {
  FloodEventStudyArea,
  RoadSegment,
  BridgeNode,
  ResponseLocation,
  CandidateIsolatedArea,
  FloodPolygon,
  ScenarioType,
  ImpactFormulaWeights,
} from '../types/flood';
import {
  Layers,
  Compass,
  ShieldAlert,
  Target,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Split,
  Navigation,
  Crosshair,
  Copy,
  Check,
  X,
  Camera,
  Globe,
  CloudRain,
  Wind,
  Droplets,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  RefreshCw,
  Gauge,
  Zap,
  Flame,
  Radio,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import {
  calculateRoadImpactScore,
  getImpactCategory,
  isPointInPolygon,
  haversineDistanceMeters,
} from '../utils/geoCalculations';
import { DroneMissionPlan } from './DroneMissionPlannerModal';
import {
  fetchRainViewerRadar,
  fetchLiveStudyAreaAtmosphere,
  buildRainViewerTileUrl,
  generateStudyAreaPrecipitationHeatmap,
  getStudyAreaRainGauges,
  RainViewerData,
  RadarFrame,
  LiveAtmosphericTelemetry,
  RainGaugeStation,
  PrecipitationHeatmapBand,
} from '../utils/weatherService';

export interface MapViewRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setView: (lat: number, lng: number, zoom?: number) => void;
  flyToBounds: (bounds: [number, number][], padding?: [number, number], maxZoom?: number) => void;
  flyToFeature: (
    type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon',
    data: any
  ) => void;
}

// Custom Leaflet Control for Live Coordinate and Flood Probability Telemetry
const TelemetryLeafletControlClass = (L.Control as any).extend({
  options: {
    position: 'bottomright',
  },
  onAdd: function (_map: L.Map) {
    const container = L.DomUtil.create('div', 'leaflet-custom-telemetry-hud');
    container.style.pointerEvents = 'auto';
    container.style.marginBottom = '6px';
    container.style.marginRight = '8px';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    this._container = container;
    this.updateContent(null);
    return container;
  },
  onRemove: function (_map: L.Map) {
    this._container = null;
  },
  updateContent: function (data: {
    lat: number;
    lng: number;
    floodProbability: number;
    classification: string;
    nearestFeature?: { name: string; type: string; distanceMeters: number };
    estimatedElevationMeters: number;
    isPinned: boolean;
  } | null) {
    if (!this._container) return;
    if (!data) {
      this._container.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(6, 182, 212, 0.5); border-radius: 8px; padding: 8px 12px; color: #cbd5e1; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 11px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); min-width: 250px;">
          <div style="display: flex; align-items: center; gap: 6px; color: #22d3ee; font-weight: bold; text-transform: uppercase; font-size: 10px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #22d3ee; display: inline-block;"></span>
            Leaflet Telemetry Probe Active
          </div>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Move cursor over map to inspect coordinates & flood probability</div>
        </div>
      `;
      return;
    }

    const pct = (data.floodProbability * 100).toFixed(1);
    const riskColor = data.floodProbability > 0.65 ? '#f43f5e' : data.floodProbability > 0.30 ? '#f59e0b' : '#10b981';
    const statusText = data.isPinned ? 'PINNED PROBE' : 'LIVE SCAN';
    const statusBg = data.isPinned ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.25)';
    const statusBorder = data.isPinned ? '#f59e0b' : '#06b6d4';

    this._container.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.96); backdrop-filter: blur(12px); border: 1px solid rgba(6, 182, 212, 0.5); border-radius: 10px; padding: 10px 13px; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; font-size: 11px; min-width: 260px; max-width: 300px; box-shadow: 0 12px 30px rgba(0,0,0,0.6);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(51, 65, 85, 0.7); padding-bottom: 5px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${riskColor}; box-shadow: 0 0 8px ${riskColor}; display: inline-block;"></span>
            <span style="font-weight: 700; color: #38bdf8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Leaflet Inspector Control</span>
          </div>
          <span style="background: ${statusBg}; border: 1px solid ${statusBorder}; color: ${statusBorder}; font-family: ui-monospace, monospace; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px;">
            ${statusText}
          </span>
        </div>
        
        <div style="margin-bottom: 5px;">
          <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">WGS84 Coordinates</div>
          <div style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #e2e8f0; margin-top: 1px;">
            ${data.lat.toFixed(5)}° N, ${Math.abs(data.lng).toFixed(5)}° W
            <span style="font-size: 10px; color: #64748b; font-weight: normal; margin-left: 4px;">(~${data.estimatedElevationMeters}m MSL)</span>
          </div>
        </div>

        <div style="background: rgba(2, 6, 23, 0.7); border: 1px solid rgba(51, 65, 85, 0.8); border-radius: 6px; padding: 6px 8px; margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #94a3b8; font-size: 10px;">Est. Flood Prob P(Flood):</span>
            <span style="font-family: ui-monospace, monospace; font-weight: 800; font-size: 13px; color: ${riskColor};">${pct}%</span>
          </div>
          <div style="width: 100%; height: 5px; background: #1e293b; border-radius: 999px; overflow: hidden; margin-bottom: 4px;">
            <div style="width: ${Math.max(4, Math.min(100, Number(pct)))}%; height: 100%; background: ${riskColor}; border-radius: 999px;"></div>
          </div>
          <div style="font-size: 10px; font-weight: 600; color: ${riskColor}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${data.classification}
          </div>
        </div>

        ${data.nearestFeature ? `
          <div style="font-size: 10px; color: #cbd5e1; display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #64748b;">Nearest:</span>
            <span style="font-weight: 500; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
              ${data.nearestFeature.name} <span style="font-family: ui-monospace, monospace; color: #38bdf8;">(${data.nearestFeature.distanceMeters}m)</span>
            </span>
          </div>
        ` : ''}

        <div style="font-size: 9px; color: #64748b; font-style: italic; margin-top: 4px; text-align: center; border-top: 1px solid rgba(51, 65, 85, 0.4); padding-top: 3px;">
          ${data.isPinned ? 'Click elsewhere to move pin · Esc to dismiss' : 'Move cursor to scan · Click map to pin'}
        </div>
      </div>
    `;
  },
});

interface MapViewProps {
  event: FloodEventStudyArea;
  scenario: ScenarioType;
  threshold: number;
  weights: ImpactFormulaWeights;
  activeDispatchCenter: ResponseLocation;
  onSelectFeature: (
    type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon' | 'gauge',
    data: any
  ) => void;
  selectedFeatureId?: string;
  selectedFeatureData?: any;
  isCoordinateInspectionActive?: boolean;
  setIsCoordinateInspectionActive?: (active: boolean) => void;
  theme?: 'dark' | 'light';
  activeDroneMission?: DroneMissionPlan | null;
  onClearDroneMission?: () => void;
  customImportedGeoJson?: any | null;
  onClearCustomGeoJson?: () => void;
  activeTimeStepPoint?: any | null;
  activeEvacuationRoute?: { waypoints: [number, number][]; shelterName: string } | null;
  onClearEvacuationRoute?: () => void;
}

export const MapView = forwardRef<MapViewRef, MapViewProps>(function MapView(
  {
    event,
    scenario,
    threshold,
    weights,
    activeDispatchCenter,
    onSelectFeature,
    selectedFeatureId,
    selectedFeatureData,
    isCoordinateInspectionActive: propIsInspectionActive,
    setIsCoordinateInspectionActive: propSetIsInspectionActive,
    theme = 'dark',
    activeDroneMission,
    onClearDroneMission,
    customImportedGeoJson,
    onClearCustomGeoJson,
    activeTimeStepPoint,
    activeEvacuationRoute,
    onClearEvacuationRoute,
  },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const leafletTelemetryControlRef = useRef<any>(null);
  const isLight = theme === 'light';
  const layerGroupsRef = useRef<{
    polygons: L.LayerGroup;
    roads: L.LayerGroup;
    bridges: L.LayerGroup;
    responseCenters: L.LayerGroup;
    isolatedAreas: L.LayerGroup;
    routes: L.LayerGroup;
    focusRing: L.LayerGroup;
    probe: L.LayerGroup;
    droneFlight: L.LayerGroup;
    customGeoJson: L.LayerGroup;
    weatherHeatmap: L.LayerGroup;
    weatherGauges: L.LayerGroup;
    evacuationRoute: L.LayerGroup;
  } | null>(null);

  // Layer visibility toggles
  const [showPolygons, setShowPolygons] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showBridges, setShowBridges] = useState(true);
  const [showResponseCenters, setShowResponseCenters] = useState(true);
  const [showIsolatedAreas, setShowIsolatedAreas] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showSAROverlay, setShowSAROverlay] = useState(false);
  const [sarOpacity, setSarOpacity] = useState(0.7);

  // Real-Time Precipitation Doppler Radar & Live Weather Heatmap State
  const [showWeatherLayer, setShowWeatherLayer] = useState(false);
  const [weatherSubLayerRadar, setWeatherSubLayerRadar] = useState(true);
  const [weatherSubLayerHeatmap, setWeatherSubLayerHeatmap] = useState(true);
  const [weatherSubLayerGauges, setWeatherSubLayerGauges] = useState(true);
  const [weatherSimulationMode, setWeatherSimulationMode] = useState<'live' | 'peak' | 'forecast'>('live');
  const [weatherOpacity, setWeatherOpacity] = useState(0.75);
  const [weatherColorScheme, setWeatherColorScheme] = useState<number>(2); // 2: Universal Doppler, 6: Rainbow, 4: Weather Channel
  const [radarData, setRadarData] = useState<RainViewerData | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);
  const [liveWeather, setLiveWeather] = useState<LiveAtmosphericTelemetry | null>(null);
  const [isLoadingRadar, setIsLoadingRadar] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const weatherTileLayerRef = useRef<L.TileLayer | null>(null);
  const [isWeatherHudCollapsed, setIsWeatherHudCollapsed] = useState(false);

  // Quick-Jump Drawer open state and active tab
  const [showQuickJumpList, setShowQuickJumpList] = useState(false);
  const [quickJumpTab, setQuickJumpTab] = useState<'isolated' | 'bridges' | 'roads'>('isolated');

  // Track last centered feature ID to avoid duplicate pan triggers
  const lastCenteredFeatureIdRef = useRef<string | null>(null);

  // Coordinate Inspection Tool State (Controlled by parent or internal)
  const [internalInspectionActive, setInternalInspectionActive] = useState(false);
  const isCoordinateInspectionActive =
    propIsInspectionActive !== undefined ? propIsInspectionActive : internalInspectionActive;

  const toggleInspection = (val?: boolean) => {
    const nextVal = val !== undefined ? val : !isCoordinateInspectionActive;
    if (propSetIsInspectionActive) {
      propSetIsInspectionActive(nextVal);
    } else {
      setInternalInspectionActive(nextVal);
    }
  };

  const [probeData, setProbeData] = useState<{
    lat: number;
    lng: number;
    floodProbability: number;
    classification: string;
    nearestFeature?: {
      name: string;
      type: string;
      distanceMeters: number;
    };
    estimatedElevationMeters: number;
    isPinned: boolean;
  } | null>(null);
  const [hasCopiedCoord, setHasCopiedCoord] = useState(false);

  // PNG Map View Snapshot Export State
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Basemap Provider State (100% Free, Keyless, and Watermark-Free)
  const [activeBasemap, setActiveBasemap] = useState<'carto-dark' | 'osm' | 'esri-topo' | 'carto-light'>(
    theme === 'light' ? 'carto-light' : 'carto-dark'
  );
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Automatically switch basemap to daylight-optimized cartography in light mode
  useEffect(() => {
    if (theme === 'light') {
      setActiveBasemap((current) => (current === 'carto-dark' ? 'carto-light' : current));
    } else {
      setActiveBasemap((current) => (current === 'carto-light' ? 'carto-dark' : current));
    }
  }, [theme]);

  // Trigger high-resolution PNG screenshot of the Leaflet map view
  const handleExportMapPNG = async () => {
    if (!mapContainerRef.current) return;
    setIsExportingPNG(true);
    setExportNotice('Capturing Leaflet high-res map frame...');

    try {
      const dataUrl = await toPng(mapContainerRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        filter: (node) => {
          if (node?.classList && typeof node.classList.contains === 'function') {
            if (node.classList.contains('leaflet-control-zoom')) return false;
          }
          return true;
        },
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${event.id}_emergency_report_map_${timestamp}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice(`Exported PNG: ${filename}`);
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('Leaflet image export failed:', err);
      setExportNotice('Failed to generate PNG screenshot');
      setTimeout(() => setExportNotice(null), 3000);
    } finally {
      setIsExportingPNG(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [event.center.lat, event.center.lng],
        zoom: event.defaultZoom,
        zoomControl: false,
        attributionControl: false, // removes any watermark / attribution badge
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Initial Keyless Basemap Layer
      const initialTileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
      baseTileLayerRef.current = initialTileLayer;

      const polygonsGroup = L.layerGroup().addTo(map);
      const roadsGroup = L.layerGroup().addTo(map);
      const bridgesGroup = L.layerGroup().addTo(map);
      const responseCentersGroup = L.layerGroup().addTo(map);
      const isolatedAreasGroup = L.layerGroup().addTo(map);
      const routesGroup = L.layerGroup().addTo(map);
      const focusRingGroup = L.layerGroup().addTo(map);
      const probeGroup = L.layerGroup().addTo(map);
      const droneFlightGroup = L.layerGroup().addTo(map);
      const customGeoJsonGroup = L.layerGroup().addTo(map);
      const weatherHeatmapGroup = L.layerGroup().addTo(map);
      const weatherGaugesGroup = L.layerGroup().addTo(map);
      const evacuationRouteGroup = L.layerGroup().addTo(map);

      layerGroupsRef.current = {
        polygons: polygonsGroup,
        roads: roadsGroup,
        bridges: bridgesGroup,
        responseCenters: responseCentersGroup,
        isolatedAreas: isolatedAreasGroup,
        routes: routesGroup,
        focusRing: focusRingGroup,
        probe: probeGroup,
        droneFlight: droneFlightGroup,
        customGeoJson: customGeoJsonGroup,
        weatherHeatmap: weatherHeatmapGroup,
        weatherGauges: weatherGaugesGroup,
        evacuationRoute: evacuationRouteGroup,
      };

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(
        [event.center.lat, event.center.lng],
        event.defaultZoom
      );
    }
  }, [event.id]);

  // Dynamically update basemap tile layer (all keyless and watermark-free)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let options: L.TileLayerOptions = { attribution: '', subdomains: 'abcd', maxZoom: 19 };

    if (activeBasemap === 'osm') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = { attribution: '', maxZoom: 19 };
    } else if (activeBasemap === 'esri-topo') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      options = { attribution: '', maxZoom: 19 };
    } else if (activeBasemap === 'carto-light') {
      url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      options = { attribution: '', subdomains: 'abcd', maxZoom: 19 };
    }

    const tileLayer = L.tileLayer(url, options);
    tileLayer.addTo(map);
    tileLayer.bringToBack();
    baseTileLayerRef.current = tileLayer;
  }, [activeBasemap]);

  // Helper to spawn a visual pulse ring at target
  const spawnFocusRing = (lat: number, lng: number, color: string = '#38bdf8') => {
    const focusGroup = layerGroupsRef.current?.focusRing;
    if (!focusGroup) return;
    const ring = L.circleMarker([lat, lng], {
      radius: 18,
      color: color,
      weight: 3,
      fillColor: color,
      fillOpacity: 0.25,
      className: 'animate-ping',
    });
    focusGroup.addLayer(ring);

    // Fade out after 3.5 seconds
    setTimeout(() => {
      if (focusGroup.hasLayer(ring)) {
        focusGroup.removeLayer(ring);
      }
    }, 3500);
  };

  // Render Active UAV Drone Recon Mission Flight Corridor and Waypoints
  useEffect(() => {
    const flightGroup = layerGroupsRef.current?.droneFlight;
    const map = mapInstanceRef.current;
    if (!flightGroup || !map) return;

    flightGroup.clearLayers();

    if (!activeDroneMission || activeDroneMission.waypoints.length === 0) return;

    const latLngs: [number, number][] = activeDroneMission.waypoints.map((w) => [w.lat, w.lng]);

    // Dashed glowing flight corridor polyline
    const polyline = L.polyline(latLngs, {
      color: '#06b6d4',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '8, 8',
    });
    polyline.bindTooltip(
      `<b>${activeDroneMission.id}</b>: Aerial Corridor (${activeDroneMission.totalDistanceKm} km RT)`,
      { sticky: true, direction: 'top' }
    );
    polyline.addTo(flightGroup);

    // Waypoint markers
    activeDroneMission.waypoints.forEach((wp, idx) => {
      const isStart = idx === 0;
      const isTarget = idx === 3 || idx === activeDroneMission.waypoints.length - 2;
      const markerColor = isStart ? '#10b981' : isTarget ? '#f43f5e' : '#06b6d4';

      const circle = L.circleMarker([wp.lat, wp.lng], {
        radius: isTarget ? 10 : 7,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95,
      });

      circle.bindTooltip(`<b>${wp.name}</b><br/>Alt: ${wp.altMeters}m AGL<br/>${wp.action}`, {
        direction: 'top',
        offset: [0, -5],
      });
      circle.addTo(flightGroup);
    });

    // Fit map bounds to show full flight corridor
    map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 14 });
  }, [activeDroneMission]);

  // Render Custom Ingested GeoJSON Layer
  useEffect(() => {
    const customGroup = layerGroupsRef.current?.customGeoJson;
    const map = mapInstanceRef.current;
    if (!customGroup || !map) return;

    customGroup.clearLayers();

    if (!customImportedGeoJson) return;

    try {
      const geoLayer = L.geoJSON(customImportedGeoJson, {
        style: () => ({
          color: '#a855f7',
          weight: 2.5,
          opacity: 0.9,
          fillColor: '#c084fc',
          fillOpacity: 0.35,
          dashArray: '5, 5',
        }),
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          let html = `<div style="font-family: sans-serif; font-size: 11px;"><b>Custom Imported Feature</b>`;
          for (const [k, v] of Object.entries(props)) {
            html += `<br/><b>${k}:</b> ${v}`;
          }
          html += `</div>`;
          layer.bindPopup(html);
        },
      });

      geoLayer.addTo(customGroup);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (_e) {
      // ignore
    }
  }, [customImportedGeoJson]);

  // Fetch Live RainViewer Doppler Radar and Study Area Atmospheric Telemetry
  const loadWeatherData = useCallback(async () => {
    setIsLoadingRadar(true);
    setRadarError(null);
    try {
      const [radarRes, weatherRes] = await Promise.all([
        fetchRainViewerRadar(),
        fetchLiveStudyAreaAtmosphere(event.center.lat, event.center.lng),
      ]);
      setRadarData(radarRes);
      // Default to the latest available radar scan
      if (radarRes.frames.length > 0) {
        setActiveFrameIndex(radarRes.frames.length - 1);
      }
      setLiveWeather(weatherRes);
    } catch (err: any) {
      console.warn('Weather radar fetch issue:', err);
      setRadarError(err?.message || 'Failed to load live radar');
    } finally {
      setIsLoadingRadar(false);
    }
  }, [event.center.lat, event.center.lng]);

  // Load weather when layer is enabled or study area changes
  useEffect(() => {
    if (showWeatherLayer) {
      loadWeatherData();
    } else {
      setIsRadarPlaying(false);
    }
  }, [showWeatherLayer, loadWeatherData]);

  // Update Live Radar Tile Layer on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up existing radar tile layer
    if (weatherTileLayerRef.current) {
      if (map.hasLayer(weatherTileLayerRef.current)) {
        map.removeLayer(weatherTileLayerRef.current);
      }
      weatherTileLayerRef.current = null;
    }

    if (!showWeatherLayer || !weatherSubLayerRadar || !radarData || radarData.frames.length === 0) {
      return;
    }

    const currentFrame = radarData.frames[activeFrameIndex] || radarData.latestFrame;
    if (!currentFrame) return;

    const tileUrl = buildRainViewerTileUrl(
      radarData.host,
      currentFrame.path,
      weatherColorScheme,
      true,
      true
    );

    const radarTileLayer = L.tileLayer(tileUrl, {
      opacity: weatherOpacity,
      zIndex: 14,
      maxZoom: 18,
      attribution: '',
    });

    radarTileLayer.addTo(map);
    weatherTileLayerRef.current = radarTileLayer;
  }, [
    showWeatherLayer,
    weatherSubLayerRadar,
    radarData,
    activeFrameIndex,
    weatherColorScheme,
    weatherOpacity,
  ]);

  // Render Basin Precipitation Inundation Heatmap Circles & Convective Bands
  useEffect(() => {
    const heatmapGroup = layerGroupsRef.current?.weatherHeatmap;
    if (!heatmapGroup) return;

    heatmapGroup.clearLayers();

    if (!showWeatherLayer || !weatherSubLayerHeatmap) {
      return;
    }

    const liveRate = liveWeather?.precipitationMmPerHour || 0;
    const bands = generateStudyAreaPrecipitationHeatmap(event, liveRate, weatherSimulationMode);

    bands.forEach((band) => {
      const circle = L.circle([band.centerLat, band.centerLng], {
        radius: band.radiusMeters,
        color: band.color,
        weight: 1.5,
        opacity: Math.min(1.0, 0.75 * weatherOpacity),
        fillColor: band.color,
        fillOpacity: Math.min(0.7, 0.24 * weatherOpacity),
      });

      const tooltipContent = `
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <div style="font-weight: 700; color: ${band.color};">${band.label}</div>
          <div style="font-family: monospace; color: #94a3b8; font-size: 10px; margin-top: 2px;">
            Rate: <b>${band.intensityMmPerHour} mm/h</b> · Reflectivity: <b>${band.reflectivityDbz} dBZ</b>
          </div>
        </div>
      `;
      circle.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
      });

      circle.addTo(heatmapGroup);
    });
  }, [
    showWeatherLayer,
    weatherSubLayerHeatmap,
    weatherSimulationMode,
    weatherOpacity,
    liveWeather,
    event,
  ]);

  // Render Virtual Hydro-Meteorological Rain Gauge Stations
  useEffect(() => {
    const gaugesGroup = layerGroupsRef.current?.weatherGauges;
    const map = mapInstanceRef.current;
    if (!gaugesGroup || !map) return;

    gaugesGroup.clearLayers();

    if (!showWeatherLayer || !weatherSubLayerGauges) {
      return;
    }

    const liveRate = liveWeather?.precipitationMmPerHour || 0;
    const gauges = getStudyAreaRainGauges(event, liveRate, weatherSimulationMode === 'peak' ? 'peak' : 'live');

    gauges.forEach((gauge) => {
      const isEmergency = gauge.stageStatus === 'Flash Flood Emergency';
      const isWarning = gauge.stageStatus === 'Warning';
      const badgeBg = isEmergency ? '#e11d48' : isWarning ? '#f59e0b' : '#0284c7';

      const iconHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
          <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid ${badgeBg}; border-radius: 6px; padding: 2px 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${badgeBg}; ${isEmergency ? 'box-shadow: 0 0 8px #f43f5e;' : ''}"></span>
            <span style="font-family: monospace; font-size: 10px; font-weight: 700; color: #f8fafc;">${gauge.code}</span>
            <span style="font-family: monospace; font-size: 9px; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 1px 3px; border-radius: 3px;">${gauge.currentRateMmPerHour} mm/h</span>
          </div>
          <div style="width: 2px; height: 6px; background: ${badgeBg};"></div>
        </div>
      `;

      const gaugeIcon = L.divIcon({
        html: iconHtml,
        className: 'gauge-marker-pin',
        iconSize: [0, 0],
      });

      const marker = L.marker([gauge.position.lat, gauge.position.lng], { icon: gaugeIcon });
      marker.on('click', () => {
        onSelectFeature('gauge', gauge);
        map.flyTo([gauge.position.lat, gauge.position.lng], 15, { duration: 0.8 });
        spawnFocusRing(gauge.position.lat, gauge.position.lng, badgeBg);
      });

      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <b>${gauge.name}</b><br/>
          Drainage: ${gauge.streamName}<br/>
          Current Rate: <b>${gauge.currentRateMmPerHour} mm/h</b><br/>
          24h Total: <b>${gauge.accumulation24hMm} mm</b><br/>
          Status: <b style="color: ${badgeBg}">${gauge.stageStatus}</b><br/>
          <i style="font-size: 9px; color: #94a3b8;">Click station to open telemetry hydrograph</i>
        </div>`,
        { direction: 'top', offset: [0, -10] }
      );

      marker.addTo(gaugesGroup);
    });
  }, [
    showWeatherLayer,
    weatherSubLayerGauges,
    weatherSimulationMode,
    liveWeather,
    event,
    onSelectFeature,
  ]);

  // Render Emergency Evacuation Corridor & Shelter Waypoints
  useEffect(() => {
    const evacGroup = layerGroupsRef.current?.evacuationRoute;
    const map = mapInstanceRef.current;
    if (!evacGroup || !map) return;

    evacGroup.clearLayers();

    if (!activeEvacuationRoute || activeEvacuationRoute.waypoints.length === 0) {
      return;
    }

    const waypoints = activeEvacuationRoute.waypoints;
    const polyline = L.polyline(waypoints, {
      color: '#f59e0b',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.95,
    });
    polyline.bindTooltip(
      `<b>Active Evacuation Route to ${activeEvacuationRoute.shelterName}</b>`,
      { sticky: true }
    );
    polyline.addTo(evacGroup);

    // Destination shelter marker
    const dest = waypoints[waypoints.length - 1];
    const shelterIcon = L.divIcon({
      html: `
        <div style="background: #f59e0b; color: #020617; border: 2px solid white; border-radius: 8px; padding: 3px 6px; font-weight: bold; font-size: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; transform: translate(-50%, -50%);">
          <span>🏠 SHELTER REFUGE</span>
        </div>
      `,
      className: 'shelter-dest-marker',
      iconSize: [0, 0],
    });
    const shelterMarker = L.marker(dest, { icon: shelterIcon });
    shelterMarker.addTo(evacGroup);

    map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
  }, [activeEvacuationRoute]);

  // Animate through radar frames loop when isRadarPlaying is true
  useEffect(() => {
    if (!isRadarPlaying || !radarData || radarData.frames.length <= 1) return;

    const timer = setInterval(() => {
      setActiveFrameIndex((prevIndex) => {
        const next = prevIndex + 1;
        return next >= radarData.frames.length ? 0 : next;
      });
    }, 750);

    return () => clearInterval(timer);
  }, [isRadarPlaying, radarData]);

  // Expose Imperative API to Parent Component via useImperativeHandle
  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat: number, lng: number, zoom: number = 15) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.1, easeLinearity: 0.25 });
          spawnFocusRing(lat, lng, '#38bdf8');
        }
      },
      setView: (lat: number, lng: number, zoom: number = 15) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], zoom);
          spawnFocusRing(lat, lng, '#38bdf8');
        }
      },
      flyToBounds: (boundsCoords: [number, number][], padding: [number, number] = [60, 60], maxZoom: number = 16) => {
        if (mapInstanceRef.current && boundsCoords.length > 0) {
          const bounds = L.latLngBounds(boundsCoords.map(([lat, lng]) => L.latLng(lat, lng)));
          mapInstanceRef.current.flyToBounds(bounds, { maxZoom, padding, duration: 1.1, easeLinearity: 0.25 });
          const midPoint = boundsCoords[Math.floor(boundsCoords.length / 2)];
          if (midPoint) spawnFocusRing(midPoint[0], midPoint[1], '#38bdf8');
        }
      },
      flyToFeature: (
        type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon',
        data: any
      ) => {
        if (!mapInstanceRef.current || !data) return;
        const map = mapInstanceRef.current;

        if (type === 'isolated' && data.position) {
          map.flyTo([data.position.lat, data.position.lng], 15, {
            duration: 1.1,
            easeLinearity: 0.25,
          });
          spawnFocusRing(data.position.lat, data.position.lng, '#f43f5e');
        } else if (type === 'bridge' && data.position) {
          map.flyTo([data.position.lat, data.position.lng], 16, {
            duration: 1.1,
            easeLinearity: 0.25,
          });
          spawnFocusRing(data.position.lat, data.position.lng, '#06b6d4');
        } else if (type === 'response' && data.position) {
          map.flyTo([data.position.lat, data.position.lng], 15, {
            duration: 1.1,
            easeLinearity: 0.25,
          });
          spawnFocusRing(data.position.lat, data.position.lng, '#3b82f6');
        } else if (type === 'road' && data.geometry && data.geometry.length > 0) {
          const bounds = L.latLngBounds(data.geometry.map(([lat, lng]: [number, number]) => L.latLng(lat, lng)));
          map.flyToBounds(bounds, {
            maxZoom: 16,
            padding: [60, 60],
            duration: 1.1,
            easeLinearity: 0.25,
          });
          const midPoint = data.geometry[Math.floor(data.geometry.length / 2)];
          if (midPoint) spawnFocusRing(midPoint[0], midPoint[1], '#f59e0b');
        } else if (type === 'polygon' && data.geometry?.coordinates?.length > 0) {
          const bounds = L.latLngBounds(data.geometry.coordinates.map(([lat, lng]: [number, number]) => L.latLng(lat, lng)));
          map.flyToBounds(bounds, {
            maxZoom: 15,
            padding: [50, 50],
            duration: 1.1,
            easeLinearity: 0.25,
          });
          const midPoint = data.geometry.coordinates[0];
          if (midPoint) spawnFocusRing(midPoint[0], midPoint[1], '#0284c7');
        } else if (data.position) {
          map.flyTo([data.position.lat, data.position.lng], 15, { duration: 1.1 });
          spawnFocusRing(data.position.lat, data.position.lng, '#38bdf8');
        }
      },
    }),
    []
  );

  // Reusable function to center and highlight a selected feature on the map
  const recenterFeature = useCallback(
    (featureId: string, featureData?: any, animate = true) => {
      const map = mapInstanceRef.current;
      if (!map || !featureId) return;

      const duration = animate ? 1.0 : 0;
      const focusGroup = layerGroupsRef.current?.focusRing;

      // 1. Candidate Isolated Area
      const candidate = event.candidateIsolatedAreas.find((c) => c.id === featureId);
      if (candidate) {
        if (focusGroup) focusGroup.clearLayers();
        map.flyTo([candidate.position.lat, candidate.position.lng], Math.max(map.getZoom(), 15), {
          duration,
          easeLinearity: 0.25,
        });
        spawnFocusRing(candidate.position.lat, candidate.position.lng, '#f43f5e');
        lastCenteredFeatureIdRef.current = featureId;
        return;
      }

      // 2. Critical Bridge
      const bridge = event.bridges.find((b) => b.id === featureId);
      if (bridge) {
        if (focusGroup) focusGroup.clearLayers();
        map.flyTo([bridge.position.lat, bridge.position.lng], Math.max(map.getZoom(), 16), {
          duration,
          easeLinearity: 0.25,
        });
        spawnFocusRing(bridge.position.lat, bridge.position.lng, '#06b6d4');
        lastCenteredFeatureIdRef.current = featureId;
        return;
      }

      // 3. Road Segment
      const road = event.roads.find((r) => r.id === featureId);
      if (road && road.geometry.length > 0) {
        if (focusGroup) focusGroup.clearLayers();
        const latLngs = road.geometry.map(([lat, lng]) => L.latLng(lat, lng));
        const bounds = L.latLngBounds(latLngs);
        map.flyToBounds(bounds, {
          maxZoom: 16,
          padding: [60, 60],
          duration,
          easeLinearity: 0.25,
        });
        const midPoint = road.geometry[Math.floor(road.geometry.length / 2)];
        if (midPoint) spawnFocusRing(midPoint[0], midPoint[1], '#f59e0b');
        lastCenteredFeatureIdRef.current = featureId;
        return;
      }

      // 4. Response Hub
      const respCenter = event.responseCenters.find((rc) => rc.id === featureId);
      if (respCenter) {
        if (focusGroup) focusGroup.clearLayers();
        map.flyTo([respCenter.position.lat, respCenter.position.lng], Math.max(map.getZoom(), 15), {
          duration,
          easeLinearity: 0.25,
        });
        spawnFocusRing(respCenter.position.lat, respCenter.position.lng, '#3b82f6');
        lastCenteredFeatureIdRef.current = featureId;
        return;
      }

      // 5. Flood Inundation Polygon
      const poly = event.polygons.find((p) => p.id === featureId);
      if (poly && poly.geometry.coordinates.length > 0) {
        if (focusGroup) focusGroup.clearLayers();
        const latLngs = poly.geometry.coordinates.map(([lat, lng]) => L.latLng(lat, lng));
        const bounds = L.latLngBounds(latLngs);
        map.flyToBounds(bounds, {
          maxZoom: 15,
          padding: [50, 50],
          duration,
          easeLinearity: 0.25,
        });
        const midPoint = poly.geometry.coordinates[0];
        if (midPoint) spawnFocusRing(midPoint[0], midPoint[1], '#0284c7');
        lastCenteredFeatureIdRef.current = featureId;
        return;
      }

      // 6. Direct selectedFeatureData fallback if object passed dynamically
      if (featureData) {
        if (focusGroup) focusGroup.clearLayers();
        if (featureData.position) {
          map.flyTo([featureData.position.lat, featureData.position.lng], Math.max(map.getZoom(), 15), {
            duration,
          });
          spawnFocusRing(featureData.position.lat, featureData.position.lng);
          lastCenteredFeatureIdRef.current = featureId;
        } else if (featureData.geometry) {
          const coords = Array.isArray(featureData.geometry)
            ? featureData.geometry
            : featureData.geometry.coordinates;
          if (Array.isArray(coords) && coords.length > 0) {
            const latLngs = coords.map(([lat, lng]: [number, number]) => L.latLng(lat, lng));
            map.flyToBounds(L.latLngBounds(latLngs), { maxZoom: 16, padding: [60, 60], duration });
            lastCenteredFeatureIdRef.current = featureId;
          }
        }
      }
    },
    [event]
  );

  // Automatic Recenter and Zoom on Selected Feature
  useEffect(() => {
    if (!selectedFeatureId) {
      lastCenteredFeatureIdRef.current = null;
      return;
    }
    recenterFeature(selectedFeatureId, selectedFeatureData, true);
  }, [selectedFeatureId, selectedFeatureData, recenterFeature]);

  // Dynamic ResizeObserver: automatically invalidates Leaflet map size and centers
  // correctly whenever the inspection drawer or window container changes dimensions
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let resizeTimer: number | null = null;
    let lastWidth = container.clientWidth;
    let lastHeight = container.clientHeight;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Verify dimensions actually changed by more than 2px and are positive
        if (
          width > 0 &&
          height > 0 &&
          (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2)
        ) {
          lastWidth = width;
          lastHeight = height;

          const map = mapInstanceRef.current;
          if (!map) return;

          // Invalidate size immediately so Leaflet knows the new dimensions
          map.invalidateSize({ pan: false });

          // Debounced second pass to ensure smooth CSS transition completion and recenter
          if (resizeTimer) window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            const currentMap = mapInstanceRef.current;
            if (!currentMap) return;

            currentMap.invalidateSize({ pan: false });

            // If a feature is selected, ensure it is re-centered cleanly in the resized viewport
            if (selectedFeatureId) {
              recenterFeature(selectedFeatureId, selectedFeatureData, false);
            }
          }, 120);
        }
      }
    });

    observer.observe(container);

    return () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [selectedFeatureId, selectedFeatureData, recenterFeature]);

  // Spatial telemetry and flood probability calculation for an arbitrary lat/lng
  const calculatePointTelemetry = (lat: number, lng: number, isPinned = false) => {
    // 1. Check if point is inside any flood polygon
    let insidePoly: FloodPolygon | null = null;
    let minPolyDist = Infinity;
    let closestPoly: FloodPolygon | null = null;

    for (const poly of event.polygons) {
      if (isPointInPolygon([lat, lng], poly.geometry.coordinates)) {
        insidePoly = poly;
      }
      for (const [plat, plng] of poly.geometry.coordinates) {
        const d = haversineDistanceMeters(lat, lng, plat, plng);
        if (d < minPolyDist) {
          minPolyDist = d;
          closestPoly = poly;
        }
      }
    }

    let prob = 0.02;
    let classification = 'Safe Dry Ground (Unflooded)';

    if (insidePoly) {
      const activePoly: FloodPolygon = insidePoly;
      prob = activePoly.meanFloodProbability;
      classification = prob > 0.85
        ? 'Submerged Inundation Zone (High Confidence)'
        : 'Detected Inundation Surface';
    } else if (closestPoly && minPolyDist < 60) {
      prob = Math.max(0.48, closestPoly.meanFloodProbability * 0.75);
      classification = 'Immediate Inundation Fringe (<60m)';
    } else if (closestPoly && minPolyDist < 200) {
      prob = Math.max(0.20, closestPoly.meanFloodProbability * 0.38);
      classification = 'Hydrologic Buffer Transition (<200m)';
    } else if (closestPoly && minPolyDist < 500) {
      prob = Math.max(0.06, closestPoly.meanFloodProbability * 0.12);
      classification = 'Lowland Watershed Peripheral';
    } else {
      prob = Math.max(0.01, 0.04 * Math.exp(-minPolyDist / 1200));
      classification = 'Safe Dry Ground (Upland)';
    }

    // Nearest infrastructure element
    let nearestFeature: { name: string; type: string; distanceMeters: number } | undefined;
    let minInfraDist = Infinity;

    for (const r of event.roads) {
      for (const [rlat, rlng] of r.geometry) {
        const d = haversineDistanceMeters(lat, lng, rlat, rlng);
        if (d < minInfraDist) {
          minInfraDist = d;
          nearestFeature = { name: r.name, type: 'Road (' + r.classification + ')', distanceMeters: Math.round(d) };
        }
      }
    }

    for (const b of event.bridges) {
      const d = haversineDistanceMeters(lat, lng, b.position.lat, b.position.lng);
      if (d < minInfraDist) {
        minInfraDist = d;
        nearestFeature = { name: b.name, type: 'Bridge over ' + b.waterwayName, distanceMeters: Math.round(d) };
      }
    }

    for (const c of event.candidateIsolatedAreas) {
      const d = haversineDistanceMeters(lat, lng, c.position.lat, c.position.lng);
      if (d < minInfraDist) {
        minInfraDist = d;
        nearestFeature = { name: c.name, type: 'Community (' + c.type + ')', distanceMeters: Math.round(d) };
      }
    }

    const baseElev = event.id.includes('kentucky') ? 295 : event.id.includes('harvey') ? 14 : 36;
    const elevVariation = insidePoly ? -6 : Math.min(75, Math.round(minPolyDist * 0.05));
    const estimatedElevationMeters = Math.max(1, baseElev + elevVariation);

    const data = {
      lat,
      lng,
      floodProbability: prob,
      classification,
      nearestFeature,
      estimatedElevationMeters,
      isPinned,
    };

    setProbeData(data);
    return data;
  };

  // Coordinate Inspection Map Event Listeners & Custom Leaflet Control
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const container = map.getContainer();

    if (!isCoordinateInspectionActive) {
      container.style.cursor = '';
      if (!probeData?.isPinned) {
        setProbeData(null);
      }
      layerGroupsRef.current?.probe.clearLayers();
      if (leafletTelemetryControlRef.current) {
        try {
          map.removeControl(leafletTelemetryControlRef.current);
        } catch {
          // Ignore if already removed
        }
        leafletTelemetryControlRef.current = null;
      }
      return;
    }

    container.style.cursor = 'crosshair';

    // Mount Custom Leaflet Control if not already added
    if (!leafletTelemetryControlRef.current) {
      const telemetryControl = new TelemetryLeafletControlClass({ position: 'bottomright' });
      telemetryControl.addTo(map);
      leafletTelemetryControlRef.current = telemetryControl;
    }

    // Sample initial point
    if (!probeData) {
      const center = map.getCenter();
      const initialData = calculatePointTelemetry(center.lat, center.lng, false);
      leafletTelemetryControlRef.current?.updateContent(initialData);
    } else {
      leafletTelemetryControlRef.current?.updateContent(probeData);
    }

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!probeData?.isPinned) {
        const pointData = calculatePointTelemetry(e.latlng.lat, e.latlng.lng, false);
        leafletTelemetryControlRef.current?.updateContent(pointData);
      }
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const pinnedData = calculatePointTelemetry(e.latlng.lat, e.latlng.lng, true);
      leafletTelemetryControlRef.current?.updateContent(pinnedData);
      const probeGroup = layerGroupsRef.current?.probe;
      if (probeGroup) {
        probeGroup.clearLayers();

        const probeIcon = L.divIcon({
          className: 'leaflet-probe-pin',
          html: `
            <div style="position: relative; width: 0; height: 0; display: flex; align-items: center; justify-content: center; pointer-events: none;">
              <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; border: 2px solid #22d3ee; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; border: 1.5px solid #67e8f9; background: rgba(8, 51, 68, 0.85); box-shadow: 0 0 12px #06b6d4; display: flex; align-items: center; justify-content: center;">
                <div style="width: 5px; height: 5px; border-radius: 9999px; background: #67e8f9;"></div>
              </div>
              <div style="position: absolute; width: 44px; height: 1.5px; background: rgba(34, 211, 238, 0.85);"></div>
              <div style="position: absolute; height: 44px; width: 1.5px; background: rgba(34, 211, 238, 0.85);"></div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: probeIcon });
        probeGroup.addLayer(marker);
      }
    };

    map.on('mousemove', handleMouseMove);
    map.on('click', handleMapClick);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleInspection(false);
        setProbeData(null);
        layerGroupsRef.current?.probe.clearLayers();
        if (leafletTelemetryControlRef.current) {
          try {
            map.removeControl(leafletTelemetryControlRef.current);
          } catch {
            // Ignore
          }
          leafletTelemetryControlRef.current = null;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('click', handleMapClick);
      window.removeEventListener('keydown', handleKeyDown);
      container.style.cursor = '';
    };
  }, [isCoordinateInspectionActive, probeData?.isPinned, event]);

  // Update Layers when data, scenario, weights, or visibility changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current) return;

    const {
      polygons,
      roads,
      bridges,
      responseCenters,
      isolatedAreas,
      routes,
    } = layerGroupsRef.current;

    // Clear existing features
    polygons.clearLayers();
    roads.clearLayers();
    bridges.clearLayers();
    responseCenters.clearLayers();
    isolatedAreas.clearLayers();
    routes.clearLayers();

    // 1. Render Flood Polygons
    if (showPolygons) {
      event.polygons.forEach((poly) => {
        const isSelected = selectedFeatureId === poly.id;
        const isAnyFeatureSelected = Boolean(selectedFeatureId);

        // When a polygon is selected, render glowing halo outline underneath
        if (isSelected) {
          const haloPolygon = L.polygon(poly.geometry.coordinates, {
            color: '#38bdf8',
            weight: 7,
            opacity: 0.85,
            fill: false,
            lineJoin: 'round',
          });
          polygons.addLayer(haloPolygon);
        }

        const leafletPolygon = L.polygon(poly.geometry.coordinates, {
          color: isSelected ? '#38bdf8' : '#0284c7',
          weight: isSelected ? 4 : (isAnyFeatureSelected ? 1.2 : 1.5),
          opacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.45 : 0.85),
          fillColor: isSelected ? '#0ea5e9' : '#0284c7',
          fillOpacity: isSelected ? 0.72 : (isAnyFeatureSelected ? 0.22 : 0.38),
          dashArray: isSelected ? '8, 4' : undefined,
        });

        leafletPolygon.bindTooltip(
          `<div class="text-xs">
            <strong class="text-cyan-300">${poly.name}</strong><br/>
            Area: <span class="font-mono">${poly.areaKm2.toFixed(2)} km²</span><br/>
            P(Flood): <span class="font-mono">${(poly.meanFloodProbability * 100).toFixed(0)}%</span><br/>
            Confidence: <span class="text-slate-300">${poly.confidence}</span>
            ${isSelected ? '<br/><span class="text-cyan-400 font-bold">● ACTIVE INSPECTION SELECTION</span>' : ''}
          </div>`,
          { className: 'leaflet-custom-tooltip', sticky: true }
        );

        leafletPolygon.on('click', () => {
          onSelectFeature('polygon', poly);
        });

        if (isSelected) {
          leafletPolygon.bringToFront();
        }

        polygons.addLayer(leafletPolygon);
      });
    }

    // 2. Render Road Network
    if (showRoads) {
      const isAnyFeatureSelected = Boolean(selectedFeatureId);

      event.roads.forEach((road) => {
        const impactScore = calculateRoadImpactScore(road, weights);
        const category = getImpactCategory(impactScore);
        const isSelected = selectedFeatureId === road.id;

        let strokeColor = '#10b981'; // SAFE
        if (category === 'HIGHLY_AFFECTED') strokeColor = '#f43f5e';
        else if (category === 'POTENTIALLY_AFFECTED') strokeColor = '#f59e0b';

        let strokeWidth = 3;
        if (road.classification === 'motorway' || road.classification === 'primary') {
          strokeWidth = 4.5;
        } else if (road.classification === 'residential') {
          strokeWidth = 2;
        }

        // When road is selected, add high-visibility glowing halo underneath
        if (isSelected) {
          const haloUnderlay = L.polyline(road.geometry, {
            color: '#06b6d4',
            weight: strokeWidth + 7,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          });
          roads.addLayer(haloUnderlay);
        }

        const polyline = L.polyline(road.geometry, {
          color: isSelected ? '#ffffff' : strokeColor,
          weight: isSelected ? strokeWidth + 3 : (isAnyFeatureSelected ? Math.max(1.5, strokeWidth - 1) : strokeWidth),
          opacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.35 : 0.85),
          dashArray: category === 'HIGHLY_AFFECTED' ? '6, 6' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.bindTooltip(
          `<div class="text-xs">
            <strong class="text-white">${road.name}</strong><br/>
            Class: <span class="capitalize text-slate-300">${road.classification}</span><br/>
            Status: <span class="font-semibold" style="color: ${strokeColor}">${category.replace('_', ' ')}</span><br/>
            Impact Score: <span class="font-mono">${impactScore} / 100</span><br/>
            Affected Length: <span class="font-mono">${(road.affectedLengthMeters / 1000).toFixed(2)} km</span>
            ${isSelected ? '<br/><span class="text-cyan-400 font-bold">● ACTIVE INSPECTION SELECTION</span>' : ''}
          </div>`,
          { className: 'leaflet-custom-tooltip', sticky: true }
        );

        polyline.on('click', () => {
          onSelectFeature('road', { ...road, currentImpactScore: impactScore, currentCategory: category });
        });

        if (isSelected) {
          polyline.bringToFront();
        }

        roads.addLayer(polyline);
      });
    }

    // 3. Render Critical Bridges
    if (showBridges) {
      const isAnyFeatureSelected = Boolean(selectedFeatureId);

      event.bridges.forEach((bridge) => {
        const isSelected = selectedFeatureId === bridge.id;
        const isSevered =
          (scenario === 'scenario-3' && bridge.floodProbability > 0.5) ||
          bridge.floodProbability >= threshold;

        const markerColor = isSevered ? '#e11d48' : '#06b6d4';

        // When bridge is selected, add pulsing outer halo ring
        if (isSelected) {
          const haloRing = L.circleMarker([bridge.position.lat, bridge.position.lng], {
            radius: 20,
            color: '#06b6d4',
            weight: 3,
            fillColor: '#06b6d4',
            fillOpacity: 0.3,
            className: 'animate-ping',
          });
          bridges.addLayer(haloRing);
        }

        const bridgeMarker = L.circleMarker([bridge.position.lat, bridge.position.lng], {
          radius: isSelected ? 13 : (isAnyFeatureSelected ? 6 : 7.5),
          fillColor: markerColor,
          color: isSelected ? '#ffffff' : '#e2e8f0',
          weight: isSelected ? 4 : 1.5,
          opacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.45 : 0.95),
          fillOpacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.45 : 0.95),
        });

        bridgeMarker.bindTooltip(
          `<div class="text-xs">
            <strong class="text-cyan-300">Bridge: ${bridge.name}</strong><br/>
            Over: <span class="text-slate-300">${bridge.waterwayName}</span><br/>
            Articulation Point: <span class="font-mono font-semibold ${bridge.isArticulationPoint ? 'text-rose-400' : 'text-slate-400'}">${bridge.isArticulationPoint ? 'YES (Critical Cut-Edge)' : 'NO'}</span><br/>
            Betweenness: <span class="font-mono">${(bridge.betweennessCentrality * 100).toFixed(1)}%</span><br/>
            Status: <span class="font-semibold text-rose-400">${isSevered ? 'POTENTIALLY SEVERED' : 'PASSABLE'}</span>
            ${isSelected ? '<br/><span class="text-cyan-400 font-bold">● ACTIVE INSPECTION SELECTION</span>' : ''}
          </div>`,
          { className: 'leaflet-custom-tooltip', sticky: true }
        );

        bridgeMarker.on('click', () => {
          onSelectFeature('bridge', { ...bridge, isCurrentlySevered: isSevered });
        });

        if (isSelected) {
          bridgeMarker.bringToFront();
        }

        bridges.addLayer(bridgeMarker);
      });
    }

    // 4. Render Emergency Response Centers
    if (showResponseCenters) {
      const isAnyFeatureSelected = Boolean(selectedFeatureId);

      event.responseCenters.forEach((center) => {
        const isDispatchRoot = center.id === activeDispatchCenter.id;
        const isSelected = selectedFeatureId === center.id;

        // When response center is selected, add outer halo ring
        if (isSelected) {
          const haloRing = L.circleMarker([center.position.lat, center.position.lng], {
            radius: 22,
            color: '#38bdf8',
            weight: 3,
            fillColor: '#38bdf8',
            fillOpacity: 0.35,
            className: 'animate-ping',
          });
          responseCenters.addLayer(haloRing);
        }

        const centerMarker = L.circleMarker([center.position.lat, center.position.lng], {
          radius: isSelected ? 14 : (isDispatchRoot ? 11 : 8),
          fillColor: isDispatchRoot ? '#06b6d4' : '#3b82f6',
          color: isSelected ? '#ffffff' : (isDispatchRoot ? '#38bdf8' : '#ffffff'),
          weight: isSelected ? 4 : (isDispatchRoot ? 3 : 1.5),
          opacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.5 : 1.0),
          fillOpacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.6 : 1.0),
        });

        centerMarker.bindTooltip(
          `<div class="text-xs">
            <strong class="text-cyan-300">${center.name}</strong><br/>
            Type: <span class="text-slate-300">${center.type}</span><br/>
            Callsign: <span class="font-mono text-cyan-400">${center.contactCallsign}</span><br/>
            Available Units: <span class="font-mono">${center.availableUnits} vehicles</span><br/>
            ${isDispatchRoot ? '<span class="text-emerald-400 font-bold">● ACTIVE DISPATCH ORIGIN</span>' : ''}
            ${isSelected ? '<br/><span class="text-cyan-400 font-bold">● ACTIVE INSPECTION SELECTION</span>' : ''}
          </div>`,
          { className: 'leaflet-custom-tooltip', sticky: true }
        );

        centerMarker.on('click', () => {
          onSelectFeature('response', center);
        });

        if (isSelected) {
          centerMarker.bringToFront();
        }

        responseCenters.addLayer(centerMarker);
      });
    }

    // 5. Render Candidate Isolated Communities
    if (showIsolatedAreas) {
      const isAnyFeatureSelected = Boolean(selectedFeatureId);

      event.candidateIsolatedAreas.forEach((area) => {
        const isSelected = selectedFeatureId === area.id;
        const markerColor = area.isIsolated ? '#f43f5e' : '#10b981';

        // When isolated area is selected, add prominent animated beacon aura
        if (isSelected) {
          const haloRing = L.circleMarker([area.position.lat, area.position.lng], {
            radius: 26,
            color: markerColor,
            weight: 3,
            fillColor: markerColor,
            fillOpacity: 0.35,
            className: 'animate-ping',
          });
          isolatedAreas.addLayer(haloRing);
        }

        const areaMarker = L.circleMarker([area.position.lat, area.position.lng], {
          radius: isSelected ? 15 : (isAnyFeatureSelected ? 7 : 9.5),
          fillColor: markerColor,
          color: isSelected ? '#ffffff' : '#ffffff',
          weight: isSelected ? 4 : 2,
          opacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.4 : 0.9),
          fillOpacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.4 : 0.9),
        });

        areaMarker.bindTooltip(
          `<div class="text-xs">
            <strong class="text-white">${area.name}</strong><br/>
            Type: <span class="text-slate-300">${area.type}</span><br/>
            Est. Population: <span class="font-mono">${area.estimatedPopulation.toLocaleString()} residents</span><br/>
            Status: <span class="font-semibold ${area.isIsolated ? 'text-rose-400' : 'text-emerald-400'}">${area.isIsolated ? 'CANDIDATE POTENTIALLY ISOLATED' : 'ESTIMATED REACHABLE'}</span><br/>
            Failed Routes: <span class="font-mono text-rose-300">${area.failedRoutesCount}</span><br/>
            <span class="text-[10px] text-amber-300 font-medium">Requires Field Verification</span>
            ${isSelected ? '<br/><span class="text-cyan-400 font-bold">● ACTIVE INSPECTION SELECTION</span>' : ''}
          </div>`,
          { className: 'leaflet-custom-tooltip', sticky: true }
        );

        areaMarker.on('click', () => {
          onSelectFeature('isolated', area);
        });

        if (isSelected) {
          areaMarker.bringToFront();
        }

        isolatedAreas.addLayer(areaMarker);
      });
    }

    // 6. Render Evacuation / Transit Routing Lines
    if (showRoutes) {
      const isAnyFeatureSelected = Boolean(selectedFeatureId);

      event.candidateIsolatedAreas.forEach((area) => {
        if (area.pathGeometry && area.pathGeometry.length > 1) {
          const isSelected = selectedFeatureId === area.id;
          const isBlocked = area.isIsolated;

          // When candidate is selected, add prominent glowing route corridor underlay
          if (isSelected) {
            const haloRoute = L.polyline(area.pathGeometry, {
              color: isBlocked ? '#f43f5e' : '#06b6d4',
              weight: 9,
              opacity: 0.45,
            });
            routes.addLayer(haloRoute);
          }

          const routeLine = L.polyline(area.pathGeometry, {
            color: isSelected ? (isBlocked ? '#fb7185' : '#38bdf8') : (isBlocked ? '#f43f5e' : '#06b6d4'),
            weight: isSelected ? 5 : (isAnyFeatureSelected ? 1.5 : 2),
            opacity: isSelected ? 1.0 : (isAnyFeatureSelected ? 0.25 : 0.65),
            dashArray: isBlocked ? '6, 6' : undefined,
          });

          if (isSelected) {
            routeLine.bringToFront();
          }

          routes.addLayer(routeLine);
        }
      });
    }
  }, [
    event,
    scenario,
    threshold,
    weights,
    activeDispatchCenter,
    showPolygons,
    showRoads,
    showBridges,
    showResponseCenters,
    showIsolatedAreas,
    showRoutes,
    selectedFeatureId,
  ]);

  return (
    <div className={`relative w-full h-full min-h-[520px] flex flex-col transition-colors ${
      isLight ? 'bg-slate-100' : 'bg-slate-950'
    }`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-10" />

      {/* Map Control HUD: Layer Visibility Toggles */}
      <div className={`absolute top-4 right-4 z-20 backdrop-blur-md border rounded-lg p-3 shadow-xl text-xs space-y-2 max-w-[210px] transition-colors ${
        isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-200'
      }`}>
        {/* Coordinate Probe Crosshair Tool Button */}
        <div className={`pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            onClick={() => {
              toggleInspection();
              if (isCoordinateInspectionActive) {
                setProbeData(null);
                layerGroupsRef.current?.probe.clearLayers();
              }
            }}
            className={`w-full py-1.5 px-2 rounded-md font-semibold text-[11px] flex items-center justify-between transition-all ${
              isCoordinateInspectionActive
                ? isLight ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                : isLight ? 'bg-slate-100 text-cyan-800 hover:bg-slate-200 border border-slate-300' : 'bg-slate-800/90 text-cyan-300 hover:bg-slate-700 hover:text-white border border-cyan-500/30'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Crosshair className={`w-3.5 h-3.5 ${isCoordinateInspectionActive ? 'animate-spin' : ''}`} />
              Coordinate Probe
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
              isCoordinateInspectionActive
                ? isLight ? 'bg-cyan-800 text-white font-bold' : 'bg-slate-950 text-cyan-400 font-bold'
                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-slate-400'
            }`}>
              {isCoordinateInspectionActive ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Leaflet PNG Map Snapshot Export Button */}
        <div className={`pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            onClick={handleExportMapPNG}
            disabled={isExportingPNG}
            className={`w-full py-1.5 px-2 rounded-md font-semibold text-[11px] flex items-center justify-between transition-all border disabled:opacity-50 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600'
            }`}
            title="Export high-resolution PNG screenshot of the current map view for emergency reports"
          >
            <span className="flex items-center gap-1.5">
              <Camera className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'} ${isExportingPNG ? 'animate-pulse' : ''}`} />
              <span>{isExportingPNG ? 'Capturing...' : 'Export Map PNG'}</span>
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
              isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
            }`}>
              {isExportingPNG ? 'WAIT' : 'SNAP'}
            </span>
          </button>
        </div>

        {/* Basemap Selection */}
        <div className={`pb-2 border-b space-y-1 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span className={`flex items-center gap-1 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Globe className={`w-3 h-3 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              Basemap Cartography
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-300'}`}>
              Vector / Raster
            </span>
          </div>
          <select
            value={activeBasemap || 'carto-dark'}
            onChange={(e) => setActiveBasemap(e.target.value as any)}
            className={`w-full border rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium cursor-pointer ${
              isLight ? 'bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400' : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
          >
            <option value="carto-dark">CartoDB Dark Matter</option>
            <option value="osm">OpenStreetMap Standard</option>
            <option value="esri-topo">Esri Topographic</option>
            <option value="carto-light">CartoDB Positron Light</option>
          </select>
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Map Layers
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/80"></span>
              Flood Inundation Polygons
            </span>
            <input
              type="checkbox"
              checked={!!showPolygons}
              onChange={(e) => setShowPolygons(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-amber-400"></span>
              Roads & Infrastructure
            </span>
            <input
              type="checkbox"
              checked={!!showRoads}
              onChange={(e) => setShowRoads(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Critical Bridges
            </span>
            <input
              type="checkbox"
              checked={!!showBridges}
              onChange={(e) => setShowBridges(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Emergency Response Hubs
            </span>
            <input
              type="checkbox"
              checked={!!showResponseCenters}
              onChange={(e) => setShowResponseCenters(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              Candidate Isolated Areas
            </span>
            <input
              type="checkbox"
              checked={!!showIsolatedAreas}
              onChange={(e) => setShowIsolatedAreas(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-cyan-400 border-dashed"></span>
              Evacuation Routes
            </span>
            <input
              type="checkbox"
              checked={!!showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>
        </div>

        {/* Supporting SAR Overlay Toggle */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-1.5 font-medium text-cyan-300">
              <Compass className="w-3 h-3" />
              Sentinel-1 SAR Overlay
            </span>
            <input
              type="checkbox"
              checked={!!showSAROverlay}
              onChange={(e) => setShowSAROverlay(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          {showSAROverlay && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>SAR Opacity</span>
                <span className="font-mono">{((sarOpacity ?? 0.65) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={sarOpacity ?? 0.65}
                onChange={(e) => setSarOpacity(parseFloat(e.target.value) || 0.65)}
                className="w-full accent-cyan-400 cursor-pointer h-1"
              />
              <div className="text-[10px] text-slate-500 italic mt-0.5">
                C-band GRD backscatter (VV+VH)
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Doppler Precipitation Radar & Basin Heatmap Layer Toggle */}
        <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className={`flex items-center gap-1.5 font-semibold text-xs ${
              showWeatherLayer ? (isLight ? 'text-cyan-800' : 'text-cyan-300') : (isLight ? 'text-slate-700' : 'text-slate-300')
            }`}>
              <CloudRain className={`w-3.5 h-3.5 ${showWeatherLayer ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              Live Weather & Radar
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] px-1 py-0.5 rounded font-mono uppercase font-bold ${
                showWeatherLayer
                  ? isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                  : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>
                {showWeatherLayer ? 'LIVE' : 'OFF'}
              </span>
              <input
                type="checkbox"
                checked={showWeatherLayer}
                onChange={(e) => setShowWeatherLayer(e.target.checked)}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>
          </label>

          {showWeatherLayer && (
            <div className={`mt-2 p-2.5 rounded-lg border space-y-2 text-xs ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}>
              {/* Weather Sub-Layers Checklist */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sub-Layers</div>
                <label className="flex items-center justify-between text-[11px] cursor-pointer">
                  <span>Doppler Radar Stream</span>
                  <input
                    type="checkbox"
                    checked={weatherSubLayerRadar}
                    onChange={(e) => setWeatherSubLayerRadar(e.target.checked)}
                    className="accent-cyan-400"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] cursor-pointer">
                  <span>Basin Inundation Heatmap</span>
                  <input
                    type="checkbox"
                    checked={weatherSubLayerHeatmap}
                    onChange={(e) => setWeatherSubLayerHeatmap(e.target.checked)}
                    className="accent-cyan-400"
                  />
                </label>
                <label className="flex items-center justify-between text-[11px] cursor-pointer">
                  <span>Virtual Rain Gauges</span>
                  <input
                    type="checkbox"
                    checked={weatherSubLayerGauges}
                    onChange={(e) => setWeatherSubLayerGauges(e.target.checked)}
                    className="accent-cyan-400"
                  />
                </label>
              </div>

              {/* Simulation Mode Selector */}
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Precipitation Mode</div>
                <select
                  value={weatherSimulationMode}
                  onChange={(e) => setWeatherSimulationMode(e.target.value as any)}
                  className={`w-full border rounded px-1.5 py-1 text-[10px] font-semibold cursor-pointer ${
                    isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  <option value="live">Live Real-Time Feed (Open-Meteo API)</option>
                  <option value="peak">Peak Storm Deluge (Historical Cloudburst)</option>
                  <option value="forecast">Convective Nowcast (+60m Forecast)</option>
                </select>
              </div>

              {/* Radar Opacity Slider */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Radar & Heatmap Opacity</span>
                  <span className="font-mono text-cyan-400 font-bold">{Math.round(weatherOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={weatherOpacity}
                  onChange={(e) => setWeatherOpacity(parseFloat(e.target.value) || 0.75)}
                  className="w-full accent-cyan-500 cursor-pointer h-1"
                />
              </div>

              {/* Color Palette Selector */}
              <div>
                <div className="text-[10px] text-slate-400 mb-0.5">Doppler Palette</div>
                <select
                  value={weatherColorScheme}
                  onChange={(e) => setWeatherColorScheme(parseInt(e.target.value, 10))}
                  className={`w-full border rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer ${
                    isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  <option value={2}>Universal Doppler Scale</option>
                  <option value={6}>NEXRAD Rainbow Scale</option>
                  <option value={4}>The Weather Channel</option>
                </select>
              </div>

              {/* Status and Refresh */}
              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-700/50">
                <span className="text-slate-400">
                  {isLoadingRadar ? 'Fetching radar pass...' : radarData?.frames?.length ? `${radarData.frames.length} Doppler frames` : 'Radar active'}
                </span>
                <button
                  onClick={loadWeatherData}
                  disabled={isLoadingRadar}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isLoadingRadar ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Interactive Quick-Jump List & Live Weather Radar Control Header */}
      <div className="absolute top-4 left-4 z-20 flex items-start gap-2 max-w-[calc(100vw-360px)] flex-wrap pointer-events-auto">
        {/* Quick-Jump Widget */}
        <div className={`backdrop-blur-md border rounded-lg shadow-xl text-xs max-w-[320px] pointer-events-auto transition-colors ${
          isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
        }`}>
          <button
            onClick={() => setShowQuickJumpList(!showQuickJumpList)}
            className={`w-full px-3 py-2 flex items-center justify-between font-semibold rounded-lg transition-colors ${
              isLight ? 'text-slate-950 hover:bg-slate-100' : 'text-white hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-wide">
              <Target className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              Infrastructure Quick-Jump
            </span>
            <span className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {event.candidateIsolatedAreas.length} sites
              {showQuickJumpList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

        {showQuickJumpList && (
          <div className={`p-3 pt-1 border-t space-y-2.5 max-h-[340px] overflow-y-auto ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            {/* Quick-Jump Tabs */}
            <div className={`flex items-center gap-1 p-1 rounded border text-[10px] ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}>
              <button
                onClick={() => setQuickJumpTab('isolated')}
                className={`flex-1 py-1 rounded text-center transition-colors font-medium ${
                  quickJumpTab === 'isolated'
                    ? 'bg-rose-600 text-white font-bold shadow-sm'
                    : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Isolated ({event.candidateIsolatedAreas.length})
              </button>
              <button
                onClick={() => setQuickJumpTab('bridges')}
                className={`flex-1 py-1 rounded text-center transition-colors font-medium ${
                  quickJumpTab === 'bridges'
                    ? isLight ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bridges ({event.bridges.length})
              </button>
              <button
                onClick={() => setQuickJumpTab('roads')}
                className={`flex-1 py-1 rounded text-center transition-colors font-medium ${
                  quickJumpTab === 'roads'
                    ? isLight ? 'bg-amber-600 text-white font-bold shadow-sm' : 'bg-amber-500 text-slate-950 font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Roads ({event.roads.length})
              </button>
            </div>

            {/* List Content */}
            <div className="space-y-1.5">
              {quickJumpTab === 'isolated' &&
                event.candidateIsolatedAreas.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => onSelectFeature('isolated', area)}
                    className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between text-[11px] ${
                      selectedFeatureId === area.id
                        ? 'bg-rose-950/70 border-rose-500 text-white'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-white truncate flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{area.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Pop: {area.estimatedPopulation.toLocaleString()} · {area.isIsolated ? 'Isolated' : 'Reachable'}
                      </div>
                    </div>
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0 hover:scale-110" />
                  </div>
                ))}

              {quickJumpTab === 'bridges' &&
                event.bridges.map((bridge) => (
                  <div
                    key={bridge.id}
                    onClick={() => onSelectFeature('bridge', bridge)}
                    className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between text-[11px] ${
                      selectedFeatureId === bridge.id
                        ? 'bg-cyan-950/70 border-cyan-500 text-white'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-white truncate flex items-center gap-1">
                        <Split className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{bridge.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Over: {bridge.waterwayName} · P(F)={(bridge.floodProbability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0 hover:scale-110" />
                  </div>
                ))}

              {quickJumpTab === 'roads' &&
                event.roads.map((road) => {
                  const score = calculateRoadImpactScore(road, weights);
                  const cat = getImpactCategory(score);
                  return (
                    <div
                      key={road.id}
                      onClick={() => onSelectFeature('road', road)}
                      className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between text-[11px] ${
                        selectedFeatureId === road.id
                          ? 'bg-amber-950/70 border-amber-500 text-white'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-white truncate flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{road.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Impact: {score}/100 · {cat.replace('_', ' ')}
                        </div>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0 hover:scale-110" />
                    </div>
                  );
                })}
            </div>
            <div className="text-[10px] text-slate-500 italic text-center pt-1 border-t border-slate-800">
              Click any item to center & zoom on map
            </div>
          </div>
        )}
      </div>

      {/* Live Weather & Radar Quick-Toggle Button */}
      <button
        onClick={() => setShowWeatherLayer(!showWeatherLayer)}
        className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all ${
          showWeatherLayer
            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50'
            : isLight
            ? 'bg-white/95 hover:bg-white text-slate-800 border-slate-300'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-800'
        }`}
        title="Toggle Real-Time Precipitation Doppler Radar, Basin Inundation Heatmap, and Rain Gauges"
      >
        <CloudRain className={`w-4 h-4 ${showWeatherLayer ? 'animate-bounce text-slate-950' : 'text-cyan-400'}`} />
        <span className="hidden sm:inline">Live Weather Radar</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase ${
          showWeatherLayer
            ? 'bg-slate-950 text-cyan-400'
            : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
        }`}>
          {showWeatherLayer ? 'LIVE' : 'OFF'}
        </span>
      </button>

      {/* Active Evacuation Route Indicator (if present) */}
      {activeEvacuationRoute && (
        <div className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md ${
          isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-950/90 text-amber-300 border-amber-600/60'
        }`}>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span className="truncate max-w-[200px]">Evac to {activeEvacuationRoute.shelterName}</span>
          {onClearEvacuationRoute && (
            <button
              onClick={onClearEvacuationRoute}
              className="ml-1 p-0.5 rounded hover:bg-amber-500/20 text-slate-400 hover:text-white"
              title="Clear route"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>

      {/* Floating Scientific Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 shadow-lg pointer-events-auto max-w-[280px]">
        <div className="font-semibold text-white text-[11px] mb-1 flex items-center justify-between">
          <span>Cartographic Legend</span>
          <span className="text-[10px] text-slate-400 font-mono">EPSG:4326</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-500/50 border border-sky-400 rounded-sm"></span>
            <span>Detected Flood</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded"></span>
            <span>Passable Road</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded"></span>
            <span>Potentially Affected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 border-dashed rounded"></span>
            <span>Highly Affected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
            <span>Critical Bridge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/50"></span>
            <span>Candidate Isolated</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-amber-300/90 flex items-start gap-1">
          <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Model predictions are decision support estimates. Require field verification.</span>
        </div>
        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-cyan-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Cartographic Projection
          </span>
          <span className="text-[9px] font-mono text-slate-500">EPSG:3857 (WGS 84)</span>
        </div>
      </div>

      {/* Floating HUD: Real-time Coordinate & Flood Probability Inspection Tool */}
      {(isCoordinateInspectionActive || (probeData && probeData.isPinned)) && probeData && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 shadow-2xl rounded-xl p-3 max-w-[460px] w-[94vw] sm:w-[450px] text-xs pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  probeData.isPinned ? 'bg-amber-400' : 'bg-cyan-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  probeData.isPinned ? 'bg-amber-500' : 'bg-cyan-500'
                }`}></span>
              </span>
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Coordinate Inspection HUD
                </span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                probeData.isPinned
                  ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                  : 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300'
              }`}>
                {probeData.isPinned ? 'PINNED' : 'LIVE SCAN'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {probeData.isPinned && (
                <button
                  onClick={() => {
                    const data = calculatePointTelemetry(probeData.lat, probeData.lng, false);
                    setProbeData(data);
                    layerGroupsRef.current?.probe.clearLayers();
                  }}
                  className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Resume live tracking"
                >
                  Unpin
                </button>
              )}
              <button
                onClick={() => {
                  toggleInspection(false);
                  setProbeData(null);
                  layerGroupsRef.current?.probe.clearLayers();
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Inspection Tool (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Coordinates & Probability Body */}
          <div className="mt-2.5 space-y-2">
            {/* Coordinate readout */}
            <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded border border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                  Geographic Coordinates (WGS84)
                </div>
                <div className="text-sm font-mono font-bold text-cyan-300 flex items-center gap-2">
                  <span>{probeData.lat.toFixed(6)}° N, {Math.abs(probeData.lng).toFixed(6)}° W</span>
                  <span className="text-[10px] font-normal text-slate-400 font-sans">
                    (~{probeData.estimatedElevationMeters}m MSL)
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${probeData.lat.toFixed(6)}, ${probeData.lng.toFixed(6)}`);
                  setHasCopiedCoord(true);
                  setTimeout(() => setHasCopiedCoord(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              >
                {hasCopiedCoord ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{hasCopiedCoord ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Estimated Flood Probability Gauge */}
            <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-300 font-medium">
                  Estimated Flood Probability <span className="font-mono text-cyan-400 font-bold">P(Flood)</span>:
                </span>
                <span className={`text-sm font-mono font-extrabold ${
                  probeData.floodProbability > 0.65
                    ? 'text-rose-400'
                    : probeData.floodProbability > 0.30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {(probeData.floodProbability * 100).toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    probeData.floodProbability > 0.65
                      ? 'bg-rose-500'
                      : probeData.floodProbability > 0.30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(4, probeData.floodProbability * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Classification:</span>
                <span className={`font-semibold ${
                  probeData.floodProbability > 0.65
                    ? 'text-rose-300'
                    : probeData.floodProbability > 0.30
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}>
                  {probeData.classification}
                </span>
              </div>
            </div>

            {/* Proximity / Nearest Infrastructure */}
            {probeData.nearestFeature && (
              <div className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Nearest Infrastructure:</span>
                <span className="font-medium text-slate-200 truncate ml-2 text-right">
                  {probeData.nearestFeature.name} <span className="font-mono text-cyan-400">({probeData.nearestFeature.distanceMeters}m)</span>
                </span>
              </div>
            )}

            {/* Footer Tip */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="italic">
                {probeData.isPinned
                  ? 'Click elsewhere on map to move pin, or click Unpin'
                  : 'Move cursor to inspect · Click map to pin probe marker'}
              </span>
              <span className="font-mono text-slate-500">Esc to exit</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Drone Mission HUD Banner */}
      {activeDroneMission && (
        <div className={`absolute ${showWeatherLayer && !isWeatherHudCollapsed ? 'bottom-64 left-4' : 'bottom-4 left-4'} z-20 backdrop-blur-md border rounded-lg p-2.5 shadow-xl flex items-center gap-3 transition-all ${
          isLight ? 'bg-white/95 border-cyan-400 text-slate-900' : 'bg-slate-900/95 border-cyan-500/50 text-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-bold text-xs text-cyan-400 font-mono">{activeDroneMission.id}</span>
            <span className="text-xs">
              UAV Flight Corridor Active ({activeDroneMission.totalDistanceKm} km RT · {activeDroneMission.estimatedTimeMinutes} min)
            </span>
          </div>
          {onClearDroneMission && (
            <button
              onClick={onClearDroneMission}
              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
            >
              Clear Route
            </button>
          )}
        </div>
      )}

      {/* Real-Time Precipitation Doppler Radar & Atmospheric Telemetry HUD */}
      {showWeatherLayer && (
        <div className={`absolute bottom-4 left-4 z-20 backdrop-blur-md border rounded-xl shadow-2xl overflow-hidden transition-all duration-300 max-w-sm w-full pointer-events-auto ${
          isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/95 border-slate-800 text-slate-100'
        }`}>
          {/* Top Status Bar */}
          <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${
            isLight ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                    Live Doppler Radar
                  </span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                    {radarData?.frames[activeFrameIndex]?.formattedTime || 'Latest Scan'}
                  </span>
                  {liveWeather?.dataSource && (
                    <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {liveWeather.dataSource === 'LIVE_API' ? 'LIVE API' : 'SIMULATED'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={loadWeatherData}
                disabled={isLoadingRadar}
                className={`p-1 rounded transition-colors ${
                  isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                }`}
                title="Fetch latest radar pass from RainViewer and weather telemetry"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRadar ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
              <button
                onClick={() => setIsWeatherHudCollapsed(!isWeatherHudCollapsed)}
                className={`p-1 rounded transition-colors ${
                  isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                }`}
                title={isWeatherHudCollapsed ? 'Expand Weather HUD' : 'Collapse Weather HUD'}
              >
                {isWeatherHudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!isWeatherHudCollapsed && (
            <div className="p-3 space-y-2.5 text-xs">
              {/* Weather Scenario Mode Tabs */}
              <div className={`p-1 rounded-lg border grid grid-cols-3 gap-1 text-[10px] font-semibold text-center ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  onClick={() => setWeatherSimulationMode('live')}
                  className={`py-1 rounded transition-colors ${
                    weatherSimulationMode === 'live'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Feed
                </button>
                <button
                  onClick={() => setWeatherSimulationMode('peak')}
                  className={`py-1 rounded transition-colors ${
                    weatherSimulationMode === 'peak'
                      ? 'bg-rose-500 text-white font-bold shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Model the historical cloudburst deluge that triggered the catastrophe"
                >
                  Peak Deluge
                </button>
                <button
                  onClick={() => setWeatherSimulationMode('forecast')}
                  className={`py-1 rounded transition-colors ${
                    weatherSimulationMode === 'forecast'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Project 1-hour convective nowcast shift"
                >
                  Nowcast +60m
                </button>
              </div>

              {/* Weather Sub-Layer Quick Toggles */}
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <button
                  onClick={() => setWeatherSubLayerRadar(!weatherSubLayerRadar)}
                  className={`px-2 py-1 rounded border flex items-center gap-1 font-medium transition-colors ${
                    weatherSubLayerRadar
                      ? isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'opacity-50 border-transparent text-slate-400'
                  }`}
                >
                  <span>Radar Tiles</span>
                </button>
                <button
                  onClick={() => setWeatherSubLayerHeatmap(!weatherSubLayerHeatmap)}
                  className={`px-2 py-1 rounded border flex items-center gap-1 font-medium transition-colors ${
                    weatherSubLayerHeatmap
                      ? isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'opacity-50 border-transparent text-slate-400'
                  }`}
                >
                  <span>Basin Heatmap</span>
                </button>
                <button
                  onClick={() => setWeatherSubLayerGauges(!weatherSubLayerGauges)}
                  className={`px-2 py-1 rounded border flex items-center gap-1 font-medium transition-colors ${
                    weatherSubLayerGauges
                      ? isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'opacity-50 border-transparent text-slate-400'
                  }`}
                >
                  <span>Rain Gauges</span>
                </button>
              </div>

              {/* Atmospheric Telemetry Row */}
              {liveWeather ? (
                <div className={`grid grid-cols-3 gap-2 p-2 rounded-lg border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                      <Droplets className="w-2.5 h-2.5 text-cyan-400" />
                      Rain Rate
                    </div>
                    <div className={`font-mono font-bold text-xs mt-0.5 ${
                      weatherSimulationMode === 'peak'
                        ? 'text-rose-500'
                        : liveWeather.precipitationMmPerHour > 5
                        ? 'text-rose-500'
                        : liveWeather.precipitationMmPerHour > 0
                        ? 'text-amber-500'
                        : 'text-cyan-400'
                    }`}>
                      {weatherSimulationMode === 'peak' ? '54.2' : liveWeather.precipitationMmPerHour} mm/h
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                      <Wind className="w-2.5 h-2.5 text-sky-400" />
                      Wind Speed
                    </div>
                    <div className="font-mono font-bold text-xs mt-0.5 text-slate-200">
                      {liveWeather.windSpeedKmh} km/h
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                      <CloudRain className="w-2.5 h-2.5 text-purple-400" />
                      Humidity
                    </div>
                    <div className="font-mono font-bold text-xs mt-0.5 text-slate-200">
                      {weatherSimulationMode === 'peak' ? '99' : liveWeather.relativeHumidityPercent}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  {isLoadingRadar ? 'Connecting to live Doppler sensor network...' : 'Doppler weather layer active'}
                </div>
              )}

              {/* Radar Loop Playback Controls */}
              {radarData && radarData.frames.length > 1 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Doppler Radar Loop (Past 2 Hours)</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      Frame {activeFrameIndex + 1} of {radarData.frames.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      onClick={() => setIsRadarPlaying(!isRadarPlaying)}
                      className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                        isRadarPlaying
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                          : isLight ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                      }`}
                    >
                      {isRadarPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>{isRadarPlaying ? 'Pause' : 'Play Loop'}</span>
                    </button>

                    <button
                      onClick={() => setActiveFrameIndex((prev) => Math.max(0, prev - 1))}
                      disabled={activeFrameIndex === 0}
                      className={`p-1 rounded border disabled:opacity-40 ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                      title="Previous frame"
                    >
                      <SkipBack className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setActiveFrameIndex((prev) => Math.min(radarData.frames.length - 1, prev + 1))}
                      disabled={activeFrameIndex === radarData.frames.length - 1}
                      className={`p-1 rounded border disabled:opacity-40 ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                      title="Next frame"
                    >
                      <SkipForward className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setActiveFrameIndex(radarData.frames.length - 1)}
                      className={`ml-auto px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors border ${
                        activeFrameIndex === radarData.frames.length - 1
                          ? isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                          : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                      }`}
                    >
                      LIVE NOW
                    </button>
                  </div>
                </div>
              )}

              {/* Doppler Precipitation Heatmap Legend */}
              <div className="pt-1 border-t border-slate-800/80 space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                  <span>Precipitation Intensity (dBZ / mm/h)</span>
                  <span className="font-mono text-cyan-400">Doppler Reflectivity</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-mono">
                  <div className="rounded p-1 bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    <div className="font-bold">Light</div>
                    <div>&lt; 2.5 mm</div>
                  </div>
                  <div className="rounded p-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <div className="font-bold">Moderate</div>
                    <div>2.5-10 mm</div>
                  </div>
                  <div className="rounded p-1 bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <div className="font-bold">Heavy</div>
                    <div>10-50 mm</div>
                  </div>
                  <div className="rounded p-1 bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <div className="font-bold">Extreme</div>
                    <div>&gt; 50 mm</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Custom GeoJSON Layer Banner */}
      {customImportedGeoJson && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 backdrop-blur-md border rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs font-semibold ${
          isLight ? 'bg-white/95 border-purple-300 text-purple-900' : 'bg-slate-900/95 border-purple-500/60 text-purple-300'
        }`}>
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span>Custom GeoJSON Hazard Extent Active</span>
          {onClearCustomGeoJson && (
            <button
              onClick={onClearCustomGeoJson}
              className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Snapshot Export Notification Toast */}
      {exportNotice && (
        <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 rounded-lg px-3.5 py-2 shadow-2xl flex items-center gap-2 text-xs text-white animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Camera className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce" />
          <span className="font-medium">{exportNotice}</span>
        </div>
      )}
    </div>
  );
});
