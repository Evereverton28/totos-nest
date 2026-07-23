"""Small shared helpers used across blueprints."""
import random
import string
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .models import User
from .roles import ADMIN_ROLES, has_permission


def _current_user():
    """Resolve the authenticated user from the JWT, or None.

    Deactivated accounts resolve to None, so an already-issued token stops
    working the moment the account is switched off.
    """
    verify_jwt_in_request()
    user = User.query.get(get_jwt_identity())
    return user if (user and user.is_active) else None


def current_user():
    """The authenticated (and active) user, for use inside a guarded route."""
    return _current_user()


def admin_required(fn):
    """Reject anyone who isn't an admin of some kind (any non-customer role)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user or user.role not in ADMIN_ROLES:
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def role_required(*roles):
    """Restrict a route to one or more specific roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = _current_user()
            if not user or user.role not in roles:
                return jsonify({"error": "You don't have access to this"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def permission_required(permission):
    """Restrict a route to roles that hold a given permission.

    The role is re-derived from the user record on every call, so revoking a
    role takes effect immediately and a customer token can never reach an
    admin route regardless of what the client does.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = _current_user()
            if not user or not has_permission(user.role, permission):
                return jsonify({"error": "You don't have permission for this"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def gen_reference():
    """Human-friendly order reference, e.g. TN-8F3K2Q."""
    body = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"TN-{body}"


def paginate(query, page, per_page):
    """Return (items, meta) for a SQLAlchemy query."""
    p = query.paginate(page=page, per_page=per_page, error_out=False)
    meta = {"page": p.page, "pages": p.pages, "total": p.total,
            "per_page": per_page, "has_next": p.has_next}
    return p.items, meta
