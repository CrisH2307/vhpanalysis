import numpy as np
import osmnx as ox
import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import Polygon, MultiPolygon
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from typing import Tuple


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

    heat_values_in_city = heat_map[mask]
    if heat_values_in_city.size:
        min_heat_in_city = float(np.nanmin(heat_values_in_city))
        max_heat_in_city = float(np.nanmax(heat_values_in_city))
        heat_threshold = (max_heat_in_city + min_heat_in_city) / 1.75
        hot_spots = np.where(mask & (heat_map > heat_threshold), heat_map, np.nan)
    else:
        heat_threshold = float("nan")
        hot_spots = np.full_like(heat_map, np.nan)

    heat_map_in_city_mean = np.nanmean(heat_map_in_city)
    ndvi_map_in_city_mean = np.nanmean(ndvi_map_in_city)
    heat_map_out_of_city_mean = np.nanmean(heat_map_out_of_city)
    ndvi_map_out_of_city_mean = np.nanmean(ndvi_map_out_of_city)
    hot_surface_area = np.count_nonzero(~np.isnan(hot_spots)) * (30*30) / 1000000 # m^2 to km^2

    print(f"Hot surface area: {hot_surface_area} m^2")
    print(f"Heat map in city mean: {heat_map_in_city_mean}")
    print(f"NDVI map in city mean: {ndvi_map_in_city_mean}")
    print(f"Heat map out of city mean: {heat_map_out_of_city_mean}")
    print(f"NDVI map out of city mean: {ndvi_map_out_of_city_mean}")

    save_masked_image(hot_spots, "Heat Hot Spots", f"{city.replace(',', '_')}_heat_hotspots.png")
    save_masked_image(heat_map_in_city, "Heat Map - Inside City", f"{city.replace(',', '_')}_heat_in_city.png")
    save_masked_image(ndvi_map_in_city, "NDVI Map - Inside City", f"{city.replace(',', '_')}_ndvi_in_city.png", cmap="RdYlGn")
    save_masked_image(heat_map_out_of_city, "Heat Map - Outside City", f"{city.replace(',', '_')}_heat_out_city.png")
    save_masked_image(ndvi_map_out_of_city, "NDVI Map - Outside City", f"{city.replace(',', '_')}_ndvi_out_city.png", cmap="RdYlGn")

    return int(mask.sum())
    


