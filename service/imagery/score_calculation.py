import numpy as np
import osmnx as ox
import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import Polygon, MultiPolygon
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from typing import Tuple

import requests
import json
import os

def calculate_city_score_with_explanation(
    city_name,
    city_area,
    hot_surface_area,
    vegetation_surface_area,
    heat_map_in_city_mean,
    ndvi_map_in_city_mean,
    heat_map_out_of_city_mean,
    ndvi_map_out_of_city_mean,
    city_population
):
    # --- Derived metrics ---
    vegetation_ratio = vegetation_surface_area / (city_area)
    hot_surface_ratio = hot_surface_area / (city_area)
    heat_diff = heat_map_in_city_mean - heat_map_out_of_city_mean
    ndvi_diff = ndvi_map_in_city_mean - ndvi_map_out_of_city_mean
    pop_density = city_population / city_area

    # --- Scoring model ---
    vegetation_score = min(1.0, vegetation_ratio * 8_000)
    heat_penalty = max(0.0, 1 - (heat_diff / 5))
    ndvi_balance = max(0.0, min(1.0, 0.5 + ndvi_diff * 10))
    density_penalty = max(0.0, 1 - (pop_density / 10_000))
    hot_surface_penalty = max(0.0, 1 - (hot_surface_ratio * 500_000))

    score = (
        vegetation_score * 0.3 +
        heat_penalty * 0.25 +
        ndvi_balance * 0.2 +
        density_penalty * 0.15 +
        hot_surface_penalty * 0.1
    ) * 100

    score = max(0, min(100, score))

    # --- Descriptive helpers ---
    def describe(value, thresholds, labels):
        if value < thresholds[0]:
            return labels[0]
        elif value < thresholds[1]:
            return labels[1]
        else:
            return labels[2]

    # --- Descriptive sections ---
    vegetation_desc = describe(
        vegetation_ratio, [0.1/100, 0.3/100],
        ["scarce vegetation cover", "moderate vegetation presence", "rich and balanced vegetation distribution"]
    )

    heat_desc = describe(
        heat_diff, [0.5, 2.0],
        ["excellent thermal control with minimal urban heat island effect", 
         "slightly elevated heat compared to surroundings", 
         "noticeably higher heat accumulation within the city"]
    )

    ndvi_desc = "above the surrounding regions" if ndvi_diff > 0 else "below the surrounding regions"

    density_desc = describe(
        pop_density, [3000, 6000],
        ["low population density", "moderate population density", "very high population density"]
    )

    hot_surface_desc = describe(
        hot_surface_ratio, [0.00005, 0.0002],
        ["minimal proportion of heat-absorbing surfaces", 
         "moderate level of hot, impervious areas", 
         "large fraction of surfaces contributing to heat retention"]
    )

    sustainability_level = describe(
        score, [40, 70],
        ["low environmental sustainability balance", 
         "moderate environmental sustainability balance", 
         "high environmental sustainability balance"]
    )

    # --- Explanatory paragraphs ---
    summary = (
        f"<p><strong>{city_name}</strong> demonstrates a <span class='font-semibold'>{sustainability_level}</span>, scoring <strong>{score:.1f}/100</strong> on the environmental prosperity index. "
        f"This score represents a balance between vegetation cover, heat dynamics, and population density — key indicators of how effectively "
        f"the city manages its natural and built environments.</p>"
    )

    vegetation_section = (
        f"<h3 class='mt-4 text-base font-semibold text-slate-200'>Vegetation Health</h3>"
        f"<p>The city shows <strong>{vegetation_desc}</strong>, with vegetation covering approximately <strong>{vegetation_ratio*100:.3f}%</strong> of the total area. "
        f"This level of greenery plays a critical role in maintaining ecological stability, improving air quality, and moderating urban heat. "
        f"Higher vegetation density often correlates with improved livability and resilience against rising temperatures.</p>"
    )

    heat_section = (
        f"<h3 class='mt-4 text-base font-semibold text-slate-200'>Heat Dynamics</h3>"
        f"<p>Thermal analysis reveals <strong>{heat_desc}</strong>. The average surface temperature within the city is <strong>{heat_map_in_city_mean:.2f}°C</strong>, "
        f"compared to <strong>{heat_map_out_of_city_mean:.2f}°C</strong> outside its borders. A difference of <strong>{heat_diff:.2f}°C</strong> indicates the extent "
        f"of the urban heat island effect, which can influence energy consumption, comfort, and public health.</p>"
    )

    ndvi_section = (
        f"<h3 class='mt-4 text-base font-semibold text-slate-200'>Vegetation Vitality (NDVI)</h3>"
        f"<p>The vegetation vitality, as indicated by the NDVI metric, is <strong>{ndvi_desc}</strong>. "
        f"With an in-city NDVI mean of <strong>{ndvi_map_in_city_mean:.3f}</strong> versus <strong>{ndvi_map_out_of_city_mean:.3f}</strong> outside, "
        f"this measure reflects the overall health and density of green vegetation. Positive NDVI differences typically signal "
        f"strong local ecosystem performance and better CO₂ absorption rates.</p>"
    )

    density_section = (
        f"<h3 class='mt-4 text-base font-semibold text-slate-200'>Population Density</h3>"
        f"<p>The population density is approximately <strong>{pop_density:.0f}</strong> people per square kilometer, categorized as <strong>{density_desc}</strong>. "
        f"Higher density increases pressure on green spaces and often correlates with elevated heat and reduced per-capita vegetation. "
        f"Balanced density enables efficient infrastructure while preserving access to natural environments.</p>"
    )

    hot_surface_section = (
        f"<h3 class='mt-4 text-base font-semibold text-slate-200'>Heat-Absorbing Surfaces</h3>"
        f"<p>The proportion of thermally active or impervious surfaces is <strong>{hot_surface_ratio*100:.5f}%</strong>, which suggests <strong>{hot_surface_desc}</strong>. "
        f"Reducing such surfaces through green roofs, reflective materials, or expanded canopy coverage could substantially enhance the city’s heat resilience.</p>"
    )

    # --- Combine all paragraphs ---
    explanation = "\n\n".join([
        summary,
        vegetation_section,
        heat_section,
        ndvi_section,
        density_section,
        hot_surface_section
    ])

    return score, explanation

def get_city_opendata(city):
    city = city.split(',')[0]
    url = f"https://api.api-ninjas.com/v1/city?name={city}"
    res = requests.get(
        url,
        headers={
            "X-Api-Key": os.getenv("API_NINJAS_API_KEY")
        }
    )
    json_data = json.loads(res.content)
    return json_data

def create_city_mask(
    geometry: Polygon | MultiPolygon,
    bbox: Tuple[float, float, float, float],
    shape: Tuple[int, int],
    output_path: str,
) -> np.ndarray:
    """Rasterize a city boundary geometry to a mask and save it as an image."""
    lon_min, lat_min, lon_max, lat_max = bbox
    height, width = shape

    transform = from_bounds(lon_min, lat_min, lon_max, lat_max, width, height)

    geometries = (
        [(geom, 1) for geom in geometry.geoms]
        if isinstance(geometry, MultiPolygon)
        else [(geometry, 1)]
    )

    mask = rasterize(
        geometries,
        out_shape=(height, width),
        transform=transform,
        fill=0,
        dtype=np.uint8,
    )

    return mask.astype(bool)

def calculate_score(heat_map: np.ndarray, ndvi_map: np.ndarray, bbox: Tuple[float, float, float, float], city: str) -> int:
    point = ox.geocode(city)
    tags = {'boundary': 'administrative', 'admin_level': ['6', '7', '8', '9']}
    features = ox.features_from_point(point, tags=tags, dist=5000)

    shape = heat_map.shape

    city_boundary_gdf = features[
        ((features.geometry.type == 'Polygon') | (features.geometry.type == 'MultiPolygon')) &
        (features['name'].str.contains(city.split(',')[0], case=False, na=False))
    ]
    
    if city_boundary_gdf.empty:
        print(f"Could not find administrative boundary for {city}.")
        return None

    geometry = city_boundary_gdf.iloc[0].geometry
    mask = create_city_mask(geometry, bbox, shape, f"{city.replace(',', '_')}_mask.png")

    def save_masked_image(data: np.ndarray, title: str, path: str, cmap: str = "inferno") -> None:
        plt.figure(figsize=(6, 6))
        plt.imshow(data, cmap=cmap)
        plt.title(title)
        plt.axis("off")
        plt.tight_layout(pad=0)
        plt.savefig(path, bbox_inches="tight", pad_inches=0)
        plt.close()

    heat_map_in_city = np.where(mask, heat_map, np.nan)
    ndvi_map_in_city = np.where(mask, ndvi_map, np.nan)
    heat_map_out_of_city = np.where(~mask, heat_map, np.nan)
    ndvi_map_out_of_city = np.where(~mask, ndvi_map, np.nan)

    vegetation_threshold = 0.2
    vegetation_map_in_city = np.where(ndvi_map_in_city > vegetation_threshold, ndvi_map_in_city, np.nan)

    heat_values_in_city = heat_map[mask]
    if heat_values_in_city.size:
        min_heat_in_city = float(np.nanmin(heat_values_in_city))
        max_heat_in_city = float(np.nanmax(heat_values_in_city))
        heat_threshold = (max_heat_in_city + min_heat_in_city) / 1.75
        hot_spots = np.where(mask & (heat_map > heat_threshold), heat_map, np.nan)
    else:
        heat_threshold = float("nan")
        hot_spots = np.full_like(heat_map, np.nan)

    city_data = get_city_opendata(city)

    heat_map_in_city_mean = np.nanmean(heat_map_in_city)
    ndvi_map_in_city_mean = np.nanmean(ndvi_map_in_city)
    heat_map_out_of_city_mean = np.nanmean(heat_map_out_of_city)
    ndvi_map_out_of_city_mean = np.nanmean(ndvi_map_out_of_city)
    hot_surface_area = np.count_nonzero(~np.isnan(hot_spots)) * (30*30) / 1000000 # m^2 to km^2
    vegetation_surface_area = np.count_nonzero(~np.isnan(vegetation_map_in_city)) * (30*30) / 1000000 # m^2 to km^2
    city_area = mask.sum() * (30*30) / 1000000 # m^2 to km^2
    city_population = 0
    if city_data:
        city_population = city_data[0]["population"]

    score, explanation = calculate_city_score_with_explanation(
        city,
        city_area,
        hot_surface_area,
        vegetation_surface_area,
        heat_map_in_city_mean,
        ndvi_map_in_city_mean,
        heat_map_out_of_city_mean,
        ndvi_map_out_of_city_mean,
        city_population
    )

    return score, explanation

