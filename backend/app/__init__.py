"""Application factory for Toto's Nest.

Usage:
    from app import create_app
    app = create_app()
"""
from flask import Flask, request, jsonify
from .config import Config
from .extensions import db, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- Init extensions ---
    db.init_app(app)
    jwt.init_app(app)

    # A deactivated account's token stops working everywhere, immediately —
    # not just on the admin routes. This runs for every @jwt_required() route,
    # so revoking access doesn't wait for the token to expire.
    @jwt.token_in_blocklist_loader
    def _account_deactivated(_jwt_header, jwt_payload):
        from .models import User
        user = User.query.get(jwt_payload.get("sub"))
        return (user is None) or (not user.is_active)
    cors.init_app(app, resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}},
                  supports_credentials=True)

    # --- Register blueprints ---
    from .blueprints.auth import auth_bp
    from .blueprints.products import products_bp
    from .blueprints.categories import categories_bp
    from .blueprints.orders import orders_bp
    from .blueprints.reviews import reviews_bp
    from .blueprints.coupons import coupons_bp
    from .blueprints.banners import banners_bp
    from .blueprints.wishlist import wishlist_bp
    from .blueprints.analytics import analytics_bp
    from .blueprints.admin import admin_bp

    for bp in (auth_bp, products_bp, categories_bp, orders_bp, reviews_bp,
               coupons_bp, banners_bp, wishlist_bp, analytics_bp, admin_bp):
        app.register_blueprint(bp, url_prefix="/api")

    # --- Public settings endpoint (currency, delivery fee, store name) ---
    @app.get("/api/settings")
    def settings():
        return jsonify({
            "store_name": app.config["STORE_NAME"],
            "currency": app.config["CURRENCY"],
            "delivery_fee": app.config["DELIVERY_FEE"],
            "free_delivery_threshold": app.config["FREE_DELIVERY_THRESHOLD"],
        })

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # --- JSON error handlers ---
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Something went wrong"}), 500

    # --- Create tables on first boot ---
    with app.app_context():
        db.create_all()

    return app
