import os
from datetime import datetime, timedelta

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import odc.stac
import planetary_computer as pc
import rasterio
import requests
import tempfile
import xarray as xr
from geopy.geocoders import Nominatim
from typing import Optional, Tuple

from pystac_client import Client
from rasterio.session import AWSSession
from rasterio.windows import from_bounds
from rasterio.warp import transform_bounds

from .session_store import store_session_data

catalog = Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=pc.sign_inplace
)

geolocator = Nominatim(user_agent="city_bbox_lookup", timeout=10)
def geocode_city(city):
    location = geolocator.geocode(city, exactly_one=True)

    # Extract bounding box (min_lat, max_lat, min_lon, max_lon)
    bbox = location.raw["boundingbox"]
    lat_min, lat_max = map(float, bbox[:2])
    lon_min, lon_max = map(float, bbox[2:])

    return lon_min, lat_min, lon_max, lat_max


def search_landsat_items(date, bbox):
    target_date = datetime.strptime(date, "%Y-%m-%d")
    start_date = str(target_date - timedelta(days=0)).split(" ")[0]
    end_date = str(target_date + timedelta(days=3000)).split(" ")[0]

    search = catalog.search(
        collections=["landsat-c2-l2"],
        bbox=bbox,
        datetime=f"{start_date}/{end_date}",
        query={
            "eo:cloud_cover": {"lt": 10},
        },
    )

    items = list(search.item_collection())
    print(f"Found {len(items)} items")

    items.sort(key=lambda x: x.properties["eo:cloud_cover"])
    return items


def crop_asset(asset_href, lon_min, lat_min, lon_max, lat_max):
    with rasterio.open(asset_href) as src:
        print("Loading data...")

        bbox_src = transform_bounds(
            "EPSG:4326",
            src.crs,
            lon_min,
            lat_min,
            lon_max,
            lat_max,
            densify_pts=21,
        )

        window = from_bounds(*bbox_src, transform=src.transform)
        window = window.round_offsets().round_lengths()

        data = src.read(1, window=window).astype(float)
        profile = src.profile
        profile.update(
            {
                "height": data.shape[0],
                "width": data.shape[1],
                "transform": src.window_transform(window),
            }
        )

    return data, profile


def load_band(item, band_substring, bbox, apply_scale=False, nodata_value=0):
    lon_min, lat_min, lon_max, lat_max = bbox
    asset = next(
        (asset for key, asset in item.assets.items() if band_substring in key), None
    )

    if asset is None:
        return None, None, None

    data, profile = crop_asset(asset.href, lon_min, lat_min, lon_max, lat_max)

    inferred_nodata = nodata_value
    if inferred_nodata is None:
        inferred_nodata = profile.get("nodata")
        if inferred_nodata is None:
            band_info = asset.extra_fields.get("raster:bands", [{}])
            inferred_nodata = band_info[0].get("nodata")

    if inferred_nodata is not None:
        data = np.where(np.isclose(data, inferred_nodata), np.nan, data)

    if apply_scale:
        band_info = asset.extra_fields.get("raster:bands", [{}])
        scale = band_info[0].get("scale")
        offset = band_info[0].get("offset")
        if scale is not None:
            data = data * scale
        if offset is not None:
            data = data + offset

    return data, profile, asset


def get_heat_map(date, city, session_id: Optional[str] = None):
    bbox = geocode_city(city)
    items = search_landsat_items(date, bbox)

    if len(items) == 0:
        print("No items found")
        return None, None, None

    for item in items:
        thermal_dn, profile, asset = load_band(item, "lwir11", bbox, apply_scale=False)

        if thermal_dn is None:
            continue

        if np.isnan(thermal_dn).any():
            continue

        thermal_k = thermal_dn * 0.00341802 + 149.0
        thermal_c = thermal_k - 273.15
        asset_date = item.properties["datetime"].split("T")[0]

        store_session_data(session_id, "heat_map", thermal_c, asset_date, bbox)

        fig, ax = plt.subplots(figsize=(10, 8))
        ax.imshow(thermal_c, cmap="inferno")
        ax.axis("off")

        output_path = f"heat_map_{city}_{asset_date}.png"
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
        )
        plt.close(fig)

        with open(output_path, "rb") as file:
            image_bytes = file.read()

        os.remove(output_path)

        return image_bytes, asset_date, bbox

    print("No valid thermal items without masked pixels were found.")
    return None, None, None


def get_ndvi_map(date, city, session_id: Optional[str] = None):
    bbox = geocode_city(city)
    items = search_landsat_items(date, bbox)

    if len(items) == 0:
        print("No items found")
        return None, None, None

    for item in items:
        red, profile_red, red_asset = load_band(
            item, "red", bbox, apply_scale=True, nodata_value=None
        )
        nir, profile_nir, nir_asset = load_band(
            item, "nir08", bbox, apply_scale=True, nodata_value=None
        )

        if red is None or nir is None:
            continue

        if np.isnan(red).any() or np.isnan(nir).any():
            continue

        ndvi_denominator = nir + red
        mask = np.isclose(ndvi_denominator, 0) | np.isnan(nir) | np.isnan(red)
        ndvi = np.empty_like(nir, dtype=float)
        ndvi[:] = np.nan
        ndvi[~mask] = (nir[~mask] - red[~mask]) / ndvi_denominator[~mask]

        if np.isnan(ndvi).any():
            continue

        asset_date = item.properties["datetime"].split("T")[0]

        store_session_data(session_id, "ndvi_map", ndvi, asset_date, bbox)

        fig, ax = plt.subplots(figsize=(10, 8))
        ax.imshow(ndvi, cmap="RdYlGn", vmin=-1, vmax=1)
        ax.axis("off")

        output_path = f"ndvi_map_{city}_{asset_date}.png"
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
        )
        plt.close(fig)

        with open(output_path, "rb") as file:
            image_bytes = file.read()

        os.remove(output_path)

        return image_bytes, asset_date, bbox

    print("No valid NDVI items were found.")
    return None, None, None
