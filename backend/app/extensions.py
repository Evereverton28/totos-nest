"""Extension instances created here and initialised in the app factory.

Keeping them in their own module prevents circular imports between the
factory, models and blueprints.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
