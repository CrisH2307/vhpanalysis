from service.imagery.sat_extract import geocode_city, load_band, convert_to_celsius
from pystac_client import Client
import planetary_computer as pc
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm
import time

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
    "Newmarket, ON, Canada",
    "Aurora, ON, Canada",
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

ndvi_heat_pairs = []

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

    if len(ndvi_heat_pairs) >= 3:
        break

    for idx, item in enumerate(items):
        if good_images >= 3:
            break

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

        heat = convert_to_celsius(heat_asset, heat_dn)
        if np.isnan(heat).any():
            continue

        thermal_k = heat * 0.00341802 + 149.0
        thermal_c = thermal_k - 273.15

        ndvi_denominator = nir + red
        mask = np.isclose(ndvi_denominator, 0) | np.isnan(nir) | np.isnan(red)
        ndvi = np.empty_like(nir, dtype=float)
        ndvi[:] = np.nan
        ndvi[~mask] = (nir[~mask] - red[~mask]) / ndvi_denominator[~mask]
        ndvi = np.clip(ndvi, -1.0, 1.0)
        
        if np.isnan(ndvi).any():
            continue

        mean_heat = np.nanmean(thermal_c)
        asset_date = item.properties["datetime"].split("T")[0]
        asset_month = int(item.properties["datetime"].split("T")[0].split("-")[1])

        vegetation_phase = get_vegetation_phase(asset_month)

        ndvi_heat_pairs.append((ndvi, thermal_c, mean_heat, asset_date, vegetation_phase))
        good_images += 1

# Make pairs of ndvi and heat
for i in range(len(ndvi_heat_pairs)):
    for j in range(i+1, len(ndvi_heat_pairs)):
        ndvi1, heat1, mean_heat1, asset_date1, vegetation_phase1 = ndvi_heat_pairs[i]
        ndvi2, heat2, mean_heat2, asset_date2, vegetation_phase2 = ndvi_heat_pairs[j]

        # Check if pair can be formed (same vegetation phase and similar heat)
        if vegetation_phase1 != vegetation_phase2 or abs(mean_heat1 - mean_heat2) > 2.5:
            continue

        delta_ndvi = ndvi1 - ndvi2
        delta_heat = heat1 - heat2
        
        ndvi_min = np.nanmin(delta_ndvi)
        ndvi_max = np.nanmax(delta_ndvi)

        fig, ax = plt.subplots(figsize=(10, 8))
        ndvi_span = max(abs(ndvi_min), abs(ndvi_max))
        if ndvi_span == 0:
            ndvi_span = 1e-6
        norm_ndvi = TwoSlopeNorm(vmin=-ndvi_span, vcenter=0, vmax=ndvi_span)
        im_ndvi = ax.imshow(delta_ndvi, cmap="RdBu", norm=norm_ndvi)
        ax.axis("off")
        cbar_ndvi = fig.colorbar(im_ndvi, ax=ax, fraction=0.046, pad=0.04)
        cbar_ndvi.set_label("NDVI Δ (unitless)")
        ax.set_title(f"NDVI Δ {asset_date1} vs {asset_date2}\nmin={ndvi_min:.3f}, max={ndvi_max:.3f}")

        output_path = f"delta_ndvi_{asset_date1}_{asset_date2}.png"
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
        )
        plt.close(fig)

        heat_min = np.nanmin(delta_heat)
        heat_max = np.nanmax(delta_heat)

        fig, ax = plt.subplots(figsize=(10, 8))
        heat_span = max(abs(heat_min), abs(heat_max))
        if heat_span == 0:
            heat_span = 1e-6
        norm_heat = TwoSlopeNorm(vmin=-heat_span, vcenter=0, vmax=heat_span)
        im_heat = ax.imshow(delta_heat, cmap="RdBu_r", norm=norm_heat)
        ax.axis("off")
        cbar_heat = fig.colorbar(im_heat, ax=ax, fraction=0.046, pad=0.04)
        cbar_heat.set_label("Temperature Δ (°C)")

        ax.set_title(f"Temperature Δ {asset_date1} vs {asset_date2}\nmin={heat_min:.2f}°C, max={heat_max:.2f}°C")

        output_path = f"delta_heat_{asset_date1}_{asset_date2}.png"
        fig.savefig(
            output_path,
            bbox_inches="tight",
            pad_inches=0,
        )
        plt.close(fig)
        
