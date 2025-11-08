import base64
import io
import json
from typing import List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
from flask import Blueprint, jsonify, request, session
from matplotlib.colors import TwoSlopeNorm
from pathlib import Path

from service.imagery.session_store import get_session_data
from service.simulation.model import build_unet, to_tensor


simulate_bp = Blueprint("simulate", __name__, url_prefix="/simulate")

weights_path = (
    Path(__file__).resolve().parent.parent
    / "simulation"
    / "checkpoints"
    / "epoch_06.weights.h5"
)
model = build_unet()
model.load_weights(weights_path)
print(f"Model loaded from {weights_path}")


def _validate_query_params() -> Tuple[Optional[List[str]], Optional[List[float]], Optional[List[float]]]:
    payload = request.get_json(silent=True) or {}

    point_types = payload.get("types")
    point_latitudes = payload.get("lats")
    point_longitudes = payload.get("lons")

    if not isinstance(point_types, list) or not isinstance(point_latitudes, list) or not isinstance(point_longitudes, list):
        return None, None, None

    try:
        point_types = [str(v).strip() for v in point_types if str(v).strip()]
        point_latitudes = [float(v) for v in point_latitudes]
        point_longitudes = [float(v) for v in point_longitudes]
    except (TypeError, ValueError):
        return None, None, None

    if not point_types or not point_latitudes or not point_longitudes:
        return None, None, None

    return point_types, point_latitudes, point_longitudes


@simulate_bp.route("", methods=["POST"], strict_slashes=False)
def simulate():
    point_types, point_latitudes, point_longitudes = _validate_query_params()

    if point_types is None or point_latitudes is None or point_longitudes is None:
        return jsonify({"error": "Missing required query parameters: types, lats, lons"}), 400

    session_id = session.get("session_id")
    if not session_id:
        return jsonify({"error": "Session ID not found"}), 400

    session_data = get_session_data(session_id)

    if session_data is None:
        return jsonify({"error": "Session data not found"}), 400
    if "heat_map" not in session_data:
        return jsonify({"error": "Session data not found"}), 400
    if "data" not in session_data["heat_map"]:
        return jsonify({"error": "Heat map data not found"}), 400

    heat_map = session_data["heat_map"]["data"]
    bbox = session_data["heat_map"]["bbox"]
    heat_shape = heat_map.shape

    ndvi_delta = np.zeros(heat_shape, dtype=np.float32)
    lon_min, lat_min, lon_max, lat_max = bbox

    for point_type, point_latitude, point_longitude in zip(
        point_types, point_latitudes, point_longitudes
    ):
        col = (point_longitude - lon_min) / (lon_max - lon_min) * heat_shape[1]
        row = (lat_max - point_latitude) / (lat_max - lat_min) * heat_shape[0]

        row = int(np.clip(row, 0, heat_shape[0] - 1))
        col = int(np.clip(col, 0, heat_shape[1] - 1))

        print(f"Shape: {heat_shape} Row: {row} Col: {col}")

        if point_type == "trees":
            ndvi_delta[row, col] += 0.3
        elif point_type == "shrubs":
            ndvi_delta[row, col] += 0.15
        elif point_type == "grass":
            ndvi_delta[row, col] += 0.05
        elif point_type == "buildings":
            ndvi_delta[row, col] -= 0.3
        elif point_type == "roads":
            ndvi_delta[row, col] -= 0.15
        elif point_type == "waterbodies":
            ndvi_delta[row, col] -= 0.9

        ndvi_delta[row, col] = np.clip(ndvi_delta[row, col], -2, 2)

    tile_size = 128
    stride = 64

    padded_rows = int(np.ceil(ndvi_delta.shape[0] / stride) * stride + (tile_size - stride))
    padded_cols = int(np.ceil(ndvi_delta.shape[1] / stride) * stride + (tile_size - stride))

    padded_ndvi = np.zeros((padded_rows, padded_cols), dtype=np.float32)
    padded_ndvi[: ndvi_delta.shape[0], : ndvi_delta.shape[1]] = ndvi_delta

    heat_delta = np.zeros_like(padded_ndvi, dtype=np.float32)
    heat_weights = np.zeros_like(padded_ndvi, dtype=np.float32)

    for row in range(0, padded_rows - tile_size + 1, stride):
        for col in range(0, padded_cols - tile_size + 1, stride):
            ndvi_chunk = padded_ndvi[row : row + tile_size, col : col + tile_size]
            chunk_tensor = to_tensor([{"ndvi_delta": ndvi_chunk}], "ndvi_delta")
            predicted_chunk = model.predict(chunk_tensor, verbose=0)
            predicted_chunk = np.squeeze(predicted_chunk, axis=(0, 3))

            heat_delta[row : row + tile_size, col : col + tile_size] += predicted_chunk
            heat_weights[row : row + tile_size, col : col + tile_size] += 1.0

    heat_weights = np.where(heat_weights == 0, 1.0, heat_weights)
    heat_delta = heat_delta / heat_weights
    heat_delta = heat_delta[: ndvi_delta.shape[0], : ndvi_delta.shape[1]]

    heat_min = float(np.nanmin(heat_delta))
    heat_max = float(np.nanmax(heat_delta))

    heat_delta = np.where(heat_delta < 0, heat_delta * 20, heat_delta)

    new_heat_map = heat_map + heat_delta

    heat_vmin = float(np.nanmin([np.nanmin(heat_map), np.nanmin(new_heat_map)]))
    heat_vmax = float(np.nanmax([np.nanmax(heat_map), np.nanmax(new_heat_map)]))

    fig_heat, ax_heat = plt.subplots(figsize=(6, 5))
    im_new = ax_heat.imshow(new_heat_map, cmap="inferno", vmin=heat_vmin, vmax=heat_vmax)
    ax_heat.axis("off")

    buffer = io.BytesIO()
    plt.tight_layout(pad=0)
    fig_heat.savefig(buffer, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig_heat)
    buffer.seek(0)
    heat_map_base64 = base64.b64encode(buffer.read()).decode("utf-8")

    return jsonify({"heat_map_image": heat_map_base64}), 200
