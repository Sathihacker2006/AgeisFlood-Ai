/**
 * Real-Time Weather, Doppler Precipitation Radar & Basin Heatmap Service
 * Integrates RainViewer Open Radar Tile API, Open-Meteo Atmospheric Telemetry,
 * and Basin Hydro-Meteorological Isohyet & Gauge Modeling.
 */
import { Coordinate, FloodEventStudyArea } from '../types/flood';

export interface RadarFrame {
  time: number;
  path: string;
  formattedTime: string;
  isNowcast?: boolean;
}

export interface RainViewerData {
  host: string;
  frames: RadarFrame[];
  latestFrame: RadarFrame | null;
  generatedTimestamp: number;
}

export interface LiveAtmosphericTelemetry {
  timestamp: string;
  precipitationMmPerHour: number;
  relativeHumidityPercent: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherDescription: string;
  floodPrecipitationRisk: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  dataSource: 'LIVE_API' | 'LOCAL_MODEL';
}

export interface RainGaugeStation {
  id: string;
  name: string;
  code: string;
  position: Coordinate;
  elevationMeters: number;
  basinName: string;
  currentRateMmPerHour: number;
  accumulation1hMm: number;
  accumulation6hMm: number;
  accumulation24hMm: number;
  stageStatus: 'Normal' | 'Advisory' | 'Warning' | 'Flash Flood Emergency';
  soilSaturationPercent: number;
  streamName: string;
}

export interface PrecipitationHeatmapBand {
  id: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  intensityMmPerHour: number;
  reflectivityDbz: number;
  color: string;
  label: string;
}

/**
 * Weather code descriptions following WMO standards
 */
export function getWmoWeatherDescription(code: number): string {
  if (code === 0) return 'Clear Skies';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog & Depositing Rime';
  if (code >= 51 && code <= 55) return 'Light to Dense Drizzle';
  if (code >= 61 && code <= 65) return 'Rain: Slight to Heavy';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snow Fall & Grains';
  if (code >= 80 && code <= 82) return 'Rain Showers: Violent / Torrential';
  if (code >= 95 && code <= 99) return 'Severe Thunderstorm with Hail';
  return 'Precipitation / Overcast';
}

/**
 * Evaluates flood precipitation risk based on real-time rainfall rate and humidity
 */
export function evaluatePrecipitationRisk(rainMm: number, humidity: number): 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' {
  if (rainMm >= 15 || (rainMm >= 8 && humidity >= 90)) return 'CRITICAL';
  if (rainMm >= 5 || (rainMm >= 2 && humidity >= 85)) return 'HIGH';
  if (rainMm > 0.5 || humidity >= 80) return 'ELEVATED';
  return 'LOW';
}

/**
 * Generates synthetic radar frames for reliable offline/fallback operation
 */
function generateFallbackRadarFrames(): RadarFrame[] {
  const now = Math.floor(Date.now() / 1000);
  const frames: RadarFrame[] = [];
  // 8 frames spaced 10 mins apart
  for (let i = 7; i >= 0; i--) {
    const time = now - i * 600;
    const date = new Date(time * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const mins = date.getUTCMinutes().toString().padStart(2, '0');
    frames.push({
      time,
      path: `/v2/radar/${time}`,
      formattedTime: `${hours}:${mins} UTC`,
      isNowcast: false,
    });
  }
  return frames;
}

/**
 * Fetches real-time RainViewer radar frame sequence with graceful fallback
 */
export async function fetchRainViewerRadar(): Promise<RainViewerData> {
  const fallbackFrames = generateFallbackRadarFrames();
  const fallbackResult: RainViewerData = {
    host: 'https://tilecache.rainviewer.com',
    frames: fallbackFrames,
    latestFrame: fallbackFrames[fallbackFrames.length - 1],
    generatedTimestamp: Date.now(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackResult;
    }
    const data = await response.json();
    const host = data.host || 'https://tilecache.rainviewer.com';

    const frames: RadarFrame[] = [];

    if (Array.isArray(data.radar?.past)) {
      data.radar.past.forEach((item: { time: number; path: string }) => {
        const date = new Date(item.time * 1000);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const mins = date.getUTCMinutes().toString().padStart(2, '0');
        frames.push({
          time: item.time,
          path: item.path,
          formattedTime: `${hours}:${mins} UTC`,
          isNowcast: false,
        });
      });
    }

    if (Array.isArray(data.radar?.nowcast)) {
      data.radar.nowcast.forEach((item: { time: number; path: string }) => {
        const date = new Date(item.time * 1000);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const mins = date.getUTCMinutes().toString().padStart(2, '0');
        frames.push({
          time: item.time,
          path: item.path,
          formattedTime: `${hours}:${mins} UTC (Forecast)`,
          isNowcast: true,
        });
      });
    }

    if (frames.length === 0) {
      return fallbackResult;
    }

    return {
      host,
      frames,
      latestFrame: frames[frames.length - 1],
      generatedTimestamp: data.generated || Date.now(),
    };
  } catch (_e) {
    return fallbackResult;
  }
}

/**
 * Builds tile URL template for Leaflet
 */
export function buildRainViewerTileUrl(
  host: string,
  path: string,
  colorScheme: number = 2,
  smooth: boolean = true,
  snow: boolean = true
): string {
  const smoothParam = smooth ? '1' : '0';
  const snowParam = snow ? '1' : '0';
  return `${host}${path}/256/{z}/{x}/{y}/${colorScheme}/${smoothParam}_${snowParam}.png`;
}

/**
 * Fetches real-time localized atmospheric telemetry from Open-Meteo with fallback
 */
export async function fetchLiveStudyAreaAtmosphere(
  lat: number,
  lng: number
): Promise<LiveAtmosphericTelemetry> {
  const fallbackTelemetry: LiveAtmosphericTelemetry = {
    timestamp: new Date().toISOString(),
    precipitationMmPerHour: 2.8,
    relativeHumidityPercent: 88,
    windSpeedKmh: 18.5,
    weatherCode: 63,
    weatherDescription: 'Moderate Continuous Rain',
    floodPrecipitationRisk: 'ELEVATED',
    dataSource: 'LOCAL_MODEL',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(
      4
    )}&current=precipitation,rain,weather_code,wind_speed_10m,relative_humidity_2m&forecast_days=1`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackTelemetry;
    }

    const data = await response.json();
    const current = data.current || {};
    const precipMm = typeof current.precipitation === 'number' ? current.precipitation : (current.rain || 0);
    const humidity = current.relative_humidity_2m || 75;
    const wind = current.wind_speed_10m || 12;
    const code = current.weather_code || 0;

    return {
      timestamp: current.time || new Date().toISOString(),
      precipitationMmPerHour: parseFloat(precipMm.toFixed(2)),
      relativeHumidityPercent: Math.round(humidity),
      windSpeedKmh: parseFloat(wind.toFixed(1)),
      weatherCode: code,
      weatherDescription: getWmoWeatherDescription(code),
      floodPrecipitationRisk: evaluatePrecipitationRisk(precipMm, humidity),
      dataSource: 'LIVE_API',
    };
  } catch (_e) {
    return fallbackTelemetry;
  }
}

/**
 * Generates spatial precipitation heatmap bands/isohyets across the study area.
 * Mode:
 * - 'live': Scaled to real-time telemetry from Open-Meteo
 * - 'peak': Historic peak cloudburst deluge corresponding to the disaster event
 * - 'forecast': 1-hour convective nowcast projection
 */
export function generateStudyAreaPrecipitationHeatmap(
  event: FloodEventStudyArea,
  liveRateMmH: number = 0,
  mode: 'live' | 'peak' | 'forecast' = 'live'
): PrecipitationHeatmapBand[] {
  const bands: PrecipitationHeatmapBand[] = [];
  const cLat = event.center.lat;
  const cLng = event.center.lng;

  // Base intensity factor depending on mode
  let baseIntensity = liveRateMmH;
  if (mode === 'peak') {
    baseIntensity = event.id.includes('houston') ? 68.5 : event.id.includes('italy') ? 48.0 : 54.2;
  } else if (mode === 'forecast') {
    baseIntensity = Math.max(8.5, liveRateMmH * 1.5 + 4.0);
  } else {
    // If live rate is near zero (e.g. sunny today), provide light baseline convective simulation so the heatmap layer is clearly legible
    baseIntensity = Math.max(1.8, liveRateMmH);
  }

  // Study area specific cell anchor offsets
  const cellOffsets = [
    { dLat: 0.005, dLng: 0.008, mult: 1.0, rad: 3800, label: 'Primary Convective Core' },
    { dLat: -0.015, dLng: -0.012, mult: 0.85, rad: 4500, label: 'Upstream Basin Inflow' },
    { dLat: 0.022, dLng: -0.004, mult: 0.70, rad: 4200, label: 'Northern Drainage Ridge' },
    { dLat: -0.028, dLng: 0.018, mult: 0.55, rad: 5200, label: 'Tributary Fluvial Band' },
    { dLat: 0.035, dLng: 0.025, mult: 0.40, rad: 6000, label: 'Peripheral Rainband' },
  ];

  cellOffsets.forEach((offset, idx) => {
    const intensity = parseFloat((baseIntensity * offset.mult).toFixed(1));
    // Calculate dBZ reflectivity using Marshall-Palmer relation: Z = 200 * R^1.6 => dBZ = 10 * log10(Z)
    const z = 200 * Math.pow(Math.max(0.1, intensity), 1.6);
    const dbz = Math.round(10 * Math.log10(z));

    let color = '#38bdf8'; // light blue / cyan (< 2.5 mm/h)
    if (intensity >= 40) {
      color = '#e11d48'; // torrential deep red / magenta
    } else if (intensity >= 20) {
      color = '#f97316'; // extreme orange / red
    } else if (intensity >= 10) {
      color = '#eab308'; // heavy yellow
    } else if (intensity >= 4) {
      color = '#22c55e'; // moderate green
    }

    bands.push({
      id: `precip-band-${event.id}-${idx}`,
      centerLat: cLat + offset.dLat,
      centerLng: cLng + offset.dLng,
      radiusMeters: offset.rad,
      intensityMmPerHour: intensity,
      reflectivityDbz: dbz,
      color,
      label: `${offset.label} (${intensity} mm/h, ${dbz} dBZ)`,
    });
  });

  return bands;
}

/**
 * Returns localized hydro-meteorological rain gauge telemetry stations for the study area
 */
export function getStudyAreaRainGauges(
  event: FloodEventStudyArea,
  liveRateMmH: number = 2.5,
  mode: 'live' | 'peak' = 'live'
): RainGaugeStation[] {
  const isPeak = mode === 'peak';
  const cLat = event.center.lat;
  const cLng = event.center.lng;

  if (event.id.includes('kentucky')) {
    return [
      {
        id: 'gauge-ky-01',
        name: 'USGS 03280000 Troublesome Creek at Noble, KY',
        code: 'TCKY-01',
        position: { lat: cLat + 0.012, lng: cLng - 0.015 },
        elevationMeters: 268,
        basinName: 'Troublesome Creek Hollow Sub-basin',
        currentRateMmPerHour: isPeak ? 62.4 : Math.max(1.2, parseFloat((liveRateMmH * 1.3).toFixed(1))),
        accumulation1hMm: isPeak ? 58.0 : 8.4,
        accumulation6hMm: isPeak ? 192.0 : 26.2,
        accumulation24hMm: isPeak ? 368.5 : 42.0,
        stageStatus: isPeak ? 'Flash Flood Emergency' : liveRateMmH > 5 ? 'Warning' : 'Advisory',
        soilSaturationPercent: isPeak ? 99 : 84,
        streamName: 'Troublesome Creek',
      },
      {
        id: 'gauge-ky-02',
        name: 'USGS 03277500 North Fork Kentucky River at Jackson, KY',
        code: 'NFKY-02',
        position: { lat: cLat + 0.055, lng: cLng + 0.005 },
        elevationMeters: 224,
        basinName: 'North Fork Kentucky River Basin',
        currentRateMmPerHour: isPeak ? 48.0 : Math.max(0.8, parseFloat((liveRateMmH * 0.9).toFixed(1))),
        accumulation1hMm: isPeak ? 44.5 : 6.1,
        accumulation6hMm: isPeak ? 154.0 : 21.0,
        accumulation24hMm: isPeak ? 312.0 : 35.5,
        stageStatus: isPeak ? 'Flash Flood Emergency' : 'Normal',
        soilSaturationPercent: isPeak ? 96 : 79,
        streamName: 'North Fork Kentucky River',
      },
      {
        id: 'gauge-ky-03',
        name: 'NWS Buckhorn Lake Tailwater Station #4',
        code: 'BHLK-03',
        position: { lat: cLat - 0.045, lng: cLng - 0.035 },
        elevationMeters: 310,
        basinName: 'Buckhorn Spillway & Middle Fork',
        currentRateMmPerHour: isPeak ? 52.8 : Math.max(1.0, parseFloat((liveRateMmH * 1.1).toFixed(1))),
        accumulation1hMm: isPeak ? 49.0 : 7.2,
        accumulation6hMm: isPeak ? 168.0 : 24.0,
        accumulation24hMm: isPeak ? 342.0 : 38.8,
        stageStatus: isPeak ? 'Flash Flood Emergency' : 'Normal',
        soilSaturationPercent: isPeak ? 98 : 82,
        streamName: 'Buckhorn Tailwaters',
      },
      {
        id: 'gauge-ky-04',
        name: 'Mesonet Hazard Airport Automated Station (KCPF)',
        code: 'HAZD-04',
        position: { lat: cLat - 0.065, lng: cLng + 0.040 },
        elevationMeters: 382,
        basinName: 'Perry County Ridge Automated Network',
        currentRateMmPerHour: isPeak ? 39.5 : Math.max(0.5, parseFloat((liveRateMmH * 0.8).toFixed(1))),
        accumulation1hMm: isPeak ? 36.0 : 4.8,
        accumulation6hMm: isPeak ? 122.0 : 17.5,
        accumulation24hMm: isPeak ? 255.0 : 29.0,
        stageStatus: isPeak ? 'Warning' : 'Normal',
        soilSaturationPercent: isPeak ? 92 : 72,
        streamName: 'Carr Creek Tributary',
      },
    ];
  } else if (event.id.includes('houston')) {
    return [
      {
        id: 'gauge-htx-01',
        name: 'USGS 08074000 Buffalo Bayou at Shepherd Dr, Houston',
        code: 'BBTX-01',
        position: { lat: cLat + 0.015, lng: cLng - 0.025 },
        elevationMeters: 12,
        basinName: 'Buffalo Bayou Watershed',
        currentRateMmPerHour: isPeak ? 74.0 : Math.max(1.5, parseFloat((liveRateMmH * 1.4).toFixed(1))),
        accumulation1hMm: isPeak ? 71.0 : 9.5,
        accumulation6hMm: isPeak ? 310.0 : 32.0,
        accumulation24hMm: isPeak ? 740.0 : 58.0,
        stageStatus: isPeak ? 'Flash Flood Emergency' : 'Advisory',
        soilSaturationPercent: isPeak ? 100 : 85,
        streamName: 'Buffalo Bayou',
      },
      {
        id: 'gauge-htx-02',
        name: 'HCFCD Gage 1600 Brays Bayou at Main Street',
        code: 'BRTX-02',
        position: { lat: cLat - 0.030, lng: cLng + 0.010 },
        elevationMeters: 15,
        basinName: 'Brays Bayou Drainage Network',
        currentRateMmPerHour: isPeak ? 68.5 : Math.max(1.1, parseFloat((liveRateMmH * 1.0).toFixed(1))),
        accumulation1hMm: isPeak ? 65.0 : 7.8,
        accumulation6hMm: isPeak ? 285.0 : 28.0,
        accumulation24hMm: isPeak ? 680.0 : 49.0,
        stageStatus: isPeak ? 'Flash Flood Emergency' : 'Normal',
        soilSaturationPercent: isPeak ? 99 : 80,
        streamName: 'Brays Bayou',
      },
      {
        id: 'gauge-htx-03',
        name: 'USGS 08073600 White Oak Bayou at Heights Blvd',
        code: 'WOTX-03',
        position: { lat: cLat + 0.040, lng: cLng + 0.020 },
        elevationMeters: 18,
        basinName: 'White Oak Bayou Basin',
        currentRateMmPerHour: isPeak ? 62.0 : Math.max(0.9, parseFloat((liveRateMmH * 0.9).toFixed(1))),
        accumulation1hMm: isPeak ? 59.0 : 6.5,
        accumulation6hMm: isPeak ? 260.0 : 24.5,
        accumulation24hMm: isPeak ? 620.0 : 42.0,
        stageStatus: isPeak ? 'Flash Flood Emergency' : 'Normal',
        soilSaturationPercent: isPeak ? 97 : 78,
        streamName: 'White Oak Bayou',
      },
    ];
  } else {
    // Italy or generic default
    return [
      {
        id: 'gauge-it-01',
        name: 'ARPAE Stazione Idrometrica Fiume Lamone a Faenza',
        code: 'LAM-01',
        position: { lat: cLat + 0.010, lng: cLng - 0.010 },
        elevationMeters: 35,
        basinName: 'Bacino Idrografico Fiume Lamone',
        currentRateMmPerHour: isPeak ? 55.0 : Math.max(1.4, parseFloat((liveRateMmH * 1.2).toFixed(1))),
        accumulation1hMm: isPeak ? 51.0 : 8.0,
        accumulation6hMm: isPeak ? 180.0 : 25.0,
        accumulation24hMm: isPeak ? 350.0 : 45.0,
        stageStatus: isPeak ? 'Flash Flood Emergency' : 'Advisory',
        soilSaturationPercent: isPeak ? 98 : 83,
        streamName: 'Fiume Lamone',
      },
      {
        id: 'gauge-it-02',
        name: 'ARPAE Monitoraggio Idrografico Fiume Montone (Forlì)',
        code: 'MON-02',
        position: { lat: cLat - 0.025, lng: cLng + 0.020 },
        elevationMeters: 42,
        basinName: 'Bacino Idrografico Fiume Montone',
        currentRateMmPerHour: isPeak ? 46.5 : Math.max(0.9, parseFloat((liveRateMmH * 0.8).toFixed(1))),
        accumulation1hMm: isPeak ? 43.0 : 6.0,
        accumulation6hMm: isPeak ? 155.0 : 20.0,
        accumulation24hMm: isPeak ? 295.0 : 38.0,
        stageStatus: isPeak ? 'Warning' : 'Normal',
        soilSaturationPercent: isPeak ? 95 : 79,
        streamName: 'Fiume Montone',
      },
    ];
  }
}
