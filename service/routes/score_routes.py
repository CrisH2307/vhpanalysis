import base64
from flask import Blueprint, jsonify, request, session

from service.imagery.session_store import get_session_data
from service.imagery.score_calculation import calculate_score

score_bp = Blueprint("score", __name__, url_prefix="/score")

@score_bp.route("", methods=["GET"], strict_slashes=False)
def get_score():
    city = request.args.get("city")

    if not city:
        return jsonify({"error": "Missing required query parameters: city"}), 400

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
    if "ndvi_map" not in session_data:
        return jsonify({"error": "NDVI map data not found"}), 400
    if "data" not in session_data["ndvi_map"]:
        return jsonify({"error": "NDVI map data not found"}), 400

    heat_map = session_data["heat_map"]["data"]
    bbox = session_data["heat_map"]["bbox"]
    ndvi_map = session_data["ndvi_map"]["data"]
    ndvi_bbox = session_data["ndvi_map"]["bbox"]
    heat_shape = heat_map.shape

    score = calculate_score(heat_map, ndvi_map, bbox, city)

    return jsonify({"score": score}), 200