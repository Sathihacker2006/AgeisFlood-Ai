import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Key,
  Globe,
  Layers,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Terminal,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface MapConfigHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapConfigHelpModal: React.FC<MapConfigHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'watermarks' | 'providers' | 'env' | 'snippets'>('watermarks');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const tileProviders = [
    {
      name: 'CartoDB Dark Matter (Current Active)',
      type: 'Dark Theme Vector-Raster XYZ',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      requiresKey: false,
      watermarkRisk: 'None (Keyless CDN)',
      recommendedFor: 'Night mode, GIS overlays, disaster response HUDs',
      attributionNote: 'No token or credit card required. Subdomains: a, b, c, d.',
    },
    {
      name: 'CartoDB Positron (High-Contrast Light)',
      type: 'Light Theme XYZ',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      requiresKey: false,
      watermarkRisk: 'None (Keyless CDN)',
      recommendedFor: 'Print reports, high-glare field tablets',
      attributionNote: 'Free public tier with no watermark injection.',
    },
    {
      name: 'OpenStreetMap Standard (OSM)',
      type: 'Global Crowdsourced Cartography',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      requiresKey: false,
      watermarkRisk: 'None (User-Agent header required by OSM policy)',
      recommendedFor: 'Base topology verification and reference validation',
      attributionNote: 'Requires standard OpenStreetMap attribution in metadata.',
    },
    {
      name: 'USGS National Map & 3DEP Hillshade',
      type: 'Public Domain Elevation / Topo',
      url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
      requiresKey: false,
      watermarkRisk: 'None (US Federal Public Domain)',
      recommendedFor: 'High-precision Appalachian / River Basin contours',
      attributionNote: 'Direct ArcGIS REST endpoint without API tokens.',
    },
    {
      name: 'Self-Hosted PMTiles / TiTiler (Enterprise)',
      type: 'Cloud-Optimized GeoTIFF & Vector Tiles',
      url: 'https://your-domain.gov/tiles/{z}/{x}/{y}.pbf',
      requiresKey: false,
      watermarkRisk: 'Zero (Completely air-gapped / sovereign hosting)',
      recommendedFor: 'Mission-critical emergency operations center intranet',
      attributionNote: 'Zero external dependencies or telemetry.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Map Tile & API Architecture Guide
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Watermark-Free
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                How to configure keyless GIS tiles, avoid watermark flags, and deploy clean emergency maps.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('watermarks')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'watermarks'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Watermark Prevention
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'providers'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Keyless Tile Providers
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'env'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            API & Environment Setup
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'snippets'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code Snippets
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* TAB 1: Watermark Prevention */}
          {activeTab === 'watermarks' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-white text-sm">Why did the "API Key Required" watermark appear?</h3>
                  <p className="leading-relaxed text-slate-300">
                    In modern container environments and AI Studio previews, the host automatically scans repository configuration files (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">.env.example</code> and <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px]">metadata.json</code>). If these files register an API key or server-side AI capability that has not been configured in Secrets, the container automatically renders an "API key required" watermark over the app viewport.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-lg bg-slate-800/70 border border-slate-700/80 space-y-2">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    What Causes Watermarks & Banners
                  </div>
                  <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                    <li>Declaring unused <code className="text-rose-300 font-mono">GEMINI_API_KEY</code> in <code className="font-mono">.env.example</code>.</li>
                    <li>Listing <code className="text-rose-300 font-mono">MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API</code> in <code className="font-mono">metadata.json</code> when no LLM is used.</li>
                    <li>Using proprietary basemaps (e.g. Mapbox, Google Maps, MapTiler) without supplying restricted tokens.</li>
                    <li>Default Leaflet/MapLibre attribution controls rendering large overlays over mobile viewport areas.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-800/70 border border-slate-700/80 space-y-2">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Our Watermark-Free Guarantees
                  </div>
                  <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                    <li><strong className="text-slate-200">100% Keyless Architecture</strong>: CartoDB Dark Matter & USGS open CDN endpoints are used.</li>
                    <li><strong className="text-slate-200">Pruned Environment</strong>: Removed synthetic keys from <code className="font-mono">.env.example</code>.</li>
                    <li><strong className="text-slate-200">Zero Capability Flags</strong>: <code className="font-mono">metadata.json</code> set to clean empty list.</li>
                    <li><strong className="text-slate-200">Clean CSS Shield</strong>: Leaflet attribution is suppressed from canvas to ensure unobstructed operational viewing.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60 space-y-1.5">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Recommended Operational Practice
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  For official emergency deployment, keep spatial basemaps decoupled from proprietary consumer cloud accounts. Use self-hosted vector tiles (PMTiles / MBTiles) or public domain federal geospatial services (USGS, NASA, NOAA) so map services remain functional during network disruptions or API quota caps.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Keyless Tile Providers */}
          {activeTab === 'providers' && (
            <div className="space-y-3.5">
              <p className="text-slate-400">
                The following tile providers can be used in Leaflet, OpenLayers, or MapLibre GL without creating developer accounts or inserting API keys:
              </p>

              <div className="space-y-3">
                {tileProviders.map((provider, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/70 hover:border-cyan-500/50 transition-colors space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        {provider.name}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          {provider.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                        {provider.watermarkRisk}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800">
                      <span className="truncate">{provider.url}</span>
                      <button
                        onClick={() => handleCopy(provider.url, `tile-${i}`)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                        title="Copy Tile URL"
                      >
                        {copiedIndex === `tile-${i}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span><strong>Best for:</strong> {provider.recommendedFor}</span>
                      <span className="text-slate-500 italic">{provider.attributionNote}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: API & Env Configuration */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-white text-sm">How to Avoid API Key Warnings in AI Studio</h3>
                <p className="text-slate-400 leading-relaxed">
                  When creating or modifying apps in Google AI Studio Build, the system inspects root configuration files to evaluate required credentials. Follow these rules to keep the app clean:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>1. Clean `.env.example` File</span>
                    <button
                      onClick={() => handleCopy('APP_URL="MY_APP_URL"\n', 'env-clean')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                    >
                      {copiedIndex === 'env-clean' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Content
                    </button>
                  </div>
                  <p className="text-slate-400">
                    Only include variables your app actually uses. If you don't call Gemini APIs, omit <code className="font-mono text-cyan-300">GEMINI_API_KEY</code> completely.
                  </p>
                  <pre className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800">
{`# .env.example
APP_URL="MY_APP_URL"`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>2. Pruned `metadata.json` Capabilities</span>
                    <button
                      onClick={() => handleCopy('{\n  "requestFramePermissions": [],\n  "majorCapabilities": []\n}', 'meta-clean')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                    >
                      {copiedIndex === 'meta-clean' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Content
                    </button>
                  </div>
                  <p className="text-slate-400">
                    Ensure <code className="font-mono text-cyan-300">"majorCapabilities"</code> does not register server-side AI if no API key is supplied:
                  </p>
                  <pre className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800">
{`{
  "requestFramePermissions": [],
  "majorCapabilities": []
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Code Snippets */}
          {activeTab === 'snippets' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-white text-sm">Implementation Code Snippets</h3>
                <p className="text-slate-400">
                  Copy-pasteable code examples for configuring watermark-free Leaflet layers and high-resolution screenshot exports:
                </p>
              </div>

              {/* Snippet 1: Leaflet Init without Watermark */}
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Leaflet Map Initialization (Attribution Off)</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `const map = L.map(container, {
  attributionControl: false,
  zoomControl: false,
  minZoom: 9,
  maxZoom: 18,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);`,
                        'code-init'
                      )
                    }
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedIndex === 'code-init' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Code
                  </button>
                </div>
                <pre className="p-3 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800 overflow-x-auto leading-relaxed">
{`const map = L.map(container, {
  attributionControl: false, // Prevents default Leaflet watermark badge
  zoomControl: false,
  minZoom: 9,
  maxZoom: 18,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);`}
                </pre>
              </div>

              {/* Snippet 2: CSS suppression */}
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Global CSS Attribution Shield</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `.leaflet-control-attribution {
  display: none !important;
}`,
                        'code-css'
                      )
                    }
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedIndex === 'code-css' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy CSS
                  </button>
                </div>
                <pre className="p-3 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800 overflow-x-auto leading-relaxed">
{`/* src/index.css */
.leaflet-control-attribution {
  display: none !important;
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>AegisFlood AI is configured for 100% keyless open-access spatial operations.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
