import React, { useState } from 'react';
import {
  FLOOD_DATASETS,
  PYTHON_ENVIRONMENT_YAML,
  VERIFICATION_PYTHON_SCRIPT,
  PROJECT_DIRECTORY_TREE,
} from '../data/datasetsInfo';
import { Database, Terminal, CheckCircle2, Copy, Check, FileCode, FolderTree, AlertCircle, Compass, Sparkles } from 'lucide-react';

export const DatasetExplorer: React.FC = () => {
  const [selectedDatasetId, setSelectedDatasetId] = useState('sen1floods11');
  const [activeCodeTab, setActiveCodeTab] = useState<'script' | 'env' | 'tree'>('script');
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedDataset = FLOOD_DATASETS.find((d) => d.id === selectedDatasetId) || FLOOD_DATASETS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200 space-y-6">
      {/* Section 50 Focus Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          Section 50 — AI Dataset Selection, Inspection & Environment Verification
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          Remote Sensing Flood Datasets & Phase 1 Execution Protocol
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-4xl">
          Before implementing neural network architectures, we establish rigorous data provenance. Below is the multi-dataset
          benchmarking analysis, our recommended choice for the first prototype, the exact tensor specifications, project directory structure,
          and a verified Python inspection script to load and inspect real satellite GeoTIFFs.
        </p>
      </div>

      {/* Dataset Selection Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {FLOOD_DATASETS.map((ds) => {
          const isSelected = ds.id === selectedDatasetId;
          return (
            <div
              key={ds.id}
              onClick={() => setSelectedDatasetId(ds.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400">
                    {ds.sensors.join(' · ')}
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-0.5">{ds.name.split(':')[0]}</h3>
                </div>
                {ds.suitabilityForPrototype === 'RECOMMENDED_FIRST_CHOICE' && (
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                    ★ Recommended
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Spatial Res</span>
                  <span className="font-mono text-white">{ds.imageResolutionMeters} m / pixel</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Chips</span>
                  <span className="font-mono text-white">{ds.totalChipsCount.toLocaleString()} chips</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Dimensions</span>
                  <span className="font-mono text-white">{ds.chipDimensionsPixels}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Events</span>
                  <span className="font-mono text-white">{ds.geographicEventsCount} global events</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Dataset In-Depth Specification Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-cyan-400">
              Dataset In-Depth Specification & Rationale
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">{selectedDataset.name}</h3>
            <p className="text-xs text-slate-400 mt-1 italic">{selectedDataset.citation}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">License</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">{selectedDataset.license}</span>
          </div>
        </div>

        {/* Advantage & Disadvantage Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Key Scientific Advantages
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedDataset.advantages.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              Technical Limitations & Mitigation
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedDataset.disadvantages.map((dis, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5 font-bold">!</span>
                  <span>{dis}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ground Truth Label Encoding Table & Download Protocol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Ground-Truth Mask Pixel Encoding
            </div>
            <div className="space-y-1.5">
              {Object.entries(selectedDataset.labelEncoding).map(([code, meaning]) => (
                <div key={code} className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-slate-800 text-xs">
                  <span className="font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded">
                    Pixel Value: {code}
                  </span>
                  <span className="text-slate-300">{meaning}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              <strong>Split Protocol:</strong> {selectedDataset.recommendedSplitMethod}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Download Protocol & GCS Buckets
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
              {selectedDataset.downloadCommands.map((cmd, idx) => (
                <div key={idx} className={cmd.startsWith('#') ? 'text-slate-500 italic' : 'text-cyan-300'}>
                  {cmd}
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-400">
              Files are distributed as single-band and multi-band Cloud-Optimized GeoTIFFs with full geotransform headers.
            </div>
          </div>
        </div>
      </div>

      {/* Model Input / Output Mathematical Specification */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Exact Input & Output Tensor Specification for Baseline Model
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-cyan-400 uppercase">
              Tensor Input: X ∈ ℝ^(B × 3 × 512 × 512)
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>• <strong>Channel 0 (VV):</strong> Linear SAR backscatter converted to decibels: <code className="text-cyan-300">10·log₁₀(DN)</code>, normalized to [0, 1] using min-max scaling (-30 dB to 0 dB).</li>
              <li>• <strong>Channel 1 (VH):</strong> Cross-polarization backscatter in dB, scaled (-35 dB to -5 dB). Responds strongly to volume scattering from vegetation.</li>
              <li>• <strong>Channel 2 (Ratio):</strong> Cross-ratio <code className="text-cyan-300">VV / (VH + ε)</code>. Highlights specular water reflection vs rough terrain.</li>
              <li>• <strong>Spatial Dimensions:</strong> 512 rows × 512 columns at 10m Ground Sample Distance (GSD) (covers ~5.12 km × 5.12 km AOI).</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-cyan-400 uppercase">
              Tensor Output: Ŷ ∈ [0, 1]^(B × 1 × 512 × 512)
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>• <strong>Continuous Probability:</strong> Output layer uses Sigmoid activation <code className="text-cyan-300">σ(z) = 1 / (1 + e^(-z))</code> representing P(pixel is flooded water).</li>
              <li>• <strong>Binary Decision Threshold:</strong> <code className="text-cyan-300">Mask = (Ŷ &gt; τ)</code> where τ is calibrated on validation data (default τ = 0.65).</li>
              <li>• <strong>Loss Function:</strong> Combined BCE + Soft Dice Loss: <code className="text-cyan-300">ℒ = ℒ_BCE + ℒ_Dice</code> to overcome severe land-to-water class imbalance (typically 10:1).</li>
              <li>• <strong>Evaluation Metric:</strong> Jaccard Index (IoU) and Dice Coefficient (F1 score) evaluated on geographic holdout test events.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code & Directory Structure Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('script')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCodeTab === 'script'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              scripts/01_verify_dataset.py
            </button>
            <button
              onClick={() => setActiveCodeTab('env')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCodeTab === 'env'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              environment.yml
            </button>
            <button
              onClick={() => setActiveCodeTab('tree')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCodeTab === 'tree'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Project Repository Tree
            </button>
          </div>

          <button
            onClick={() => {
              if (activeCodeTab === 'script') handleCopy(VERIFICATION_PYTHON_SCRIPT);
              else if (activeCodeTab === 'env') handleCopy(PYTHON_ENVIRONMENT_YAML);
              else handleCopy(PROJECT_DIRECTORY_TREE);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 font-medium transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied!' : 'Copy File'}
          </button>
        </div>

        {/* Code Content View */}
        <div className="p-4 bg-slate-950/80 overflow-x-auto max-h-[500px]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {activeCodeTab === 'script' && VERIFICATION_PYTHON_SCRIPT}
            {activeCodeTab === 'env' && PYTHON_ENVIRONMENT_YAML}
            {activeCodeTab === 'tree' && PROJECT_DIRECTORY_TREE}
          </pre>
        </div>
      </div>
    </div>
  );
};
