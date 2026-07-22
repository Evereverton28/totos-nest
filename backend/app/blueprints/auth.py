"""Authentication & profile endpoints (JWT-based).

Two deliberately separate doors:
  - POST /auth/register        public; ALWAYS creates a customer.
  - POST /auth/admin-register  gated by a shared invite code; can set an
                               admin role. Without the code -> 403.

Login is shared: the same endpoint serves customers and admins. What differs
is the `role` claim baked into the returned token, which the client uses to
decide where to send the user (storefront vs admin dashboard). That redirect is
UX only — every protected route re-checks the role on the server.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (create_access_token, jwt_required,
                                get_jwt_identity)
from ..extensions import db
from ..models import User
from ..roles import CUSTOMER, ASSIGNABLE_ADMIN_ROLES

auth_bp = Blueprint("auth", __name__)


def _issue_token(user):
    """Create a JWT that carries the user's role as a claim."""
    return create_access_token(identity=str(user.id),
                               additional_claims={"role": user.role})


@auth_bp.post("/auth/register")
def register():
    """Public signup. The role is hardcoded to `customer`; any role sent by
    the client is ignored, so nobody can self-promote to admin here."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or len(password) < 6:
        return jsonify({"error": "Name, email and a 6+ char password are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(name=name, email=email, phone=data.get("phone"), role=CUSTOMER)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"token": _issue_token(user), "user": user.to_dict()}), 201


@auth_bp.post("/auth/admin-register")
def admin_register():
    """Create an admin account. Requires the correct invite code (a shared
    secret). This is the only path that can mint a non-customer role."""
    data = request.get_json() or {}
    invite = data.get("invite_code") or ""
    if invite != current_app.config["ADMIN_INVITE_CODE"]:
        return jsonify({"error": "Invalid invite code"}), 403

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role") or "staff"

    if role not in ASSIGNABLE_ADMIN_ROLES:
        return jsonify({"error": "Invalid admin role"}), 400
    if not name or not email or len(password) < 6:
        return jsonify({"error": "Name, email and a 6+ char password are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(name=name, email=email, phone=data.get("phone"), role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"token": _issue_token(user), "user": user.to_dict()}), 201


@auth_bp.post("/auth/login")
def login():
    """Shared login for everyone. Returns a role-bearing token."""
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(data.get("password") or ""):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"token": _issue_token(user), "user": user.to_dict()})


@auth_bp.get("/auth/me")
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict())


@auth_bp.put("/auth/profile")
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    data = request.get_json() or {}
    user.name = data.get("name", user.name)
    user.phone = data.get("phone", user.phone)
    if data.get("password"):
        if len(data["password"]) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        user.set_password(data["password"])
    db.session.commit()
    return jsonify(user.to_dict())
