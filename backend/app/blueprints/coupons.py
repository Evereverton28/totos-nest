"""Coupon validation for the cart/checkout."""
from flask import Blueprint, request, jsonify
from ..models import Coupon

coupons_bp = Blueprint("coupons", __name__)


@coupons_bp.post("/coupons/validate")
def validate():
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal", 0))

    coupon = Coupon.query.filter_by(code=code, active=True).first()
    if not coupon:
        return jsonify({"valid": False, "error": "Invalid coupon code"}), 404
    if subtotal < coupon.min_spend:
        return jsonify({"valid": False,
                        "error": f"Spend at least {coupon.min_spend:.0f} to use this code"}), 400

    discount = (subtotal * coupon.value / 100 if coupon.kind == "percent"
                else coupon.value)
    return jsonify({"valid": True, "code": coupon.code, "kind": coupon.kind,
                    "value": coupon.value, "discount": round(discount, 2)})
