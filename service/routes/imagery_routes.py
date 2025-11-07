import base64
from typing import Tuple, Optional

from flask import Blueprint, jsonify, request

from ..imagery import sat_extract


imagery_bp = Blueprint("imagery", __name__, url_prefix="/imagery")


def _validate_query_params() -> Tuple[Optional[str], Optional[str]]:
    city = request.args.get("city")
    date = request.args.get("date")

    if not city or not date:
        return None, None

    return city, date


def _build_response(image_bytes: bytes, image_date: str, bbox: Tuple[float, float, float, float]):
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    return jsonify(
        {
            "image": encoded_image,
            "image_date": image_date,
            "bounding_box": list(bbox),
        }
    )


@imagery_bp.route("/ndvi", methods=["GET"])
def get_ndvi():
    city, date = _validate_query_params()

    if not city or not date:
        return jsonify({"error": "Missing required query parameters: city, date"}), 400

    image_bytes, image_date, bbox = sat_extract.get_ndvi_map(date, city)

    if image_bytes is None:
        return jsonify({"error": "No valid NDVI imagery found"}), 404

    return _build_response(image_bytes, image_date, bbox)


@imagery_bp.route("/heat", methods=["GET"])
def get_heat():
    city, date = _validate_query_params()

    if not city or not date:
        return jsonify({"error": "Missing required query parameters: city, date"}), 400

    image_bytes, image_date, bbox = sat_extract.get_heat_map(date, city)

    if image_bytes is None:
        return jsonify({"error": "No valid thermal imagery found"}), 404

    return _build_response(image_bytes, image_date, bbox)

