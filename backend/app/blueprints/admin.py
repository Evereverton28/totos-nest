"""Admin management endpoints.

Each route is guarded by @permission_required(<permission>), so access is
decided by the caller's role (see app/roles.py) rather than a blanket admin
flag. Covers products, categories, inventory, orders, customers, reviews,
coupons, banners and admin user-management.
"""
import json
import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from ..extensions import db
from ..models import (Product, ProductImage, Category, Order, User, Review,
                      Coupon, Banner)
from ..utils import permission_required, paginate
from ..roles import (CUSTOMER, ASSIGNABLE_ADMIN_ROLES, DASHBOARD, PRODUCTS_READ,
                     PRODUCTS_WRITE, CATEGORIES, ORDERS, CUSTOMERS, REVIEWS,
                     COUPONS, BANNERS, USER_MANAGEMENT)

admin_bp = Blueprint("admin", __name__)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------
@admin_bp.get("/admin/dashboard")
@permission_required(DASHBOARD)
def dashboard():
    total_revenue = db.session.query(func.coalesce(func.sum(Order.total), 0)) \
        .filter(Order.status != "cancelled").scalar()
    latest = (Order.query.order_by(Order.created_at.desc()).limit(6).all())
    top_products = (Product.query.order_by(Product.sold_count.desc()).limit(5).all())
    return jsonify({
        "total_products": Product.query.count(),
        "total_orders": Order.query.count(),
        "total_customers": User.query.filter_by(role=CUSTOMER).count(),
        "total_revenue": round(total_revenue, 2),
        "pending_orders": Order.query.filter_by(status="pending").count(),
        "low_stock": [p.to_dict() for p in
                      Product.query.filter(Product.stock <= 5).limit(6).all()],
        "latest_orders": [o.to_dict(with_items=False) for o in latest],
        "top_products": [{"name": p.name, "sold": p.sold_count,
                          "revenue": round(p.sold_count * p.price, 2)}
                         for p in top_products],
    })


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@admin_bp.get("/admin/products")
@permission_required(PRODUCTS_READ)
def admin_products():
    page = int(request.args.get("page", 1))
    q = Product.query.order_by(Product.created_at.desc())
    if request.args.get("q"):
        q = q.filter(Product.name.ilike(f"%{request.args['q']}%"))
    items, meta = paginate(q, page, int(request.args.get("per_page", 20)))
    return jsonify({"products": [p.to_dict() for p in items], "meta": meta})


@admin_bp.post("/admin/products")
@permission_required(PRODUCTS_WRITE)
def create_product():
    d = request.get_json() or {}
    product = Product(
        name=d["name"], slug=slugify(d["name"]),
        description=d.get("description", ""),
        price=float(d.get("price", 0)),
        compare_at_price=(float(d["compare_at_price"])
                          if d.get("compare_at_price") else None),
        stock=int(d.get("stock", 0)),
        category_id=d.get("category_id"),
        gender=d.get("gender", "unisex"),
        age_group=d.get("age_group", "0-2y"),
        sizes=json.dumps(d.get("sizes", [])),
        is_featured=bool(d.get("is_featured")),
        is_best_seller=bool(d.get("is_best_seller")),
    )
    db.session.add(product)
    db.session.flush()
    for i, url in enumerate(d.get("images", [])):
        db.session.add(ProductImage(product_id=product.id, url=url, position=i))
    db.session.commit()
    return jsonify(product.to_dict(detail=True)), 201


@admin_bp.put("/admin/products/<int:pid>")
@permission_required(PRODUCTS_WRITE)
def update_product(pid):
    product = Product.query.get_or_404(pid)
    d = request.get_json() or {}
    for field in ("name", "description", "gender", "age_group"):
        if field in d:
            setattr(product, field, d[field])
    if "name" in d:
        product.slug = slugify(d["name"])
    if "price" in d:
        product.price = float(d["price"])
    if "compare_at_price" in d:
        product.compare_at_price = (float(d["compare_at_price"])
                                    if d["compare_at_price"] else None)
    if "stock" in d:
        product.stock = int(d["stock"])
    if "category_id" in d:
        product.category_id = d["category_id"]
    if "sizes" in d:
        product.sizes = json.dumps(d["sizes"])
    if "is_featured" in d:
        product.is_featured = bool(d["is_featured"])
    if "is_best_seller" in d:
        product.is_best_seller = bool(d["is_best_seller"])
    if "images" in d:
        ProductImage.query.filter_by(product_id=product.id).delete()
        for i, url in enumerate(d["images"]):
            db.session.add(ProductImage(product_id=product.id, url=url, position=i))
    db.session.commit()
    return jsonify(product.to_dict(detail=True))


@admin_bp.delete("/admin/products/<int:pid>")
@permission_required(PRODUCTS_WRITE)
def delete_product(pid):
    product = Product.query.get_or_404(pid)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"deleted": True})


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
@admin_bp.post("/admin/categories")
@permission_required(CATEGORIES)
def create_category():
    d = request.get_json() or {}
    cat = Category(name=d["name"], slug=slugify(d["name"]),
                   description=d.get("description"), image=d.get("image"))
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


@admin_bp.delete("/admin/categories/<int:cid>")
@permission_required(CATEGORIES)
def delete_category(cid):
    cat = Category.query.get_or_404(cid)
    db.session.delete(cat)
    db.session.commit()
    return jsonify({"deleted": True})


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
VALID_STATUSES = {"pending", "paid", "packed", "shipped", "delivered", "cancelled"}


@admin_bp.get("/admin/orders")
@permission_required(ORDERS)
def admin_orders():
    page = int(request.args.get("page", 1))
    q = Order.query.order_by(Order.created_at.desc())
    if request.args.get("status"):
        q = q.filter(Order.status == request.args["status"])
    if request.args.get("q"):
        term = f"%{request.args['q']}%"
        q = q.filter(db.or_(Order.reference.ilike(term),
                            Order.customer_name.ilike(term),
                            Order.email.ilike(term)))
    items, meta = paginate(q, page, int(request.args.get("per_page", 20)))
    return jsonify({"orders": [o.to_dict() for o in items], "meta": meta})


@admin_bp.put("/admin/orders/<int:oid>/status")
@permission_required(ORDERS)
def update_order_status(oid):
    order = Order.query.get_or_404(oid)
    status = (request.get_json() or {}).get("status")
    if status not in VALID_STATUSES:
        return jsonify({"error": "Invalid status"}), 400
    order.status = status
    db.session.commit()
    return jsonify(order.to_dict())


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------
@admin_bp.get("/admin/customers")
@permission_required(CUSTOMERS)
def customers():
    users = User.query.filter_by(role=CUSTOMER).all()
    out = []
    for u in users:
        spent = db.session.query(func.coalesce(func.sum(Order.total), 0)) \
            .filter(Order.user_id == u.id, Order.status != "cancelled").scalar()
        out.append({**u.to_dict(),
                    "order_count": len(u.orders),
                    "total_spent": round(spent, 2)})
    if request.args.get("q"):
        term = request.args["q"].lower()
        out = [c for c in out if term in c["name"].lower()
               or term in c["email"].lower()]
    return jsonify(out)


# ---------------------------------------------------------------------------
# Reviews / Coupons / Banners
# ---------------------------------------------------------------------------
@admin_bp.get("/admin/reviews")
@permission_required(REVIEWS)
def admin_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).limit(50).all()
    out = []
    for r in reviews:
        d = r.to_dict()
        d["product"] = r.product.name if r.product else None
        out.append(d)
    return jsonify(out)


@admin_bp.delete("/admin/reviews/<int:rid>")
@permission_required(REVIEWS)
def delete_review(rid):
    r = Review.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"deleted": True})


@admin_bp.get("/admin/coupons")
@permission_required(COUPONS)
def admin_coupons():
    return jsonify([c.to_dict() for c in Coupon.query.all()])


@admin_bp.post("/admin/coupons")
@permission_required(COUPONS)
def create_coupon():
    d = request.get_json() or {}
    coupon = Coupon(code=d["code"].upper(), kind=d.get("kind", "percent"),
                    value=float(d.get("value", 0)),
                    min_spend=float(d.get("min_spend", 0)),
                    active=bool(d.get("active", True)))
    db.session.add(coupon)
    db.session.commit()
    return jsonify(coupon.to_dict()), 201


@admin_bp.post("/admin/banners")
@permission_required(BANNERS)
def create_banner():
    d = request.get_json() or {}
    banner = Banner(title=d.get("title"), subtitle=d.get("subtitle"),
                    image=d.get("image"), cta_text=d.get("cta_text"),
                    cta_link=d.get("cta_link"), active=bool(d.get("active", True)),
                    position=int(d.get("position", 0)))
    db.session.add(banner)
    db.session.commit()
    return jsonify(banner.to_dict()), 201


# ---------------------------------------------------------------------------
# Admin user management (super_admin only, via USER_MANAGEMENT permission)
# ---------------------------------------------------------------------------
@admin_bp.get("/admin/staff")
@permission_required(USER_MANAGEMENT)
def list_staff():
    """List admin accounts (everyone who isn't a customer)."""
    admins = User.query.filter(User.role != CUSTOMER).order_by(User.name).all()
    return jsonify([u.to_dict() for u in admins])


@admin_bp.put("/admin/staff/<int:uid>/role")
@permission_required(USER_MANAGEMENT)
def change_role(uid):
    """Promote/demote an account between admin roles."""
    user = User.query.get_or_404(uid)
    new_role = (request.get_json() or {}).get("role")
    if new_role not in ASSIGNABLE_ADMIN_ROLES:
        return jsonify({"error": "Invalid admin role"}), 400
    user.role = new_role
    db.session.commit()
    return jsonify(user.to_dict())
