import random
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from matplotlib.colors import TwoSlopeNorm

from service.simulation.model import build_unet, load_samples, to_tensor

checkpoint_path = Path(__file__).resolve().parent / "checkpoints"
samples_path = Path(__file__).resolve().parent / "data" / "data_samples.pkl"

model = build_unet()
model.load_weights(checkpoint_path / "epoch_02.weights.h5")

samples = load_samples(samples_path)

def predict(image):
    return model.predict(image)


def visualize_triplet(ndvi_tile: np.ndarray, lst_true: np.ndarray, lst_pred: np.ndarray) -> None:
    ndvi_min, ndvi_max = np.nanmin(ndvi_tile), np.nanmax(ndvi_tile)
    ndvi_span = max(abs(ndvi_min), abs(ndvi_max)) or 1e-6

    lst_stack = np.stack([lst_true, lst_pred], axis=0)
    lst_span = max(abs(np.nanmin(lst_stack)), abs(np.nanmax(lst_stack))) or 1e-6

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))

    im0 = axes[0].imshow(
        ndvi_tile,
        cmap="RdBu",
        norm=TwoSlopeNorm(vmin=-ndvi_span, vcenter=0, vmax=ndvi_span),
    )
    axes[0].set_title(f"NDVI Δ\nmin={ndvi_min:.3f}, max={ndvi_max:.3f}")
    axes[0].axis("off")
    fig.colorbar(im0, ax=axes[0], fraction=0.046, pad=0.04, label="NDVI Δ")

    im1 = axes[1].imshow(
        lst_true,
        cmap="RdBu_r",
        norm=TwoSlopeNorm(vmin=-lst_span, vcenter=0, vmax=lst_span),
    )
    axes[1].set_title(
        f"LST Δ (expected)\nmin={np.nanmin(lst_true):.2f}, max={np.nanmax(lst_true):.2f}"
    )
    axes[1].axis("off")
    fig.colorbar(im1, ax=axes[1], fraction=0.046, pad=0.04, label="Temp Δ (°C)")

    im2 = axes[2].imshow(
        lst_pred,
        cmap="RdBu_r",
        norm=TwoSlopeNorm(vmin=-lst_span, vcenter=0, vmax=lst_span),
    )
    axes[2].set_title(
        f"LST Δ (predicted)\nmin={np.nanmin(lst_pred):.2f}, max={np.nanmax(lst_pred):.2f}"
    )
    axes[2].axis("off")
    fig.colorbar(im2, ax=axes[2], fraction=0.046, pad=0.04, label="Temp Δ (°C)")

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    random_sample = random.choice(samples)

    input_data = to_tensor([random_sample], "ndvi_delta")
    expected_output = to_tensor([random_sample], "lst_delta")

    start_time = time.time()
    predicted_output = predict(input_data)
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    
    print(f"Input data shape: {input_data.shape} min: {np.min(input_data)} max: {np.max(input_data)} mean: {np.mean(input_data)}")
    print(f"Predicted output shape: {predicted_output.shape} min: {np.min(predicted_output)} max: {np.max(predicted_output)} mean: {np.mean(predicted_output)}")
    print(f"Expected output shape: {expected_output.shape} min: {np.min(expected_output)} max: {np.max(expected_output)} mean: {np.mean(expected_output)}")

    ndvi_tile = np.squeeze(input_data, axis=(0, 3))
    lst_expected_tile = np.squeeze(expected_output, axis=(0, 3))
    lst_pred_tile = np.squeeze(predicted_output, axis=(0, 3))

    visualize_triplet(ndvi_tile, lst_expected_tile, lst_pred_tile)

    