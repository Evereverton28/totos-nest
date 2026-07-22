"""Wishlist endpoints (auth required)."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import WishlistItem, Product

wishlist_bp = Blueprint("wishlist", __name__)


@wishlist_bp.get("/wishlist")
@jwt_required()
def get_wishlist():
    items = WishlistItem.query.filter_by(user_id=get_jwt_identity()).all()
    products = []
    for it in items:
        p = Product.query.get(it.product_id)
        if p:
            products.append(p.to_dict())
    return jsonify(products)


@wishlist_bp.post("/wishlist/<int:product_id>")
@jwt_required()
def toggle_wishlist(product_id):
    uid = get_jwt_identity()
    existing = WishlistItem.query.filter_by(user_id=uid, product_id=product_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"in_wishlist": False})
    db.session.add(WishlistItem(user_id=uid, product_id=product_id))
    db.session.commit()
    return jsonify({"in_wishlist": True})
