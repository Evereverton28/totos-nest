"""Category endpoints."""
from flask import Blueprint, jsonify
from ..models import Category

categories_bp = Blueprint("categories", __name__)


@categories_bp.get("/categories")
def list_categories():
    cats = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict(with_count=True) for c in cats])


@categories_bp.get("/categories/<slug>")
def category_detail(slug):
    cat = Category.query.filter_by(slug=slug).first_or_404()
    return jsonify(cat.to_dict(with_count=True))
