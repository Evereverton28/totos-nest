"""Order endpoints: create (checkout), list the current user's orders,
and look one up by reference.

Payment is intentionally left as a stub returning a `pending` order so
M-Pesa / Stripe / PayPal can be dropped in at the marked point without
touching the rest of the flow.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models import Order, OrderItem, Product, Coupon
from ..utils import gen_reference

orders_bp = Blueprint("orders", __name__)


def _current_user_id_optional():
    """Return the user id if a valid token is present, else None (guest)."""
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


@orders_bp.post("/orders")
def create_order():
    data = request.get_json() or {}
    items = data.get("items", [])
    if not items:
        return jsonify({"error": "Your cart is empty"}), 400

    subtotal = 0
    order_items = []
    for line in items:
        product = Product.query.get(line.get("product_id"))
        if not product:
            continue
        qty = max(1, int(line.get("quantity", 1)))
        if product.stock < qty:
            return jsonify({"error": f"{product.name} is out of stock"}), 400
        subtotal += product.price * qty
        order_items.append((product, qty, line.get("size")))

    # --- Delivery fee (free above threshold) ---
    fee = current_app.config["DELIVERY_FEE"]
    if subtotal >= current_app.config["FREE_DELIVERY_THRESHOLD"]:
        fee = 0

    # --- Coupon ---
    discount = 0
    coupon_code = (data.get("coupon_code") or "").strip().upper()
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code, active=True).first()
        if coupon and subtotal >= coupon.min_spend:
            discount = (subtotal * coupon.value / 100 if coupon.kind == "percent"
                        else coupon.value)

    total = round(subtotal + fee - discount, 2)

    order = Order(
        reference=gen_reference(),
        user_id=_current_user_id_optional(),
        customer_name=data.get("customer_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        city=data.get("city"),
        county=data.get("county"),
        subtotal=round(subtotal, 2),
        delivery_fee=fee,
        discount=round(discount, 2),
        total=total,
        coupon_code=coupon_code or None,
        payment_method=data.get("payment_method", "mpesa"),
        status="pending",
    )
    db.session.add(order)
    db.session.flush()  # assign order.id before adding items

    for product, qty, size in order_items:
        db.session.add(OrderItem(
            order_id=order.id, product_id=product.id, name=product.name,
            image=product.to_dict()["image"], price=product.price,
            size=size, quantity=qty,
        ))
        product.stock -= qty
        product.sold_count += qty

    # ---------------------------------------------------------------
    # PAYMENT INTEGRATION POINT
    # Kick off M-Pesa STK push / Stripe intent here, then set status
    # to "paid" on the provider callback. Left as "pending" for now.
    # ---------------------------------------------------------------

    db.session.commit()
    return jsonify(order.to_dict()), 201


@orders_bp.get("/orders/mine")
@jwt_required()
def my_orders():
    orders = (Order.query.filter_by(user_id=get_jwt_identity())
              .order_by(Order.created_at.desc()).all())
    return jsonify([o.to_dict() for o in orders])


@orders_bp.get("/orders/<reference>")
def order_by_reference(reference):
    order = Order.query.filter_by(reference=reference).first_or_404()
    return jsonify(order.to_dict())
