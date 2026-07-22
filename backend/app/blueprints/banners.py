"""Homepage banner endpoints (merchandising)."""
from flask import Blueprint, jsonify
from ..models import Banner

banners_bp = Blueprint("banners", __name__)


@banners_bp.get("/banners")
def list_banners():
    banners = (Banner.query.filter_by(active=True)
               .order_by(Banner.position).all())
    return jsonify([b.to_dict() for b in banners])
