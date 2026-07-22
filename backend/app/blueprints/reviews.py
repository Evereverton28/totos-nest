"""Product review endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models import Review, Product, User

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.post("/products/<slug>/reviews")
def add_review(slug):
    product = Product.query.filter_by(slug=slug).first_or_404()
    data = request.get_json() or {}

    # Reviews may be posted by logged-in users or guests
    user_id, author = None, data.get("author_name", "Guest")
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            u = User.query.get(user_id)
            author = u.name if u else author
    except Exception:
        pass

    rating = max(1, min(5, int(data.get("rating", 5))))
    review = Review(product_id=product.id, user_id=user_id, author_name=author,
                    rating=rating, comment=(data.get("comment") or "").strip())
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201
