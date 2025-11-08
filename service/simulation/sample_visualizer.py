import argparse
import pickle
from pathlib import Path
from typing import List, Dict, Any

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import TwoSlopeNorm


def load_samples(path: Path) -> List[Dict[str, Any]]:
    with path.open("rb") as f:
        samples = pickle.load(f)
    return samples


def visualize_sample(sample: Dict[str, Any]) -> None:
    ndvi = sample["ndvi_delta"]
    lst = sample["lst_delta"]

    ndvi_min = np.nanmin(ndvi)
    ndvi_max = np.nanmax(ndvi)
    ndvi_span = max(abs(ndvi_min), abs(ndvi_max))
    if ndvi_span == 0:
        ndvi_span = 1e-6

    lst_min = np.nanmin(lst)
    lst_max = np.nanmax(lst)
    lst_span = max(abs(lst_min), abs(lst_max))
    if lst_span == 0:
        lst_span = 1e-6

    fig, axes = plt.subplots(1, 2, figsize=(12, 6))

    im0 = axes[0].imshow(ndvi, cmap="RdBu", norm=TwoSlopeNorm(vmin=-ndvi_span, vcenter=0, vmax=ndvi_span))
    axes[0].set_title(
        f"NDVI Δ ({sample['asset_date_1']} → {sample['asset_date_2']})\n"
        f"min={ndvi_min:.3f}, max={ndvi_max:.3f}"
    )
    axes[0].axis("off")
    cbar0 = fig.colorbar(im0, ax=axes[0], fraction=0.046, pad=0.04)
    cbar0.set_label("NDVI Δ (unitless)")

    im1 = axes[1].imshow(lst, cmap="RdBu_r", norm=TwoSlopeNorm(vmin=-lst_span, vcenter=0, vmax=lst_span))
    axes[1].set_title(
        f"LST Δ ({sample['asset_date_1']} → {sample['asset_date_2']})\n"
        f"min={lst_min:.2f}°C, max={lst_max:.2f}°C"
    )
    axes[1].axis("off")
    cbar1 = fig.colorbar(im1, ax=axes[1], fraction=0.046, pad=0.04)
    cbar1.set_label("Temp Δ (°C)")

    vegetation_phase = sample["vegetation_phase"]
    row_start = sample["row_start"]
    col_start = sample["col_start"]

    fig.suptitle(
        f"Vegetation phase: {vegetation_phase}\n"
        f"Chunk origin: row {row_start}, col {col_start}",
        y=0.95,
    )

    plt.tight_layout()
    plt.show()


def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize NDVI and LST delta samples.")
    parser.add_argument(
        "--path",
        type=Path,
        default=None,
        help="Path to pickled samples file. Defaults to <module_dir>/data/data_samples.pkl",
    )
    parser.add_argument(
        "--index",
        type=int,
        default=0,
        help="Index of the sample to visualize.",
    )
    args = parser.parse_args()

    default_path = Path(__file__).resolve().parent / "data" / "data_samples.pkl"
    samples_path = args.path or default_path

    if not samples_path.exists():
        raise FileNotFoundError(f"Samples file not found at {samples_path}")

    samples = load_samples(samples_path)

    if not samples:
        raise ValueError("No samples found in the provided file.")

    # Randomly select a sample
    index = np.random.randint(0, len(samples))
    sample = samples[index]

    visualize_sample(sample)


if __name__ == "__main__":
    main()

