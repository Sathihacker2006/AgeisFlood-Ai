import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  FloodEventStudyArea,
  ScenarioType,
  ImpactFormulaWeights,
  ResponseLocation,
  RoadSegment,
  BridgeNode,
  CandidateIsolatedArea,
  FloodPolygon,
} from '../types/flood';
import {
  calculateRoadImpactScore,
  getImpactCategory,
} from '../utils/geoCalculations';
import {
  Compass,
  Layers,
  Eye,
  Sliders,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Waves,
  Mountain,
  ShieldAlert,
  Camera,
  Play,
  Pause,
} from 'lucide-react';
import { Terrain3DLegend } from './Terrain3DLegend';

interface Terrain3DViewProps {
  event: FloodEventStudyArea;
  scenario: ScenarioType;
  threshold: number;
  weights: ImpactFormulaWeights;
  activeDispatchCenter: ResponseLocation;
  onSelectFeature: (
    type: 'road' | 'bridge' | 'isolated' | 'response' | 'polygon',
    data: any
  ) => void;
  selectedFeatureId?: string;
}

export const Terrain3DView: React.FC<Terrain3DViewProps> = ({
  event,
  scenario,
  threshold,
  weights,
  activeDispatchCenter,
  onSelectFeature,
  selectedFeatureId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // 3D Controls state
  const [verticalExaggeration, setVerticalExaggeration] = useState(2.2);
  const [waterLevelOffset, setWaterLevelOffset] = useState(0.0); // meters offset
  const [showTerrainMesh, setShowTerrainMesh] = useState(true);
  const [showWaterSurface, setShowWaterSurface] = useState(true);
  const [showRoads3D, setShowRoads3D] = useState(true);
  const [showBridges3D, setShowBridges3D] = useState(true);
  const [showFacilities3D, setShowFacilities3D] = useState(true);
  const [showIsolated3D, setShowIsolated3D] = useState(true);
  const [showRoutes3D, setShowRoutes3D] = useState(true);
  const [waterOpacity, setWaterOpacity] = useState(0.72);
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'valley' | 'topdown'>('isometric');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const isAutoRotatingRef = useRef(false);

  // Interactive mouse/touch orbit tracking
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({
    radius: 420,
    theta: Math.PI / 4, // azimuth
    phi: Math.PI / 3, // inclination
  });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Raycasting for 3D feature selection
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseCoordsRef = useRef(new THREE.Vector2());
  const interactiveObjectsRef = useRef<{ object: THREE.Object3D; type: string; data: any }[]>([]);

  // Coordinate Conversion: (lat, lng) -> Local 3D (X, Z) normalized [-200, 200]
  const coordToLocal = (lat: number, lng: number): [number, number] => {
    const { minLat, maxLat, minLng, maxLng } = event.boundingBox;
    const normX = (lng - minLng) / (maxLng - minLng); // 0 to 1
    const normZ = (lat - minLat) / (maxLat - minLat); // 0 to 1
    const x = (normX - 0.5) * 360; // centered -180 to 180
    const z = -(normZ - 0.5) * 360; // invert latitude for 3D Z
    return [x, z];
  };

  // Synthetic Appalachian / Valley Topographic Elevation Function
  // Returns real elevation in meters normalized for scene
  const getElevationAt = (x: number, z: number): number => {
    // Distance from river valley trough running roughly diagonally
    const valleyAxis = Math.sin(x * 0.015) * 45 + z * 0.4;
    const distToValley = Math.abs(x * 0.7 - z * 0.5);

    if (event.id === 'kentucky-2022') {
      // Steep Appalachian ridges and dendritic hollows (220m valley to 450m ridges)
      const baseValley = 220;
      const ridgeHeight = 190 * Math.pow(Math.min(1.0, distToValley / 110), 1.6);
      const hollowRoughness = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 22;
      return baseValley + ridgeHeight + hollowRoughness;
    } else if (event.id === 'houston-harvey-2017') {
      // Flat coastal plain with shallow Buffalo Bayou trough (12m to 28m)
      const basePlain = 18;
      const bayouDepression = Math.exp(-Math.pow(distToValley / 35, 2)) * -6;
      return basePlain + bayouDepression + (x + z) * 0.02;
    } else {
      // Emilia-Romagna plain meeting northern Apennine foothills (30m to 140m)
      const plainSlope = Math.max(0, -z * 0.35 + 35);
      return Math.min(140, Math.max(25, plainSlope));
    }
  };

  // Setup Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.0015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2500);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(220, 450, 180);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    rimLight.position.set(-200, 150, -200);
    scene.add(rimLight);

    // Initial camera position
    updateCameraPosition();

    // Render loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (isAutoRotatingRef.current) {
        cameraSphericalRef.current.theta += 0.0025;
        const { radius, theta, phi } = cameraSphericalRef.current;
        const x = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.cos(theta);
        if (cameraRef.current) {
          cameraRef.current.position.set(x, y, z);
          cameraRef.current.lookAt(cameraTargetRef.current);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [event.id]);

  // Update Camera Spherical Position
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(
      cameraTargetRef.current.x + x,
      cameraTargetRef.current.y + y,
      cameraTargetRef.current.z + z
    );
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  // Re-build 3D Geospatial Objects when parameters change
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove existing procedural layers (keep lights)
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.name.startsWith('geo_')) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => scene.remove(obj));
    interactiveObjectsRef.current = [];

    const exaggerationScale = (verticalExaggeration * 0.28);

    // 1. TERRAIN ELEVATION MESH
    if (showTerrainMesh) {
      const terrainResolution = 96;
      const terrainGeo = new THREE.PlaneGeometry(360, 360, terrainResolution, terrainResolution);
      terrainGeo.rotateX(-Math.PI / 2); // horizontal X-Z plane

      const pos = terrainGeo.attributes.position;
      const colors = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const rawElevation = getElevationAt(x, z);
        const scaledY = (rawElevation - 220) * exaggerationScale;
        pos.setY(i, scaledY);

        // Hypsometric elevation tinting
        // Low river channel (dark slate-emerald) -> Mid slope (forest slate) -> High ridge (warm rock)
        const t = Math.min(1.0, Math.max(0.0, (rawElevation - 220) / 180));
        let r = 0.12 + t * 0.28;
        let g = 0.18 + t * 0.22;
        let b = 0.22 + t * 0.12;

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }

      terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.1,
        wireframe: false,
        flatShading: false,
      });

      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.name = 'geo_terrain';
      terrainMesh.receiveShadow = true;
      scene.add(terrainMesh);

      // Subtle base boundary skirts
      const gridHelper = new THREE.GridHelper(360, 18, 0x1e293b, 0x0f172a);
      gridHelper.position.y = -22;
      gridHelper.name = 'geo_grid';
      scene.add(gridHelper);
    }

    // 2. 3D FLOOD INUNDATION WATER SURFACES (Draped over valleys)
    if (showWaterSurface) {
      event.polygons.forEach((poly) => {
        const isSelected = selectedFeatureId === poly.id;
        const shape = new THREE.Shape();
        const baseCoords = poly.geometry.coordinates;
        if (baseCoords.length < 3) return;

        let centerElevation = 0;
        baseCoords.forEach(([lat, lng], idx) => {
          const [lx, lz] = coordToLocal(lat, lng);
          centerElevation += getElevationAt(lx, lz);
          if (idx === 0) shape.moveTo(lx, lz);
          else shape.lineTo(lx, lz);
        });
        centerElevation /= baseCoords.length;

        // Water surface elevated slightly above river bed + depth offset
        const waterHeight = (centerElevation - 220 + 4.5 + waterLevelOffset) * exaggerationScale;

        const waterGeo = new THREE.ShapeGeometry(shape);
        waterGeo.rotateX(-Math.PI / 2);

        const waterMat = new THREE.MeshPhysicalMaterial({
          color: isSelected ? new THREE.Color(0x38bdf8) : new THREE.Color(0x0284c7),
          emissive: isSelected ? new THREE.Color(0x0284c7) : new THREE.Color(0x0369a1),
          emissiveIntensity: isSelected ? 0.6 : 0.2,
          roughness: 0.1,
          metalness: 0.15,
          transmission: isSelected ? 0.25 : 0.45,
          transparent: true,
          opacity: isSelected ? Math.min(1.0, waterOpacity + 0.2) : waterOpacity,
          depthWrite: false,
        });

        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.y = waterHeight;
        waterMesh.name = `geo_flood_${poly.id}`;
        scene.add(waterMesh);

        interactiveObjectsRef.current.push({
          object: waterMesh,
          type: 'polygon',
          data: poly,
        });
      });
    }

    // 3. 3D ROAD NETWORK (Extruded & Draped Ribbons)
    if (showRoads3D) {
      event.roads.forEach((road) => {
        const impactScore = calculateRoadImpactScore(road, weights);
        const category = getImpactCategory(impactScore);
        const isSelected = selectedFeatureId === road.id;

        let strokeColor = 0x10b981; // SAFE
        if (category === 'HIGHLY_AFFECTED') strokeColor = 0xf43f5e;
        else if (category === 'POTENTIALLY_AFFECTED') strokeColor = 0xf59e0b;

        const points: THREE.Vector3[] = [];
        road.geometry.forEach(([lat, lng]) => {
          const [lx, lz] = coordToLocal(lat, lng);
          const elev = (getElevationAt(lx, lz) - 220) * exaggerationScale + 0.8;
          points.push(new THREE.Vector3(lx, elev, lz));
        });

        if (points.length >= 2) {
          const curve = new THREE.CatmullRomCurve3(points);
          const tubeRadius = road.classification === 'motorway' || road.classification === 'primary' ? 1.6 : 0.9;
          const tubeGeo = new THREE.TubeGeometry(curve, points.length * 8, tubeRadius, 6, false);

          const roadMat = new THREE.MeshStandardMaterial({
            color: isSelected ? 0xffffff : strokeColor,
            roughness: 0.4,
            metalness: 0.2,
            emissive: new THREE.Color(isSelected ? 0x38bdf8 : strokeColor),
            emissiveIntensity: isSelected ? 0.6 : 0.15,
          });

          const roadMesh = new THREE.Mesh(tubeGeo, roadMat);
          roadMesh.name = `geo_road_${road.id}`;
          roadMesh.castShadow = true;
          scene.add(roadMesh);

          interactiveObjectsRef.current.push({
            object: roadMesh,
            type: 'road',
            data: { ...road, currentImpactScore: impactScore, currentCategory: category },
          });
        }
      });
    }

    // 4. 3D CRITICAL BRIDGES (Raised Spans Crossing Channels)
    if (showBridges3D) {
      event.bridges.forEach((bridge) => {
        const [lx, lz] = coordToLocal(bridge.position.lat, bridge.position.lng);
        const valleyFloorElev = (getElevationAt(lx, lz) - 220) * exaggerationScale;
        const bridgeDeckElev = valleyFloorElev + 8.5 * exaggerationScale;

        const isSelected = selectedFeatureId === bridge.id;
        const isSevered =
          (scenario === 'scenario-3' && bridge.floodProbability > 0.5) ||
          bridge.floodProbability >= threshold;

        // Bridge Deck Span
        const bridgeDeckGeo = new THREE.BoxGeometry(16, 2.4, 6);
        const bridgeMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xffffff : (isSevered ? 0xe11d48 : 0x06b6d4),
          roughness: 0.2,
          metalness: 0.6,
          emissive: new THREE.Color(isSelected ? 0x38bdf8 : (isSevered ? 0xf43f5e : 0x0891b2)),
          emissiveIntensity: isSelected ? 0.9 : 0.4,
        });

        const bridgeMesh = new THREE.Mesh(bridgeDeckGeo, bridgeMat);
        bridgeMesh.position.set(lx, bridgeDeckElev, lz);
        if (isSelected) {
          bridgeMesh.scale.set(1.35, 1.35, 1.35);
        }
        bridgeMesh.castShadow = true;
        bridgeMesh.name = `geo_bridge_${bridge.id}`;
        scene.add(bridgeMesh);

        // Support Piers
        const pierGeo = new THREE.CylinderGeometry(1.2, 1.6, bridgeDeckElev - valleyFloorElev + 2, 8);
        const pierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
        const leftPier = new THREE.Mesh(pierGeo, pierMat);
        leftPier.position.set(lx - 5, (bridgeDeckElev + valleyFloorElev) / 2, lz);
        scene.add(leftPier);

        const rightPier = new THREE.Mesh(pierGeo, pierMat);
        rightPier.position.set(lx + 5, (bridgeDeckElev + valleyFloorElev) / 2, lz);
        scene.add(rightPier);

        // Articulation Point Indicator Ring or Selection Focus Ring
        if (bridge.isArticulationPoint || isSelected) {
          const ringGeo = new THREE.TorusGeometry(isSelected ? 10 : 7.5, isSelected ? 1.2 : 0.7, 8, 24);
          ringGeo.rotateX(Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: isSelected ? 0x38bdf8 : (isSevered ? 0xf43f5e : 0xf59e0b),
            wireframe: true,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.position.set(lx, bridgeDeckElev + 1.2, lz);
          scene.add(ringMesh);
        }

        interactiveObjectsRef.current.push({
          object: bridgeMesh,
          type: 'bridge',
          data: { ...bridge, isCurrentlySevered: isSevered },
        });
      });
    }

    // 5. 3D EMERGENCY RESPONSE HUBS
    if (showFacilities3D) {
      event.responseCenters.forEach((center) => {
        const [lx, lz] = coordToLocal(center.position.lat, center.position.lng);
        const elev = (getElevationAt(lx, lz) - 220) * exaggerationScale;
        const isDispatchRoot = center.id === activeDispatchCenter.id;

        // Command Beacon Tower
        const towerGeo = new THREE.CylinderGeometry(2, 4, 18, 6);
        const towerMat = new THREE.MeshStandardMaterial({
          color: isDispatchRoot ? 0x06b6d4 : 0x3b82f6,
          roughness: 0.2,
          metalness: 0.8,
          emissive: new THREE.Color(isDispatchRoot ? 0x22d3ee : 0x1d4ed8),
          emissiveIntensity: 0.5,
        });

        const towerMesh = new THREE.Mesh(towerGeo, towerMat);
        towerMesh.position.set(lx, elev + 9, lz);
        towerMesh.castShadow = true;
        towerMesh.name = `geo_facility_${center.id}`;
        scene.add(towerMesh);

        // Radial Dispatch Radar Ring
        const radiusGeo = new THREE.RingGeometry(18, 20, 32);
        radiusGeo.rotateX(-Math.PI / 2);
        const radiusMat = new THREE.MeshBasicMaterial({
          color: isDispatchRoot ? 0x06b6d4 : 0x3b82f6,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        });
        const radiusMesh = new THREE.Mesh(radiusGeo, radiusMat);
        radiusMesh.position.set(lx, elev + 0.5, lz);
        scene.add(radiusMesh);

        interactiveObjectsRef.current.push({
          object: towerMesh,
          type: 'response',
          data: center,
        });
      });
    }

    // 6. 3D CANDIDATE POTENTIALLY ISOLATED COMMUNITIES
    if (showIsolated3D) {
      event.candidateIsolatedAreas.forEach((area) => {
        const [lx, lz] = coordToLocal(area.position.lat, area.position.lng);
        const elev = (getElevationAt(lx, lz) - 220) * exaggerationScale;
        const isIso = area.isIsolated;
        const isSelected = selectedFeatureId === area.id;

        // Floating Alert Octahedron Beacon
        const beaconGeo = new THREE.OctahedronGeometry(isSelected ? 9.5 : 6, 0);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xffffff : (isIso ? 0xf43f5e : 0x10b981),
          roughness: 0.15,
          metalness: 0.5,
          emissive: new THREE.Color(isSelected ? 0x38bdf8 : (isIso ? 0xe11d48 : 0x059669)),
          emissiveIntensity: isSelected ? 1.2 : 0.7,
        });

        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(lx, elev + 16, lz);
        beaconMesh.name = `geo_isolated_${area.id}`;
        scene.add(beaconMesh);

        // Ground anchor line
        const anchorGeo = new THREE.CylinderGeometry(isSelected ? 0.8 : 0.4, isSelected ? 0.8 : 0.4, 16, 6);
        const anchorMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0x38bdf8 : (isIso ? 0xf43f5e : 0x10b981),
          transparent: true,
          opacity: isSelected ? 0.95 : 0.7,
        });
        const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
        anchorMesh.position.set(lx, elev + 8, lz);
        scene.add(anchorMesh);

        // Selection Aura Torus Ring
        if (isSelected) {
          const auraGeo = new THREE.TorusGeometry(14, 1.2, 8, 24);
          auraGeo.rotateX(Math.PI / 2);
          const auraMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
          });
          const auraMesh = new THREE.Mesh(auraGeo, auraMat);
          auraMesh.position.set(lx, elev + 16, lz);
          scene.add(auraMesh);
        }

        interactiveObjectsRef.current.push({
          object: beaconMesh,
          type: 'isolated',
          data: area,
        });
      });
    }

    // 7. 3D EVACUATION ROUTE PATHS
    if (showRoutes3D) {
      event.candidateIsolatedAreas.forEach((area) => {
        if (area.pathGeometry && area.pathGeometry.length > 1) {
          const routePoints: THREE.Vector3[] = [];
          area.pathGeometry.forEach(([lat, lng]) => {
            const [lx, lz] = coordToLocal(lat, lng);
            const elev = (getElevationAt(lx, lz) - 220) * exaggerationScale + 1.8;
            routePoints.push(new THREE.Vector3(lx, elev, lz));
          });

          const curve = new THREE.CatmullRomCurve3(routePoints);
          const tubeGeo = new THREE.TubeGeometry(curve, routePoints.length * 6, 0.8, 6, false);
          const routeMat = new THREE.MeshBasicMaterial({
            color: area.isIsolated ? 0xf43f5e : 0x06b6d4,
            wireframe: area.isIsolated,
            transparent: true,
            opacity: 0.85,
          });

          const routeMesh = new THREE.Mesh(tubeGeo, routeMat);
          routeMesh.name = `geo_route_${area.id}`;
          scene.add(routeMesh);
        }
      });
    }
  }, [
    event,
    scenario,
    threshold,
    weights,
    activeDispatchCenter,
    verticalExaggeration,
    waterLevelOffset,
    showTerrainMesh,
    showWaterSurface,
    showRoads3D,
    showBridges3D,
    showFacilities3D,
    showIsolated3D,
    showRoutes3D,
    waterOpacity,
    selectedFeatureId,
  ]);

  // Mouse / Touch Orbit Controls Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    cameraSphericalRef.current.theta -= deltaX * 0.008;
    cameraSphericalRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI / 2.05, cameraSphericalRef.current.phi - deltaY * 0.008)
    );

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(
      90,
      Math.min(850, cameraSphericalRef.current.radius + e.deltaY * 0.4)
    );
    updateCameraPosition();
  };

  // Raycast Click Selection
  const handleClick = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);
    const candidateMeshes = interactiveObjectsRef.current.map((item) => item.object);
    const intersects = raycasterRef.current.intersectObjects(candidateMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const matched = interactiveObjectsRef.current.find((item) => item.object === hitMesh);
      if (matched) {
        onSelectFeature(matched.type as any, matched.data);
      }
    }
  };

  // Camera Presets
  const setPreset = (preset: 'isometric' | 'valley' | 'topdown') => {
    setCameraPreset(preset);
    if (preset === 'isometric') {
      cameraSphericalRef.current = { radius: 420, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    } else if (preset === 'valley') {
      cameraSphericalRef.current = { radius: 240, theta: 0.1, phi: Math.PI / 2.3 };
    } else if (preset === 'topdown') {
      cameraSphericalRef.current = { radius: 480, theta: 0.0, phi: 0.15 };
    }
    updateCameraPosition();
  };

  // Export 3D View Canvas Snapshot to PNG
  const handleExport3DPNG = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const link = document.createElement('a');
    link.download = `${event.id}_3d_digital_twin_${timestamp}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full min-h-[540px] bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
      />

      {/* Top Left: 3D Scientific Status & Vertical Exaggeration Indicator */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-lg text-xs space-y-2 pointer-events-auto max-w-[280px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px]">
            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
            3D Elevation & Inundation
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.5 rounded">
            DEM: USGS 3DEP
          </span>
        </div>

        {/* Vertical Exaggeration Control with Explicit Safety Label */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Vertical Exaggeration:</span>
            <span className="font-mono text-cyan-400 font-bold">{(verticalExaggeration ?? 2.0).toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.5"
            step="0.1"
            value={verticalExaggeration ?? 2.0}
            onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value) || 2.0)}
            className="w-full accent-cyan-400 cursor-pointer h-1"
          />
          <div className="text-[10px] text-amber-300 font-medium">
            Visual aid only — not physical building/terrain height.
          </div>
        </div>

        {/* Estimated Flood Depth Simulation Offset */}
        <div className="space-y-1 pt-1 border-t border-slate-800">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Estimated Water Level Offset:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {(waterLevelOffset ?? 0) >= 0 ? `+${(waterLevelOffset ?? 0).toFixed(1)}` : (waterLevelOffset ?? 0).toFixed(1)} m
            </span>
          </div>
          <input
            type="range"
            min="-2.0"
            max="4.0"
            step="0.5"
            value={waterLevelOffset ?? 0.0}
            onChange={(e) => setWaterLevelOffset(parseFloat(e.target.value) || 0.0)}
            className="w-full accent-cyan-400 cursor-pointer h-1"
          />
          <div className="text-[10px] text-slate-500">
            Hydraulic flood crest simulation along valley floor.
          </div>
        </div>
      </div>

      {/* Camera Presets Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow-lg flex items-center gap-1 text-xs">
        <button
          onClick={() => setPreset('isometric')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            cameraPreset === 'isometric' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Isometric View
        </button>
        <button
          onClick={() => setPreset('valley')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            cameraPreset === 'valley' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Valley Hollow Oblique
        </button>
        <button
          onClick={() => setPreset('topdown')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            cameraPreset === 'topdown' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
        >
          Top-Down Ortho
        </button>
        <button
          onClick={() => {
            cameraSphericalRef.current = { radius: 420, theta: Math.PI / 4, phi: Math.PI / 3 };
            updateCameraPosition();
          }}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-1"
          title="Reset Camera"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <span className="text-slate-700 mx-0.5">|</span>

        {/* Auto-Orbit Briefing Mode */}
        <button
          onClick={() => {
            const next = !isAutoRotating;
            setIsAutoRotating(next);
            isAutoRotatingRef.current = next;
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            isAutoRotating ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
          title="Toggle smooth automated 360° orbit flyover for emergency briefings"
        >
          {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>Auto-Orbit</span>
        </button>

        {/* 3D PNG Export Snapshot */}
        <button
          onClick={handleExport3DPNG}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Export high-resolution 3D Digital Twin snapshot PNG"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Snap 3D</span>
        </button>
      </div>

      {/* Top Right: 3D Layer Visibility HUD */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-lg text-xs space-y-2 max-w-[210px] pointer-events-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          3D Layers
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Mountain className="w-3 h-3 text-slate-400" />
              DEM Topography Mesh
            </span>
            <input
              type="checkbox"
              checked={!!showTerrainMesh}
              onChange={(e) => setShowTerrainMesh(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Waves className="w-3 h-3 text-cyan-400" />
              Flood Inundation Surface
            </span>
            <input
              type="checkbox"
              checked={!!showWaterSurface}
              onChange={(e) => setShowWaterSurface(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400"></span>
              3D Road Ribbons
            </span>
            <input
              type="checkbox"
              checked={!!showRoads3D}
              onChange={(e) => setShowRoads3D(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-cyan-400"></span>
              3D Bridge Decks
            </span>
            <input
              type="checkbox"
              checked={!!showBridges3D}
              onChange={(e) => setShowBridges3D(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Response Hub Towers
            </span>
            <input
              type="checkbox"
              checked={!!showFacilities3D}
              onChange={(e) => setShowFacilities3D(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Isolated Beacons
            </span>
            <input
              type="checkbox"
              checked={!!showIsolated3D}
              onChange={(e) => setShowIsolated3D(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 border-dashed"></span>
              3D Route Corridors
            </span>
            <input
              type="checkbox"
              checked={!!showRoutes3D}
              onChange={(e) => setShowRoutes3D(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>
        </div>

        {/* Water Opacity Slider */}
        <div className="pt-2 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Water Translucency</span>
            <span className="font-mono">{((waterOpacity ?? 0.75) * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="0.95"
            step="0.05"
            value={waterOpacity ?? 0.75}
            onChange={(e) => setWaterOpacity(parseFloat(e.target.value) || 0.75)}
            className="w-full accent-cyan-400 cursor-pointer h-1"
          />
        </div>
      </div>

      {/* Persistent, Context-Aware, Collapsible 3D Symbology Legend */}
      <Terrain3DLegend
        showTerrainMesh={showTerrainMesh}
        setShowTerrainMesh={setShowTerrainMesh}
        showWaterSurface={showWaterSurface}
        setShowWaterSurface={setShowWaterSurface}
        showRoads3D={showRoads3D}
        setShowRoads3D={setShowRoads3D}
        showBridges3D={showBridges3D}
        setShowBridges3D={setShowBridges3D}
        showFacilities3D={showFacilities3D}
        setShowFacilities3D={setShowFacilities3D}
        showIsolated3D={showIsolated3D}
        setShowIsolated3D={setShowIsolated3D}
        showRoutes3D={showRoutes3D}
        setShowRoutes3D={setShowRoutes3D}
        verticalExaggeration={verticalExaggeration}
        waterLevelOffset={waterLevelOffset}
        waterOpacity={waterOpacity}
        eventId={event.id}
      />

      {/* Bottom Center 3D Navigation Guide */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-400 shadow-lg hidden lg:flex items-center gap-5">
        <span className="flex items-center gap-1.5">
          <strong className="text-white font-mono">Left Click + Drag:</strong> Rotate & Orbit
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1.5">
          <strong className="text-white font-mono">Mouse Wheel:</strong> Zoom In / Out
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1.5">
          <strong className="text-white font-mono">Click Feature:</strong> Deep Inspection
        </span>
      </div>

      {/* Bottom Right: Operational Disclaimer */}
      <div className="absolute bottom-4 right-4 z-20 bg-amber-950/80 border border-amber-900/60 rounded-lg px-3 py-1.5 text-[10px] text-amber-200/90 flex items-center gap-1.5 shadow-lg max-w-[280px]">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>3D visualization is an analytical rendering. Depth is estimated; field verification required.</span>
      </div>
    </div>
  );
};
