"""Product catalogue endpoints: listing with filters/sort/search,
live search suggestions, detail view, and related products."""
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..extensions import db
from ..models import Product, Category
from ..utils import paginate

products_bp = Blueprint("products", __name__)


@products_bp.get("/products")
def list_products():
    """Supports: category, gender, age, size, min_price, max_price,
    availability, sort, q (search), page, per_page."""
    q = Product.query

    # --- Filters ---
    category = request.args.get("category")
    if category:
        cat = Category.query.filter_by(slug=category).first()
        if cat:
            q = q.filter(Product.category_id == cat.id)

    if request.args.get("gender"):
        q = q.filter(Product.gender == request.args["gender"])
    if request.args.get("age"):
        q = q.filter(Product.age_group == request.args["age"])
    if request.args.get("size"):
        # sizes stored as JSON text; a LIKE match is enough for this scale
        q = q.filter(Product.sizes.like(f'%"{request.args["size"]}"%'))
    if request.args.get("min_price"):
        q = q.filter(Product.price >= float(request.args["min_price"]))
    if request.args.get("max_price"):
        q = q.filter(Product.price <= float(request.args["max_price"]))
    if request.args.get("availability") == "in_stock":
        q = q.filter(Product.stock > 0)

    # --- Search ---
    search = request.args.get("q")
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Product.name.ilike(like), Product.description.ilike(like)))

    # --- Sort ---
    sort = request.args.get("sort", "newest")
    if sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    elif sort == "popular":
        q = q.order_by(Product.sold_count.desc())
    else:  # newest
        q = q.order_by(Product.created_at.desc())

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 12))
    items, meta = paginate(q, page, per_page)
    return jsonify({"products": [p.to_dict() for p in items], "meta": meta})


@products_bp.get("/products/featured")
def featured():
    items = Product.query.filter_by(is_featured=True).limit(8).all()
    return jsonify([p.to_dict() for p in items])


@products_bp.get("/products/new-arrivals")
def new_arrivals():
    items = Product.query.order_by(Product.created_at.desc()).limit(8).all()
    return jsonify([p.to_dict() for p in items])


@products_bp.get("/products/best-sellers")
def best_sellers():
    items = (Product.query.filter_by(is_best_seller=True)
             .order_by(Product.sold_count.desc()).limit(8).all())
    if not items:  # fall back to top sold
        items = Product.query.order_by(Product.sold_count.desc()).limit(8).all()
    return jsonify([p.to_dict() for p in items])


@products_bp.get("/products/suggest")
def suggest():
    """Live search suggestions for the navbar."""
    term = request.args.get("q", "").strip()
    if len(term) < 2:
        return jsonify([])
    like = f"%{term}%"
    items = Product.query.filter(Product.name.ilike(like)).limit(6).all()
    return jsonify([{"id": p.id, "name": p.name, "slug": p.slug,
                     "image": p.to_dict()["image"], "price": p.price}
                    for p in items])


@products_bp.get("/products/<slug>")
def detail(slug):
    product = Product.query.filter_by(slug=slug).first_or_404()
    product.views += 1
    db.session.commit()
    return jsonify(product.to_dict(detail=True))


@products_bp.get("/products/<slug>/related")
def related(slug):
    product = Product.query.filter_by(slug=slug).first_or_404()
    items = (Product.query
             .filter(Product.category_id == product.category_id,
                     Product.id != product.id)
             .order_by(Product.sold_count.desc()).limit(4).all())
    return jsonify([p.to_dict() for p in items])
