/**
 * AI Remote Sensing & Flood Segmentation Datasets Benchmark
 * Detailed technical specifications, download protocols, label encoding, and Python scripts
 */

export interface DatasetSpec {
  id: string;
  name: string;
  citation: string;
  sensors: string[];
  bands: string[];
  imageResolutionMeters: number;
  totalChipsCount: number;
  chipDimensionsPixels: string;
  geographicEventsCount: number;
  geographicLocations: string[];
  labelEncoding: { [key: string]: string };
  license: string;
  downloadProtocol: string;
  downloadCommands: string[];
  advantages: string[];
  disadvantages: string[];
  suitabilityForPrototype: 'RECOMMENDED_FIRST_CHOICE' | 'HIGH_FIDELITY_ALTERNATIVE' | 'OPTICAL_BENCHMARK' | 'CHANGE_DETECTION_SPECIALTY';
  recommendedSplitMethod: string;
}

export const FLOOD_DATASETS: DatasetSpec[] = [
  {
    id: 'sen1floods11',
    name: 'Sen1Floods11: A Georeferenced Dataset for Deep Learning Flood Detection',
    citation: 'Bonafilia, D., Tellman, B., Anderson, T., & Issenberg, E. (2020). Sen1Floods11: A georeferenced dataset to train and test deep learning flood algorithms for Sentinel-1. CVPR Workshops.',
    sensors: ['Sentinel-1 C-band SAR (GRD IW)', 'Sentinel-2 MSI Optical'],
    bands: ['S1: VV, VH, VV/VH ratio (dB calibrated)', 'S2: 13 optical bands (B1–B12, B8A)'],
    imageResolutionMeters: 10.0,
    totalChipsCount: 4831,
    chipDimensionsPixels: '512 x 512 GeoTIFF',
    geographicEventsCount: 11,
    geographicLocations: [
      'Bolivia (Moxos)',
      'Cambodia (Mekong)',
      'Ghana (White Volta)',
      'India (Bihar)',
      'Pakistan (Sindh)',
      'Paraguay (Paraguay River)',
      'Somalia (Shabelle)',
      'Spain (Ebro)',
      'Sri Lanka (Kelani)',
      'USA (Midwest 2019 Floods)',
      'Vietnam (Mekong Delta)'
    ],
    labelEncoding: {
      '-1': 'NoData / Cloud Mask / Out of bounds',
      '0': 'Non-Water / Land / Unflooded infrastructure',
      '1': 'Water / Inundated surface (Hand-labeled ground truth)'
    },
    license: 'CC-BY-4.0 (Open Access / Scientific & Operational use)',
    downloadProtocol: 'Google Cloud Storage (Public Access) or GitHub official repo',
    downloadCommands: [
      '# Option A: Download via Google Cloud Storage CLI (Recommended, fast)',
      'gsutil -m cp -r gs://sen1floods11/v1.1/data/flood_events/HandLabeled/S1Hand ./data/raw/S1Hand',
      'gsutil -m cp -r gs://sen1floods11/v1.1/data/flood_events/HandLabeled/LabelHand ./data/raw/LabelHand',
      '',
      '# Option B: Download via Python urllib / requests directly from Cloud to Street mirror',
      'python -c "import urllib.request; urllib.request.urlretrieve(\'https://storage.googleapis.com/sen1floods11/v1.1/splits/flood_handlabeled/flood_train_data.csv\', \'./data/metadata/train_split.csv\')"'
    ],
    advantages: [
      'Contains perfectly paired Sentinel-1 SAR and Sentinel-2 optical imagery with georeferenced GeoTIFF headers (EPSG and affine transforms).',
      'Includes 446 rigorously hand-labeled chips curated by human remote-sensing analysts across 11 diverse eco-regions.',
      'Pre-computed geographic splits (Train / Val / Test) explicitly split by geographic event to prevent spatial auto-correlation and data leakage.',
      'SAR microwave penetrates all cloud cover and rainstorms, enabling true 24/7 disaster response.'
    ],
    disadvantages: [
      'Sentinel-1 10m spatial resolution makes narrow sub-lane roads (<5m) difficult to resolve without spatial interpolation.',
      'SAR speckle noise requires despeckling (Refined Lee filter or temporal filtering).'
    ],
    suitabilityForPrototype: 'RECOMMENDED_FIRST_CHOICE',
    recommendedSplitMethod: 'Geographic split by event (e.g. Train on Bolivia, Cambodia, India, USA; Validate on Spain, Sri Lanka; Test on Pakistan, Vietnam) to guarantee real-world out-of-distribution evaluation.'
  },
  {
    id: 'floodnet',
    name: 'FloodNet: High-Resolution UAS Dataset for Flood Impact Assessment',
    citation: 'Rahnemoonfar, M., et al. (2021). FloodNet: A High Resolution Aerial Imagery Dataset for Post Flood Scene Understanding. IEEE Access.',
    sensors: ['UAS / Drone High-Resolution Optical RGB'],
    bands: ['Red (Band 1)', 'Green (Band 2)', 'Blue (Band 3)'],
    imageResolutionMeters: 0.015, // 1.5 cm/pixel
    totalChipsCount: 2343,
    chipDimensionsPixels: '4000 x 3000 high-res frames',
    geographicEventsCount: 1,
    geographicLocations: ['Texas & Louisiana Gulf Coast (Hurricane Harvey impact)'],
    labelEncoding: {
      '0': 'Background',
      '1': 'Flooded Road',
      '2': 'Non-Flooded Road',
      '3': 'Flooded Building',
      '4': 'Non-Flooded Building',
      '5': 'Water Pool'
    },
    license: 'Custom Academic Research License (Free registration required)',
    downloadProtocol: 'IEEE DataPort / Google Drive registration portal',
    downloadCommands: [
      '# Register at IEEE DataPort (FloodNet challenge)',
      'curl -L -o floodnet_v1.zip "https://ieee-dataport.org/open-access/floodnet-high-resolution-aerial-imagery-dataset"'
    ],
    advantages: [
      'Centimeter-scale resolution allows direct classification of road condition and passable roadway lanes.',
      'Explicit road and bridge semantic classes separated into flooded vs non-flooded segments.'
    ],
    disadvantages: [
      'Drone flights cannot operate in high winds, rain, or thick fog during the active storm phase.',
      'Restricted geographic coverage limited to several flight tracks along the Texas coast.'
    ],
    suitabilityForPrototype: 'HIGH_FIDELITY_ALTERNATIVE',
    recommendedSplitMethod: 'Flight track spatial partition to avoid overlapping frames.'
  },
  {
    id: 'worldfloods',
    name: 'WorldFloods: Global Sentinel-2 Optical Flood Benchmark',
    citation: 'Mateo-Garcia, G., et al. (2021). Towards global flood mapping on-board low Earth orbit satellites. Scientific Reports, Nature.',
    sensors: ['Sentinel-2 MSI Optical L1C / L2A'],
    bands: ['12 spectral bands (RGB, NIR B8, SWIR B11, SWIR B12, NDWI, MNDWI)'],
    imageResolutionMeters: 10.0,
    totalChipsCount: 1198,
    chipDimensionsPixels: 'Large multi-patch scenes',
    geographicEventsCount: 119,
    geographicLocations: ['119 global flood events across 5 continents'],
    labelEncoding: {
      '0': 'Land / Non-water',
      '1': 'Permanent water bodies',
      '2': 'Flooded vegetation / Inundated surface',
      '3': 'Cloud / Shadow (Invalid)'
    },
    license: 'CC-BY-SA-4.0',
    downloadProtocol: 'Zenodo Archive / Google Cloud Storage',
    downloadCommands: [
      'wget https://zenodo.org/record/4636906/files/worldfloods_v0_sample.tar.gz',
      'tar -xzf worldfloods_v0_sample.tar.gz'
    ],
    advantages: [
      'Rich multi-spectral information allows calculation of NDWI ((Green-NIR)/(Green+NIR)) and MNDWI ((Green-SWIR)/(Green+SWIR)).',
      'Substantial event diversity (119 events).'
    ],
    disadvantages: [
      'Optical sensors CANNOT image through cloud cover. Over 75% of flood scenes in WorldFloods contain severe cloud obstruction.'
    ],
    suitabilityForPrototype: 'OPTICAL_BENCHMARK',
    recommendedSplitMethod: 'Event-based holdout.'
  }
];

export const PYTHON_ENVIRONMENT_YAML = `# ==============================================================================
# AegisFlood Conda Environment Specification
# File: environment.yml
# ==============================================================================
name: flood-ai
channels:
  - conda-forge
  - pytorch
  - defaults
dependencies:
  - python=3.10.13
  - pytorch=2.2.0
  - torchvision=0.17.0
  - pytorch-cuda=12.1   # Omit or replace with cpuonly if no NVIDIA GPU
  # Core Geospatial Libraries (Pin via conda-forge to ensure GDAL PROJ compatibility)
  - gdal=3.8.3
  - rasterio=1.3.9
  - geopandas=0.14.2
  - shapely=2.0.2
  - pyproj=3.6.1
  - fiona=1.9.5
  # Network & Graph Analysis
  - networkx=3.2.1
  - osmnx=1.9.1
  - scipy=1.12.0
  # Data Science & Computer Vision
  - numpy=1.26.3
  - pandas=2.2.0
  - opencv=4.9.0
  - albumentations=1.3.1
  - matplotlib=3.8.2
  - tqdm=4.66.1
  - pip:
    - segmentation-models-pytorch==0.3.3
    - tifffile==2024.1.30
`;

export const VERIFICATION_PYTHON_SCRIPT = `"""
AegisFlood Platform - Phase 1 Dataset Verification Script
File: scripts/01_verify_dataset.py

Objective:
1. Verify geospatial environment (GDAL, Rasterio, PyTorch, GeoPandas).
2. Load one real Sentinel-1 SAR GeoTIFF chip and its matching ground-truth mask.
3. Validate GeoTIFF metadata: CRS (EPSG), affine transform, nodata values, shape.
4. Convert SAR raw linear power to calibrated decibels (dB): 10 * log10(DN).
5. Compute class imbalance ratio (water pixels vs land pixels).
6. Render verification figure comparing SAR backscatter with ground-truth mask.
"""

import os
import sys
import numpy as np
import rasterio
from rasterio.plot import show
import matplotlib.pyplot as plt

def verify_single_sample(image_path: str, mask_path: str, output_plot_path: str = "verification_output.png"):
    print("=" * 70)
    print("AEGISFLOOD DATASET VERIFICATION & PROVENANCE INSPECTOR")
    print("=" * 70)
    
    # 1. Check file existence
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Satellite image not found: {image_path}")
    if not os.path.exists(mask_path):
        raise FileNotFoundError(f"Flood mask not found: {mask_path}")
        
    print(f"[+] Found Image: {os.path.basename(image_path)}")
    print(f"[+] Found Mask:  {os.path.basename(mask_path)}\\n")
    
    # 2. Inspect Satellite GeoTIFF
    with rasterio.open(image_path) as src_img:
        print("[1] SATELLITE IMAGE METADATA:")
        print(f"    - Driver:           {src_img.driver}")
        print(f"    - Raster Shape:     {src_img.height} rows x {src_img.width} cols")
        print(f"    - Band Count:       {src_img.count}")
        print(f"    - Data Types:       {src_img.dtypes}")
        print(f"    - Coordinate System (CRS): {src_img.crs}")
        print(f"    - Pixel Resolution: {src_img.res[0]:.2f}m x {src_img.res[1]:.2f}m")
        print(f"    - Affine Transform: \\n{src_img.transform}\\n")
        
        # Read bands: Sen1Floods11 SAR Band 1 = VV, Band 2 = VH
        img_array = src_img.read() # Shape: (bands, height, width)
        vv_band = img_array[0].astype(np.float32)
        vh_band = img_array[1].astype(np.float32) if src_img.count >= 2 else vv_band
        
    # 3. Inspect Flood Mask GeoTIFF
    with rasterio.open(mask_path) as src_mask:
        print("[2] GROUND TRUTH FLOOD MASK METADATA:")
        print(f"    - Raster Shape:     {src_mask.height} x {src_mask.width}")
        print(f"    - Mask Data Type:   {src_mask.dtypes[0]}")
        print(f"    - Mask CRS:         {src_mask.crs}")
        
        mask_array = src_mask.read(1) # Read 2D mask
        
    # 4. Check spatial alignment invariant
    assert (src_img.height, src_img.width) == mask_array.shape, "Shape mismatch between image and mask!"
    assert src_img.crs == src_mask.crs, "CRS mismatch between image and mask! Reprojection required."
    print("    - Spatial Alignment Check: PASSED (Shapes and CRS strictly aligned)\\n")
    
    # 5. Physics & Statistical Inspection (SAR dB calibration)
    # Clip extreme values and convert linear backscatter to dB if uncalibrated
    # dB = 10 * log10(DN + eps)
    eps = 1e-7
    vv_db = 10.0 * np.log10(np.clip(vv_band, eps, None))
    vh_db = 10.0 * np.log10(np.clip(vh_band, eps, None))
    
    # Normalize dB to [0, 1] for neural network input: min-max scaling (-30 dB to 0 dB)
    vv_norm = np.clip((vv_db - (-30.0)) / (0.0 - (-30.0)), 0.0, 1.0)
    vh_norm = np.clip((vh_db - (-35.0)) / (-5.0 - (-35.0)), 0.0, 1.0)
    ratio_norm = np.clip(vv_norm / (vh_norm + 0.05), 0.0, 1.0)
    
    # Stack into 3-channel pseudo-RGB composite for visualization and U-Net input
    sar_composite = np.stack([vv_norm, vh_norm, ratio_norm], axis=-1)
    
    # 6. Label Statistics & Class Imbalance
    unique_vals, counts = np.unique(mask_array, return_counts=True)
    val_dict = dict(zip(unique_vals.tolist(), counts.tolist()))
    total_valid_pixels = sum(counts[unique_vals >= 0])
    water_pixels = val_dict.get(1, 0)
    land_pixels = val_dict.get(0, 0)
    nodata_pixels = val_dict.get(-1, 0)
    
    water_ratio = (water_pixels / total_valid_pixels) * 100.0 if total_valid_pixels > 0 else 0.0
    
    print("[3] LABEL DISTRIBUTION & CLASS IMBALANCE:")
    print(f"    - Unique label values: {unique_vals}")
    print(f"    - Non-water (0) pixels: {land_pixels:,} ({100.0 - water_ratio:.2f}%)")
    print(f"    - Water/Flood (1) pixels: {water_pixels:,} ({water_ratio:.2f}%)")
    print(f"    - NoData (-1) pixels:     {nodata_pixels:,}")
    print(f"    - Inundation Imbalance:  1 : {land_pixels / max(1, water_pixels):.1f} (Land to Water ratio)\\n")
    
    # 7. Visualization Plot
    fig, axes = plt.subplots(1, 3, figsize=(15, 5), dpi=150)
    
    # Panel A: VV Backscatter
    im0 = axes[0].imshow(vv_db, cmap="gray", vmin=-25, vmax=-5)
    axes[0].set_title(f"Sentinel-1 VV Backscatter (dB)\\nMean: {np.mean(vv_db):.1f} dB", fontsize=11)
    plt.colorbar(im0, ax=axes[0], fraction=0.046, pad=0.04, label="sigma0 (dB)")
    
    # Panel B: False-Color SAR Composite (VV, VH, VV/VH)
    axes[1].imshow(sar_composite)
    axes[1].set_title("SAR 3-Band Composite\\nR: VV, G: VH, B: VV/VH", fontsize=11)
    
    # Panel C: Ground Truth Mask
    cmap_mask = plt.matplotlib.colors.ListedColormap(['#1e293b', '#38bdf8'])
    im2 = axes[2].imshow(mask_array, cmap=cmap_mask, vmin=0, vmax=1)
    axes[2].set_title(f"Ground Truth Flood Mask\\nWater Coverage: {water_ratio:.1f}%", fontsize=11)
    plt.colorbar(im2, ax=axes[2], fraction=0.046, pad=0.04, ticks=[0, 1], label="0: Land, 1: Water")
    
    plt.tight_layout()
    plt.savefig(output_plot_path, bbox_inches="tight")
    print(f"[SUCCESS] Verification plot written to {output_plot_path}")
    print("=" * 70)

if __name__ == "__main__":
    # Test file paths
    sample_img = "./data/raw/S1Hand/Bolivia_103757_S1Hand.tif"
    sample_mask = "./data/raw/LabelHand/Bolivia_103757_LabelHand.tif"
    
    if os.path.exists(sample_img) and os.path.exists(sample_mask):
        verify_single_sample(sample_img, sample_mask)
    else:
        print("[!] Target sample not found locally. Run the gsutil download command first.")
        print(f"    Expected: {sample_img}")
`;

export const PROJECT_DIRECTORY_TREE = `flood-connectivity-platform/
├── configs/
│   ├── dataset_config.yaml         # Dataset paths, band mappings, CRS specifications
│   ├── model_unet_baseline.yaml    # U-Net architecture, hyperparams, batch size
│   └── network_analysis.yaml       # Road graph speed limits, flood impedance penalties
│
├── data/
│   ├── raw/                        # Original raw GeoTIFF tiles from ESA/GCS
│   │   ├── S1Hand/                 # Sentinel-1 SAR chips (VV, VH)
│   │   ├── S2Hand/                 # Sentinel-2 optical chips
│   │   └── LabelHand/              # Ground truth binary masks
│   ├── processed/                  # Preprocessed, cropped, normalized patches (512x512)
│   ├── osm_infrastructure/         # OpenStreetMap GeoJSON / PBF road & bridge networks
│   └── metadata/                   # Geographic split CSVs (train, val, test)
│
├── src/
│   ├── preprocessing/
│   │   ├── __init__.py
│   │   ├── sar_calibration.py      # Radiometric calibration & speckle filtering (Lee/Frost)
│   │   ├── optical_ndwi.py         # Cloud masking & NDWI/MNDWI calculation
│   │   └── patch_generator.py      # Overlapping tiling, CRS reprojection
│   │
│   ├── segmentation/
│   │   ├── __init__.py
│   │   ├── unet_baseline.py        # PyTorch U-Net with ResNet-34 encoder
│   │   ├── attention_unet.py       # Attention gates for boundary delineation
│   │   ├── losses.py               # Combined BCE + Dice Loss, Focal Tversky Loss
│   │   └── metrics.py              # IoU, Dice/F1, Precision, Recall, PR-AUC
│   │
│   ├── training/
│   │   ├── dataset.py              # PyTorch Dataset & DataLoader with Albumentations
│   │   ├── train.py                # Distributed training loop with early stopping
│   │   └── evaluate.py             # Geographic test evaluation & spatial error maps
│   │
│   ├── geospatial/
│   │   ├── vectorization.py        # Raster flood probability -> GeoJSON polygons
│   │   ├── geodesic_area.py        # Geodesic area calculation (EPSG:3857/UTM projection)
│   │   └── infrastructure_overlay.py # Spatial join between road lines & flood polygons
│   │
│   └── network/
│       ├── graph_builder.py        # OSMnx road network graph construction (G=(V, E))
│       ├── bridge_criticality.py   # Articulation points & edge betweenness centrality
│       ├── connectivity_engine.py  # Dijkstra with flood penalty & unreachable node detection
│       └── isolated_candidates.py  # Candidate potentially isolated community identification
│
├── scripts/
│   ├── 01_verify_dataset.py        # Step 1: Load and plot first GeoTIFF sample
│   ├── 02_train_baseline.py        # Step 2: Execute training run
│   └── 03_run_network_pipeline.py  # Step 3: End-to-end GIS network analysis
│
├── tests/
│   ├── test_geospatial.py          # Coordinate reprojection & polygon integrity tests
│   └── test_network_graph.py       # Articulation point & shortest path graph tests
│
├── environment.yml                 # Conda environment definition
├── requirements.txt                # Pip requirements fallback
└── README.md                       # Comprehensive system architecture & usage guide
`;
