import React, { useState } from 'react';
import { Cpu, Check, Layers, BarChart3, Zap, Shield, GitBranch } from 'lucide-react';

interface Architecture {
  id: string;
  name: string;
  category: 'Baseline' | 'Intermediate' | 'Advanced' | 'Transformer';
  encoder: string;
  valIoU: number;
  diceScore: number;
  precision: number;
  recall: number;
  paramCountM: number;
  gpuInferenceMs: number;
  cpuInferenceMs: number;
  advantages: string[];
  recommendedFor: string;
}

const ARCHITECTURES: Architecture[] = [
  {
    id: 'unet-resnet34',
    name: 'U-Net (ResNet-34 Encoder Baseline)',
    category: 'Baseline',
    encoder: 'Pretrained ImageNet ResNet-34',
    valIoU: 78.6,
    diceScore: 87.9,
    precision: 89.2,
    recall: 86.7,
    paramCountM: 24.4,
    gpuInferenceMs: 14.2,
    cpuInferenceMs: 142.0,
    advantages: [
      'Fast convergence and stable training on small datasets.',
      'Symmetric skip connections preserve sharp water boundaries.',
      'Minimal GPU memory footprint (easily trains with batch size 16 on 8GB VRAM).'
    ],
    recommendedFor: 'Phase 1 MVP and initial baseline benchmark'
  },
  {
    id: 'attention-unet',
    name: 'Attention U-Net (Oktay et al.)',
    category: 'Intermediate',
    encoder: 'Attention Gated Encoder-Decoder',
    valIoU: 81.4,
    diceScore: 89.7,
    precision: 91.5,
    recall: 88.0,
    paramCountM: 34.8,
    gpuInferenceMs: 18.5,
    cpuInferenceMs: 198.0,
    advantages: [
      'Attention gates suppress irrelevant background features and noise in mountain valleys.',
      'Improves detection along narrow flooded road corridors.',
      'Reduces false positives caused by wet soil and radar speckle.'
    ],
    recommendedFor: 'Complex mountainous terrain with steep topography'
  },
  {
    id: 'deeplabv3-plus',
    name: 'DeepLabV3+ (MobileNet / ResNet-50)',
    category: 'Advanced',
    encoder: 'Atrous Spatial Pyramid Pooling (ASPP)',
    valIoU: 82.8,
    diceScore: 90.6,
    precision: 92.1,
    recall: 89.2,
    paramCountM: 41.2,
    gpuInferenceMs: 22.0,
    cpuInferenceMs: 260.0,
    advantages: [
      'Multi-scale context aggregation via dilated (atrous) convolutions.',
      'Excellent performance on large water bodies and river avulsions.'
    ],
    recommendedFor: 'Broad alluvial floodplain scenarios (e.g. Houston / Mississippi)'
  },
  {
    id: 'segformer-b2',
    name: 'SegFormer-B2 (Hierarchical Transformer)',
    category: 'Transformer',
    encoder: 'Mix Transformer (MiT-B2)',
    valIoU: 84.2,
    diceScore: 91.4,
    precision: 93.0,
    recall: 89.9,
    paramCountM: 27.5,
    gpuInferenceMs: 28.4,
    cpuInferenceMs: 380.0,
    advantages: [
      'Captures long-range spatial dependencies across entire river drainage basins.',
      'Lightweight MLP decoder avoids heavy computational overhead.'
    ],
    recommendedFor: 'Production multi-modal deployment with dedicated GPU inference'
  }
];

export const ModelArchitecturesView: React.FC = () => {
  const [selectedArchId, setSelectedArchId] = useState('unet-resnet34');

  const selectedArch = ARCHITECTURES.find((a) => a.id === selectedArchId) || ARCHITECTURES[0];

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200 space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          Module B — AI Segmentation Model Architecture & Ablation Benchmarks
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          Deep Learning Segmentation Architectures & Performance Metrics
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Evaluation of convolutional and transformer-based segmentation models on Sentinel-1 SAR and multi-modal imagery.
          Prioritizes a reliable, reproducible baseline (U-Net) before progressing to attention and transformer models.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {ARCHITECTURES.map((arch) => {
          const isSelected = arch.id === selectedArchId;
          return (
            <div
              key={arch.id}
              onClick={() => setSelectedArchId(arch.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-mono text-cyan-400 uppercase">{arch.category}</div>
              <h3 className="text-sm font-bold text-white mt-0.5">{arch.name.split('(')[0]}</h3>
              <div className="text-[11px] text-slate-400 mt-1">{arch.encoder}</div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Holdout IoU:</span>
                  <span className="font-mono font-bold text-cyan-400">{arch.valIoU.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Dice / F1:</span>
                  <span className="font-mono font-bold text-emerald-400">{arch.diceScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Latency (T4 GPU):</span>
                  <span className="font-mono text-slate-200">{arch.gpuInferenceMs.toFixed(1)} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Architecture Detailed Specs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-cyan-400">
              Selected Architecture Deep-Dive
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">{selectedArch.name}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Recommended for: <strong className="text-cyan-300">{selectedArch.recommendedFor}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">Parameters</span>
              <span className="font-mono font-bold text-white text-xs">{selectedArch.paramCountM}M</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase block">CPU Latency</span>
              <span className="font-mono font-bold text-amber-400 text-xs">{selectedArch.cpuInferenceMs} ms</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 col-span-2">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Architectural Highlights & Inductive Biases
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedArch.advantages.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Performance Breakdown
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Precision:</span>
                <span className="text-cyan-400">{selectedArch.precision.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recall:</span>
                <span className="text-cyan-400">{selectedArch.recall.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dice / F1:</span>
                <span className="text-emerald-400">{selectedArch.diceScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mean IoU:</span>
                <span className="text-emerald-400">{selectedArch.valIoU.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Modality Ablation Study Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Sensor Modality Ablation Study (Section 34)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                <th className="py-2.5 px-3">Input Modality</th>
                <th className="py-2.5 px-3">Sensor Inputs</th>
                <th className="py-2.5 px-3">Cloud Robustness</th>
                <th className="py-2.5 px-3 text-right">Holdout IoU</th>
                <th className="py-2.5 px-3 text-right">Dice / F1</th>
                <th className="py-2.5 px-3">Operational Tradeoff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-white font-medium">Approach A: SAR Only</td>
                <td className="py-2.5 px-3 text-cyan-300">Sentinel-1 VV + VH (dB)</td>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">100% All-Weather</td>
                <td className="py-2.5 px-3 text-right text-cyan-400">78.6%</td>
                <td className="py-2.5 px-3 text-right text-cyan-400">87.9%</td>
                <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                  Zero cloud occlusion. Primary workhorse for real-time flood emergency response.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-medium">Optical Only</td>
                <td className="py-2.5 px-3 text-slate-300">Sentinel-2 RGB + NIR + SWIR</td>
                <td className="py-2.5 px-3 text-rose-400 font-semibold">&lt;25% (Clouds block)</td>
                <td className="py-2.5 px-3 text-right text-slate-300">82.1%</td>
                <td className="py-2.5 px-3 text-right text-slate-300">90.2%</td>
                <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                  Higher spectral contrast when clear, but completely blinded by storm clouds during active disaster.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-medium">Approach B: Multi-Modal Fusion</td>
                <td className="py-2.5 px-3 text-cyan-300">S1 (VV/VH) + S2 + DEM</td>
                <td className="py-2.5 px-3 text-amber-400 font-semibold">Graceful Degradation</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">86.8%</td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">92.9%</td>
                <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                  Highest overall accuracy. Automatically falls back to SAR-only when optical cloud probability &gt; 30%.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
