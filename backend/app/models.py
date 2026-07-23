"""Database models for Toto's Nest.

The schema covers the full store domain: users, catalogue (categories,
products, images, sizes), social proof (reviews, wishlist), commerce
(orders, order items, coupons), merchandising (banners) and the
analytics pipeline (visits).
"""
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(40))
    # role drives authorization: customer | super_admin | manager | staff
    role = db.Column(db.String(20), default="customer", nullable=False, index=True)
    # Deactivated accounts keep their data & order history but cannot log in.
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    orders = db.relationship("Order", backref="user", lazy=True)
    reviews = db.relationship("Review", backref="user", lazy=True)
    wishlist = db.relationship("WishlistItem", backref="user", lazy=True,
                               cascade="all, delete-orphan")
    addresses = db.relationship("Address", backref="user", lazy=True,
                                cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    @property
    def is_admin(self):
        """Convenience flag: any non-customer role belongs in the admin panel."""
        from .roles import ADMIN_ROLES
        return self.role in ADMIN_ROLES

    def can(self, permission):
        from .roles import has_permission
        return has_permission(self.role, permission)

    def to_dict(self):
        from .roles import permissions_for
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_admin": self.is_admin,
            "is_active": self.is_active,
            "permissions": permissions_for(self.role),
            "created_at": self.created_at.isoformat(),
        }


class Address(db.Model):
    __tablename__ = "addresses"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    label = db.Column(db.String(60), default="Home")
    line1 = db.Column(db.String(200))
    city = db.Column(db.String(80))
    county = db.Column(db.String(80))
    phone = db.Column(db.String(40))
    is_default = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


# ---------------------------------------------------------------------------
# Catalogue
# ---------------------------------------------------------------------------
class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    slug = db.Column(db.String(80), unique=True, nullable=False, index=True)
    description = db.Column(db.String(300))
    image = db.Column(db.String(400))

    products = db.relationship("Product", backref="category", lazy=True)

    def to_dict(self, with_count=False):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "image": self.image,
        }
        if with_count:
            data["product_count"] = len(self.products)
        return data


class Product(db.Model):
    __tablename__ = "products"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False, index=True)
    slug = db.Column(db.String(180), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    compare_at_price = db.Column(db.Float)          # original price if discounted
    stock = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"))
    gender = db.Column(db.String(20), default="unisex")   # boy / girl / unisex
    age_group = db.Column(db.String(30), default="0-2y")  # newborn / 0-2y / 3-5y / 6-8y
    sizes = db.Column(db.String(200), default="[]")       # JSON list of strings
    is_featured = db.Column(db.Boolean, default=False)
    is_best_seller = db.Column(db.Boolean, default=False)
    sold_count = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    images = db.relationship("ProductImage", backref="product", lazy=True,
                             cascade="all, delete-orphan",
                             order_by="ProductImage.position")
    reviews = db.relationship("Review", backref="product", lazy=True,
                              cascade="all, delete-orphan")

    @property
    def rating(self):
        if not self.reviews:
            return 0
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)

    @property
    def on_sale(self):
        return bool(self.compare_at_price and self.compare_at_price > self.price)

    def to_dict(self, detail=False):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "price": self.price,
            "compare_at_price": self.compare_at_price,
            "on_sale": self.on_sale,
            "stock": self.stock,
            "in_stock": self.stock > 0,
            "gender": self.gender,
            "age_group": self.age_group,
            "sizes": json.loads(self.sizes or "[]"),
            "is_featured": self.is_featured,
            "is_best_seller": self.is_best_seller,
            "rating": self.rating,
            "review_count": len(self.reviews),
            "category": self.category.name if self.category else None,
            "category_slug": self.category.slug if self.category else None,
            "images": [img.url for img in self.images],
            "image": self.images[0].url if self.images else None,
            "created_at": self.created_at.isoformat(),
        }
        if detail:
            data["description"] = self.description
            data["sold_count"] = self.sold_count
            data["reviews"] = [r.to_dict() for r in
                               sorted(self.reviews, key=lambda x: x.created_at,
                                      reverse=True)]
        return data


class ProductImage(db.Model):
    __tablename__ = "product_images"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"))
    url = db.Column(db.String(500), nullable=False)
    position = db.Column(db.Integer, default=0)


# ---------------------------------------------------------------------------
# Social proof
# ---------------------------------------------------------------------------
class Review(db.Model):
    __tablename__ = "reviews"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    author_name = db.Column(db.String(120))
    rating = db.Column(db.Integer, default=5)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "author": self.author_name or (self.user.name if self.user else "Guest"),
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Commerce
# ---------------------------------------------------------------------------
class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(20), unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    # Guest / shipping details
    customer_name = db.Column(db.String(120))
    email = db.Column(db.String(160))
    phone = db.Column(db.String(40))
    address = db.Column(db.String(300))
    city = db.Column(db.String(80))
    county = db.Column(db.String(80))
    # Money
    subtotal = db.Column(db.Float, default=0)
    delivery_fee = db.Column(db.Float, default=0)
    discount = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    coupon_code = db.Column(db.String(40))
    payment_method = db.Column(db.String(40), default="mpesa")
    # Lifecycle: pending -> paid -> packed -> shipped -> delivered / cancelled
    status = db.Column(db.String(20), default="pending", index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("OrderItem", backref="order", lazy=True,
                            cascade="all, delete-orphan")

    def to_dict(self, with_items=True):
        data = {
            "id": self.id,
            "reference": self.reference,
            "customer_name": self.customer_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "county": self.county,
            "subtotal": self.subtotal,
            "delivery_fee": self.delivery_fee,
            "discount": self.discount,
            "total": self.total,
            "coupon_code": self.coupon_code,
            "payment_method": self.payment_method,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
        if with_items:
            data["items"] = [i.to_dict() for i in self.items]
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"))
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"))
    name = db.Column(db.String(160))       # snapshot at purchase time
    image = db.Column(db.String(500))
    price = db.Column(db.Float)
    size = db.Column(db.String(20))
    quantity = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            "product_id": self.product_id,
            "name": self.name,
            "image": self.image,
            "price": self.price,
            "size": self.size,
            "quantity": self.quantity,
            "line_total": round(self.price * self.quantity, 2),
        }


class Coupon(db.Model):
    __tablename__ = "coupons"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    kind = db.Column(db.String(10), default="percent")  # percent | fixed
    value = db.Column(db.Float, default=0)
    min_spend = db.Column(db.Float, default=0)
    active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "code": self.code, "kind": self.kind, "value": self.value,
            "min_spend": self.min_spend, "active": self.active,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class Banner(db.Model):
    __tablename__ = "banners"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160))
    subtitle = db.Column(db.String(300))
    image = db.Column(db.String(500))
    cta_text = db.Column(db.String(60))
    cta_link = db.Column(db.String(200))
    active = db.Column(db.Boolean, default=True)
    position = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
class Visit(db.Model):
    __tablename__ = "visits"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), index=True)
    visitor_id = db.Column(db.String(64), index=True)
    ip = db.Column(db.String(64))
    path = db.Column(db.String(300))
    referrer = db.Column(db.String(300))
    device_type = db.Column(db.String(20))
    browser = db.Column(db.String(60))
    os = db.Column(db.String(60))
    event = db.Column(db.String(40), default="pageview")  # pageview|add_to_cart|checkout_started|purchase
    meta = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
