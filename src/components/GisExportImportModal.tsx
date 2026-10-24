import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  FileCode,
  Globe,
  Layers,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { FloodEventStudyArea } from '../types/flood';

interface GisExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FloodEventStudyArea;
  theme?: 'dark' | 'light';
  onImportCustomGeoJSON?: (geoJsonData: any) => void;
}

export const GisExportImportModal: React.FC<GisExportImportModalProps> = ({
  isOpen,
  onClose,
  event,
  theme = 'dark',
  onImportCustomGeoJSON,
}) => {
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'export-geojson' | 'export-kml' | 'import-geojson'>('export-geojson');
  const [selectedLayers, setSelectedLayers] = useState({
    polygons: true,
    roads: true,
    bridges: true,
    isolated: true,
    responseCenters: true,
  });
  const [hasCopied, setHasCopied] = useState(false);
  const [importedJsonText, setImportedJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Generate GeoJSON FeatureCollection
  const geoJsonData = useMemo(() => {
    const features: any[] = [];

    // Inundation Polygons
    if (selectedLayers.polygons && event.polygons) {
      event.polygons.forEach((p) => {
        features.push({
          type: 'Feature',
          id: p.id,
          properties: {
            layer: 'FloodInundation',
            name: p.name,
            areaKm2: p.areaKm2,
            perimeterKm: p.perimeterKm,
            meanFloodProbability: p.meanFloodProbability,
            confidence: p.confidence,
            maxDepthEstimateMeters: p.maxDepthEstimateMeters,
            sourceSensor: p.sourceSensor,
            satellitePlatform: event.satelliteMetadata.platform,
            polarization: event.satelliteMetadata.polarization,
          },
          geometry: {
            type: 'Polygon',
            // GeoJSON coordinates are [longitude, latitude]
            coordinates: [p.geometry.coordinates.map(([lat, lng]) => [lng, lat])],
          },
        });
      });
    }

    // Evaluated Roads
    if (selectedLayers.roads && event.roads) {
      event.roads.forEach((r) => {
        features.push({
          type: 'Feature',
          id: r.id,
          properties: {
            layer: 'RoadInfrastructure',
            osmId: r.osmId,
            name: r.name,
            classification: r.classification,
            impactCategory: r.impactCategory,
            impactScore: r.impactScore,
            affectedLengthRatio: r.affectedLengthRatio,
            totalLengthMeters: r.totalLengthMeters,
            meanFloodProbability: r.meanFloodProbability,
            maxFloodProbability: r.maxFloodProbability,
            criticalityWeight: r.criticalityWeight,
            sarBackscatterDeltaDb: r.evidence.sarBackscatterDeltaDb,
          },
          geometry: {
            type: 'LineString',
            coordinates: r.geometry.map(([lat, lng]) => [lng, lat]),
          },
        });
      });
    }

    // Bridges
    if (selectedLayers.bridges && event.bridges) {
      event.bridges.forEach((b) => {
        features.push({
          type: 'Feature',
          id: b.id,
          properties: {
            layer: 'BridgeNode',
            name: b.name,
            waterwayName: b.waterwayName,
            isArticulationPoint: b.isArticulationPoint,
            betweennessCentrality: b.betweennessCentrality,
            detourDistanceKm: b.detourDistanceKm,
            networkRedundancy: b.networkRedundancy,
            floodProbability: b.floodProbability,
          },
          geometry: {
            type: 'Point',
            coordinates: [b.position.lng, b.position.lat],
          },
        });
      });
    }

    // Isolated Communities
    if (selectedLayers.isolated && event.candidateIsolatedAreas) {
      event.candidateIsolatedAreas.forEach((ia) => {
        features.push({
          type: 'Feature',
          id: ia.id,
          properties: {
            layer: 'CandidateIsolatedCommunity',
            name: ia.name,
            communityType: ia.type,
            estimatedPopulation: ia.estimatedPopulation,
            isIsolated: ia.isIsolated,
            shortestPathDistanceKm: ia.shortestPathDistanceKm,
            requiredAssistanceMode: ia.requiredAssistanceMode,
            fieldVerificationStatus: ia.fieldVerificationStatus,
          },
          geometry: {
            type: 'Point',
            coordinates: [ia.position.lng, ia.position.lat],
          },
        });
      });
    }

    // Response Centers
    if (selectedLayers.responseCenters && event.responseCenters) {
      event.responseCenters.forEach((rc) => {
        features.push({
          type: 'Feature',
          id: rc.id,
          properties: {
            layer: 'EmergencyOperationsCenter',
            name: rc.name,
            facilityType: rc.type,
            availableUnits: rc.availableUnits,
            contactCallsign: rc.contactCallsign,
          },
          geometry: {
            type: 'Point',
            coordinates: [rc.position.lng, rc.position.lat],
          },
        });
      });
    }

    return {
      type: 'FeatureCollection',
      name: `AegisFlood_${event.id}_GIS_Export`,
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      metadata: {
        studyArea: event.name,
        date: event.eventDate,
        sensor: event.satelliteMetadata.sensor,
        crs: event.satelliteMetadata.crs,
        exportedAt: new Date().toISOString(),
        totalFeatures: features.length,
      },
      features,
    };
  }, [event, selectedLayers]);

  // Generate KML XML
  const kmlData = useMemo(() => {
    let placemarksXml = '';

    // Flood Polygons
    if (selectedLayers.polygons && event.polygons) {
      event.polygons.forEach((p) => {
        const coordsStr = p.geometry.coordinates.map(([lat, lng]) => `${lng},${lat},0`).join(' ');
        placemarksXml += `
    <Placemark>
      <name>${p.name}</name>
      <description>Area: ${p.areaKm2} sq km | Mean P: ${(p.meanFloodProbability * 100).toFixed(1)}% | Depth: ~${p.maxDepthEstimateMeters}m</description>
      <styleUrl>#floodPolygonStyle</styleUrl>
      <Polygon>
        <extrude>1</extrude>
        <altitudeMode>clampToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsStr}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
      });
    }

    // Isolated Communities
    if (selectedLayers.isolated && event.candidateIsolatedAreas) {
      event.candidateIsolatedAreas.forEach((ia) => {
        placemarksXml += `
    <Placemark>
      <name>ISOLATED: ${ia.name}</name>
      <description>Est. Pop: ${ia.estimatedPopulation} | Assistance: ${ia.requiredAssistanceMode}</description>
      <styleUrl>#isolatedPointStyle</styleUrl>
      <Point>
        <coordinates>${ia.position.lng},${ia.position.lat},0</coordinates>
      </Point>
    </Placemark>`;
      });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>AegisFlood AI - ${event.name}</name>
    <description>Sentinel-1 SAR Hydrological Flood Inundation & Infrastructure Impact Assessment</description>
    <Style id="floodPolygonStyle">
      <LineStyle>
        <color>ffd4b606</color>
        <width>2.5</width>
      </LineStyle>
      <PolyStyle>
        <color>80e07a00</color>
      </PolyStyle>
    </Style>
    <Style id="isolatedPointStyle">
      <IconStyle>
        <color>ff4f46e5</color>
        <scale>1.2</scale>
      </IconStyle>
    </Style>
    ${placemarksXml}
  </Document>
</kml>`;
  }, [event, selectedLayers]);

  if (!isOpen) return null;

  const handleCopyGeoJson = () => {
    const text = activeTab === 'export-kml' ? kmlData : JSON.stringify(geoJsonData, null, 2);
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const isKml = activeTab === 'export-kml';
    const content = isKml ? kmlData : JSON.stringify(geoJsonData, null, 2);
    const mimeType = isKml ? 'application/vnd.google-earth.kml+xml' : 'application/geo+json';
    const extension = isKml ? 'kml' : 'geojson';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisFlood_${event.id}_${activeTab === 'export-kml' ? 'GoogleEarth' : 'Layers'}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyImportedGeoJson = () => {
    try {
      const parsed = JSON.parse(importedJsonText);
      if (!parsed.type || (!parsed.features && parsed.type !== 'Feature' && parsed.type !== 'Polygon')) {
        throw new Error('Not a recognized GeoJSON Feature, FeatureCollection, or Geometry object.');
      }
      setImportStatus({
        type: 'success',
        message: `Successfully validated ${parsed.features ? parsed.features.length : 1} custom spatial features! Overlaying on active map canvas.`,
      });
      if (onImportCustomGeoJSON) {
        onImportCustomGeoJSON(parsed);
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `JSON Parse Failure: ${err?.message || 'Invalid syntax'}`,
      });
    }
  };

  const loadSampleLeveeBreachTemplate = () => {
    const sample = {
      type: 'FeatureCollection',
      name: 'Simulated_Emergency_Levee_Breach_AOI',
      features: [
        {
          type: 'Feature',
          properties: {
            hazardType: 'Synthetic Levee Failure',
            simulatedOvertoppingHeightM: 2.1,
            urgency: 'IMMEDIATE_EVACUATION',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [event.center.lng - 0.03, event.center.lat - 0.02],
                [event.center.lng + 0.02, event.center.lat - 0.025],
                [event.center.lng + 0.035, event.center.lat + 0.03],
                [event.center.lng - 0.015, event.center.lat + 0.04],
                [event.center.lng - 0.03, event.center.lat - 0.02],
              ],
            ],
          },
        },
      ],
    };
    setImportedJsonText(JSON.stringify(sample, null, 2));
    setImportStatus({ type: 'idle', message: '' });
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
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}>
                GIS Interoperability Suite
              </div>
              <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                GeoJSON & Google Earth KML Data Exporter / Ingestion
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            aria-label="Close GIS Exporter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className={`flex items-center gap-2 px-6 pt-3 border-b ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <button
            onClick={() => setActiveTab('export-geojson')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'export-geojson'
                ? isLight ? 'text-cyan-700 border-cyan-600 font-bold' : 'text-cyan-400 border-cyan-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export RFC 7946 GeoJSON</span>
          </button>
          <button
            onClick={() => setActiveTab('export-kml')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'export-kml'
                ? isLight ? 'text-cyan-700 border-cyan-600 font-bold' : 'text-cyan-400 border-cyan-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Export Google Earth KML</span>
          </button>
          <button
            onClick={() => setActiveTab('import-geojson')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'import-geojson'
                ? isLight ? 'text-cyan-700 border-cyan-600 font-bold' : 'text-cyan-400 border-cyan-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Custom GeoJSON Ingestion</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Layer Selection Checkboxes (for Exports) */}
          {activeTab !== 'import-geojson' && (
            <div className={`p-3 rounded-lg border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold uppercase tracking-wider text-[11px] ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Select Features to Include in Export:
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {geoJsonData.features.length} Features Selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLayers.polygons}
                    onChange={(e) => setSelectedLayers({ ...selectedLayers, polygons: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Flood Polygons ({event.polygons.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLayers.roads}
                    onChange={(e) => setSelectedLayers({ ...selectedLayers, roads: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Road Segments ({event.roads.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLayers.bridges}
                    onChange={(e) => setSelectedLayers({ ...selectedLayers, bridges: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Bridge Chokes ({event.bridges.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLayers.isolated}
                    onChange={(e) => setSelectedLayers({ ...selectedLayers, isolated: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>Isolated Areas ({event.candidateIsolatedAreas.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLayers.responseCenters}
                    onChange={(e) => setSelectedLayers({ ...selectedLayers, responseCenters: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  <span>EOC Stations ({event.responseCenters.length})</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Preview Area */}
          {activeTab !== 'import-geojson' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {activeTab === 'export-geojson' ? 'GeoJSON FeatureCollection Payload' : 'Google Earth KML XML Structure'}
                </span>
                <span className="font-mono">
                  {activeTab === 'export-geojson' ? `${(JSON.stringify(geoJsonData).length / 1024).toFixed(1)} KB` : `${(kmlData.length / 1024).toFixed(1)} KB`}
                </span>
              </div>
              <div className={`p-3 rounded-lg border font-mono text-[11px] max-h-[300px] overflow-y-auto select-all ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-cyan-300'
              }`}>
                <pre className="whitespace-pre-wrap">
                  {activeTab === 'export-geojson' ? JSON.stringify(geoJsonData, null, 2) : kmlData}
                </pre>
              </div>
            </div>
          ) : (
            /* Custom GeoJSON Importer Area */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Overlay Custom Hazard Extent or Simulated Breach Perimeter
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Paste or load any valid GeoJSON polygon to calculate real-time road/bridge cut intersections against the live graph.
                  </p>
                </div>
                <button
                  onClick={loadSampleLeveeBreachTemplate}
                  className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                  }`}
                >
                  Load Sample Levee Breach AOI
                </button>
              </div>

              <textarea
                value={importedJsonText}
                onChange={(e) => setImportedJsonText(e.target.value)}
                placeholder='Paste valid GeoJSON here (e.g. { "type": "FeatureCollection", "features": [...] })'
                className={`w-full h-56 font-mono text-[11px] p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              />

              {importStatus.type !== 'idle' && (
                <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                  importStatus.type === 'success'
                    ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                    : isLight ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-rose-950/30 border-rose-800 text-rose-300'
                }`}>
                  {importStatus.type === 'success' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">{importStatus.type === 'success' ? 'Validation Passed' : 'Validation Error'}</div>
                    <div className="text-[11px]">{importStatus.message}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            {activeTab !== 'import-geojson' ? (
              <>
                <button
                  onClick={handleCopyGeoJson}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors border ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{hasCopied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className={`px-3.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                    isLight
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .{activeTab === 'export-kml' ? 'kml' : 'geojson'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleApplyImportedGeoJson}
                disabled={!importedJsonText.trim()}
                className={`px-4 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 ${
                  isLight
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ingest & Render on Map</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
              isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
