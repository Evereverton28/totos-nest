"""Analytics pipeline.

`POST /api/track` is called by the frontend on every route change (and for
key funnel events). It parses the User-Agent server-side so the client only
sends a session id, visitor id, path and event name.

`GET /api/analytics/*` endpoints power the admin analytics dashboard and are
admin-guarded.
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from user_agents import parse as parse_ua
from ..extensions import db
from ..models import Visit, Order, Product
from ..utils import permission_required
from ..roles import ANALYTICS

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.post("/track")
def track():
    """Record a pageview or funnel event. Fire-and-forget from the client."""
    data = request.get_json() or {}
    ua = parse_ua(request.headers.get("User-Agent", ""))
    device = ("mobile" if ua.is_mobile else
              "tablet" if ua.is_tablet else "desktop")

    visit = Visit(
        session_id=data.get("session_id"),
        visitor_id=data.get("visitor_id"),
        ip=request.headers.get("X-Forwarded-For", request.remote_addr),
        path=data.get("path"),
        referrer=data.get("referrer") or request.referrer,
        device_type=device,
        browser=ua.browser.family,
        os=ua.os.family,
        event=data.get("event", "pageview"),
        meta=data.get("meta"),
    )
    db.session.add(visit)
    db.session.commit()
    return jsonify({"ok": True}), 201


# ---------------------------------------------------------------------------
# Admin analytics
# ---------------------------------------------------------------------------
def _since(days):
    return datetime.utcnow() - timedelta(days=days)


@analytics_bp.get("/analytics/overview")
@permission_required(ANALYTICS)
def overview():
    today = datetime.utcnow().date()
    day_start = datetime(today.year, today.month, today.day)

    def visits_since(dt, unique=False):
        q = Visit.query.filter(Visit.event == "pageview", Visit.created_at >= dt)
        if unique:
            return db.session.query(func.count(func.distinct(Visit.visitor_id))) \
                .filter(Visit.event == "pageview", Visit.created_at >= dt).scalar()
        return q.count()

    orders_today = Order.query.filter(Order.created_at >= day_start).count()
    revenue_today = db.session.query(func.coalesce(func.sum(Order.total), 0)) \
        .filter(Order.created_at >= day_start,
                Order.status != "cancelled").scalar()
    low_stock = Product.query.filter(Product.stock <= 5).count()

    return jsonify({
        "visitors_today": visits_since(day_start),
        "visitors_week": visits_since(_since(7)),
        "visitors_month": visits_since(_since(30)),
        "unique_visitors": visits_since(_since(30), unique=True),
        "orders_today": orders_today,
        "revenue_today": round(revenue_today, 2),
        "low_stock_items": low_stock,
    })


@analytics_bp.get("/analytics/visitors-series")
@permission_required(ANALYTICS)
def visitors_series():
    """Daily pageviews + unique visitors for the last N days."""
    days = int(request.args.get("days", 14))
    out = []
    for i in range(days - 1, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        start = datetime(day.year, day.month, day.day)
        end = start + timedelta(days=1)
        views = Visit.query.filter(Visit.event == "pageview",
                                   Visit.created_at >= start,
                                   Visit.created_at < end).count()
        uniques = db.session.query(func.count(func.distinct(Visit.visitor_id))) \
            .filter(Visit.event == "pageview", Visit.created_at >= start,
                    Visit.created_at < end).scalar()
        out.append({"date": day.strftime("%b %d"),
                    "visitors": views, "unique": uniques})
    return jsonify(out)


@analytics_bp.get("/analytics/sales-series")
@permission_required(ANALYTICS)
def sales_series():
    """Daily revenue + order count for the last N days."""
    days = int(request.args.get("days", 14))
    out = []
    for i in range(days - 1, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        start = datetime(day.year, day.month, day.day)
        end = start + timedelta(days=1)
        rows = Order.query.filter(Order.created_at >= start,
                                  Order.created_at < end,
                                  Order.status != "cancelled").all()
        out.append({"date": day.strftime("%b %d"),
                    "revenue": round(sum(o.total for o in rows), 2),
                    "orders": len(rows)})
    return jsonify(out)


@analytics_bp.get("/analytics/funnel")
@permission_required(ANALYTICS)
def funnel():
    """Conversion funnel + rate over the last 30 days."""
    since = _since(30)

    def count(event):
        return Visit.query.filter(Visit.event == event,
                                  Visit.created_at >= since).count()

    sessions = db.session.query(func.count(func.distinct(Visit.session_id))) \
        .filter(Visit.created_at >= since).scalar() or 0
    add_to_cart = count("add_to_cart")
    checkout = count("checkout_started")
    purchases = Order.query.filter(Order.created_at >= since).count()

    rate = round((purchases / sessions * 100), 2) if sessions else 0
    return jsonify({
        "sessions": sessions,
        "add_to_cart": add_to_cart,
        "checkout_started": checkout,
        "purchases": purchases,
        "conversion_rate": rate,
    })


@analytics_bp.get("/analytics/top")
@permission_required(ANALYTICS)
def top_breakdowns():
    """Top viewed products, most-visited pages, device + traffic-source mix."""
    top_products = (Product.query.order_by(Product.views.desc()).limit(5).all())

    top_pages = (db.session.query(Visit.path, func.count(Visit.id).label("c"))
                 .filter(Visit.event == "pageview")
                 .group_by(Visit.path).order_by(func.count(Visit.id).desc())
                 .limit(6).all())

    devices = (db.session.query(Visit.device_type, func.count(Visit.id))
               .filter(Visit.event == "pageview")
               .group_by(Visit.device_type).all())

    sources = (db.session.query(Visit.referrer, func.count(Visit.id))
               .filter(Visit.event == "pageview")
               .group_by(Visit.referrer).order_by(func.count(Visit.id).desc())
               .limit(5).all())

    return jsonify({
        "top_products": [{"name": p.name, "views": p.views,
                          "sold": p.sold_count} for p in top_products],
        "top_pages": [{"path": p or "/", "views": c} for p, c in top_pages],
        "devices": [{"name": d or "unknown", "value": c} for d, c in devices],
        "sources": [{"name": (r or "direct")[:40], "value": c} for r, c in sources],
    })
