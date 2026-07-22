"""Application configuration.

Values are read from environment variables (see .env.example) so the same
codebase can run in development, staging and production without edits.
"""
import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    # --- Core ---
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-in-production-0123456789")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me-in-production-0123456789")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Shared secret required by POST /auth/admin-register to mint admin accounts.
    ADMIN_INVITE_CODE = os.getenv("ADMIN_INVITE_CODE", "totos-nest-admin-2026")

    # --- Database ---
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///" + os.path.join(BASE_DIR, "totos_nest.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Store settings (surfaced to the frontend via /api/settings) ---
    STORE_NAME = os.getenv("STORE_NAME", "Toto's Nest")
    CURRENCY = os.getenv("CURRENCY", "KES")
    DELIVERY_FEE = float(os.getenv("DELIVERY_FEE", "350"))
    FREE_DELIVERY_THRESHOLD = float(os.getenv("FREE_DELIVERY_THRESHOLD", "5000"))

    # CORS origins for the Vite dev server / deployed frontend
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
