import pickle
import time
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

import numpy as np
import planetary_computer as pc
from pystac_client import Client

from service.imagery.sat_extract import convert_to_celsius, geocode_city, load_band

catalog = Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=pc.sign_inplace
)

cities = [
    "Brampton, ON, Canada",
    "Mississauga, ON, Canada",
    "Oakville, ON, Canada",
    "Hamilton, ON, Canada",
    "Toronto, ON, Canada",
    "Vaughan, ON, Canada",
    "Markham, ON, Canada",
    "Richmond Hill, ON, Canada",
    "Hamilton, ON, Canada",
]

vegetation_phases = [
    "dormant-spring",
    "green-up",
    "peak-growth",
    "senescence",
    "dormant-winter",
]

def get_vegetation_phase(month):
    if month in [11, 12, 1, 2]:
        return "dormant-winter"
    elif month in [3, 4]:
        return "dormant-spring"
    elif month in [5, 6]:
        return "green-up"
    elif month in [7, 8]:
        return "peak-growth"
    elif month in [9, 10]:
        return "senescence"

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_PATH = DATA_DIR / "data_samples_checkpoint.pkl"
FINAL_PATH = DATA_DIR / "data_samples.pkl"
CHECKPOINT_INTERVAL = 100


def load_existing_samples() -> List[Dict[str, Any]]:
    existing_path = CHECKPOINT_PATH if CHECKPOINT_PATH.exists() else FINAL_PATH

    if existing_path.exists():
        print(f"Loading existing samples from {existing_path}")
        with existing_path.open("rb") as f:
            return pickle.load(f)
    return []


def save_samples(samples: List[Dict[str, Any]], path: Path, label: str) -> None:
    with path.open("wb") as f:
        pickle.dump(samples, f)
    print(f"[{label}] Saved {len(samples)} samples to {path}")


def sample_key(sample: Dict[str, Any]) -> Tuple[str, str, str, str, int, int]:
    city1 = sample.get("city_1") or sample.get("city") or ""
    city2 = sample.get("city_2") or sample.get("city") or ""
    return (
        city1,
        city2,
        sample["asset_date_1"],
        sample["asset_date_2"],
        sample["row_start"],
        sample["col_start"],
    )


ndvi_heat_pairs: List[Dict[str, Any]] = []
data_samples: List[Dict[str, Any]] = load_existing_samples()
existing_keys: Set[Tuple[str, str, str, str, int, int]] = {
    sample_key(sample) for sample in data_samples
}
samples_since_checkpoint = 0

chunk_size = 128
half_chunk = chunk_size // 2

for city in cities:
    bbox = None
    while not bbox:
        try:
            bbox = geocode_city(city)
        except Exception as e:
            print(f"Error geocoding city {city}: {e}")
            time.sleep(1)

    search = catalog.search(
        collections=["landsat-c2-l2"],
        bbox=bbox,
        datetime=f"2015-01-01/2025-12-31",
        query={
            "eo:cloud_cover": {"lt": 10},
        },
    )

    items = list(search.item_collection())
    good_images = 0

    print(f"Found {len(items)} items for {city}")

    for idx, item in enumerate(items):

        print(f"{idx+1}/{len(items)} ({good_images} good images)", end="\r")

        red, profile_red, red_asset = load_band(
            item, "red", bbox, apply_scale=True, nodata_value=None, verbose=False
        )
        if red is None or np.isnan(red).any():
            continue
        
        nir, profile_nir, nir_asset = load_band(
            item, "nir08", bbox, apply_scale=True, nodata_value=None, verbose=False
        )
        if nir is None or np.isnan(nir).any():
            continue

        heat_dn, profile_heat, heat_asset = load_band(
            item, "lwir11", bbox, apply_scale=False, verbose=False
        )
        if heat_dn is None or np.isnan(heat_dn).any():
            continue

        heat_celsius = convert_to_celsius(heat_asset, heat_dn)
        if np.isnan(heat_celsius).any():
            continue

        ndvi_denominator = nir + red
        mask = np.isclose(ndvi_denominator, 0) | np.isnan(nir) | np.isnan(red)
        ndvi = np.empty_like(nir, dtype=float)
        ndvi[:] = np.nan
        ndvi[~mask] = (nir[~mask] - red[~mask]) / ndvi_denominator[~mask]
        ndvi = np.clip(ndvi, -1.0, 1.0)
        
        if np.isnan(ndvi).any():
            continue

        asset_date = item.properties["datetime"].split("T")[0]
        asset_month = int(item.properties["datetime"].split("T")[0].split("-")[1])

        vegetation_phase = get_vegetation_phase(asset_month)
        mean_heat = np.nanmean(heat_celsius)

        ndvi_heat_pairs.append(
            {
                "city": city,
                "ndvi": ndvi,
                "heat": heat_celsius,
                "mean_heat": mean_heat,
                "asset_date": asset_date,
                "vegetation_phase": vegetation_phase,
            }
        )
        good_images += 1

# Save ndvi_heat_pairs to a file
with open("ndvi_heat_pairs.pkl", "wb") as f:
    pickle.dump(ndvi_heat_pairs, f)

total_combinations_possible = len(ndvi_heat_pairs) * (len(ndvi_heat_pairs) - 1)
total_combinations_formed = 0

# Make pairs of ndvi and heat
for i in range(len(ndvi_heat_pairs)):
    for j in range(len(ndvi_heat_pairs)):
        print(f"Forming combination {i+1}/{len(ndvi_heat_pairs)} ({j+1}/{len(ndvi_heat_pairs)})", end="\r")
        
        if i == j:
            continue

        pair1 = ndvi_heat_pairs[i]
        pair2 = ndvi_heat_pairs[j]

        ndvi1 = pair1["ndvi"]
        heat1 = pair1["heat"]
        mean_heat1 = pair1["mean_heat"]
        asset_date1 = pair1["asset_date"]
        vegetation_phase1 = pair1["vegetation_phase"]
        city1 = pair1["city"]

        ndvi2 = pair2["ndvi"]
        heat2 = pair2["heat"]
        mean_heat2 = pair2["mean_heat"]
        asset_date2 = pair2["asset_date"]
        vegetation_phase2 = pair2["vegetation_phase"]
        city2 = pair2["city"]

        # Check if pair can be formed (same vegetation phase and similar heat)
        if vegetation_phase1 != vegetation_phase2 or abs(mean_heat1 - mean_heat2) > 2.5 or city1 != city2 or ndvi1.shape != ndvi2.shape or heat1.shape != heat2.shape:
            continue

        delta_ndvi = ndvi1 - ndvi2
        delta_heat = heat1 - heat2
        
        dimension = delta_ndvi.shape[0]

        for row in range(0, dimension - chunk_size + 1, half_chunk):
            for col in range(0, dimension - chunk_size + 1, half_chunk):
                ndvi_chunk = delta_ndvi[row : row + chunk_size, col : col + chunk_size]
                heat_chunk = delta_heat[row : row + chunk_size, col : col + chunk_size]

                if np.isnan(ndvi_chunk).all() or np.isnan(heat_chunk).all():
                    continue

                sample = {
                    "ndvi_delta": ndvi_chunk,
                    "lst_delta": heat_chunk,
                    "asset_date_1": asset_date1,
                    "asset_date_2": asset_date2,
                    "vegetation_phase": vegetation_phase1,
                    "row_start": row,
                    "col_start": col,
                    "row_end": row + chunk_size,
                    "col_end": col + chunk_size,
                }

                key = sample_key(sample)
                if key in existing_keys:
                    continue

                data_samples.append(sample)
                existing_keys.add(key)
                samples_since_checkpoint += 1
                total_combinations_formed += 1

                if samples_since_checkpoint >= CHECKPOINT_INTERVAL:
                    save_samples(data_samples, CHECKPOINT_PATH, label="checkpoint")
                    samples_since_checkpoint = 0

print(f"Total combinations possible: {total_combinations_possible}")
print(f"Total combinations formed: {total_combinations_formed}")

# Save data samples to a file
save_samples(data_samples, FINAL_PATH, label="final")

# Remove checkpoint if final save succeeded
if CHECKPOINT_PATH.exists():
    CHECKPOINT_PATH.unlink()
