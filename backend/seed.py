"""Populate the database with demo data.

Run once after install:  python seed.py

Creates:
  - an admin account (admin@totosnest.co.ke / admin123)
  - a demo customer (mama@totosnest.co.ke / customer123)
  - 6 categories, ~18 products with images
  - 2 coupons, a hero banner
  - 30 days of synthetic visits + a few orders so the admin
    dashboard and analytics charts have something to show.
"""
import json
import random
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models import (User, Category, Product, ProductImage, Review,
                        Order, OrderItem, Coupon, Banner, Visit)

app = create_app()

# Unsplash source images (baby / kids clothing themed) -----------------------
IMG = {
    "bodysuits": [
        "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800",
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800",
    ],
    "dresses": [
        "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800",
    ],
    "shoes": [
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800",
    ],
    "blankets": [
        "https://images.unsplash.com/photo-1584839404042-8d1e50e37e0e?w=800",
        "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=800",
    ],
    "toys": [
        "https://images.unsplash.com/photo-1558877385-8c1b8e6f2d3f?w=800",
        "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=800",
    ],
    "sets": [
        "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=800",
        "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
    ],
}

CATEGORIES = [
    ("Bodysuits & Rompers", "bodysuits", "Soft cotton bodysuits and rompers for everyday snuggles."),
    ("Dresses", "dresses", "Twirl-worthy dresses for little ones."),
    ("Shoes & Booties", "shoes", "First steps in the softest little shoes."),
    ("Blankets & Swaddles", "blankets", "Cosy, breathable blankets for nap time."),
    ("Toys & Gifts", "toys", "Gentle first toys and gift-ready keepsakes."),
    ("Outfit Sets", "sets", "Coordinated sets, ready to gift or wear."),
]

PRODUCTS = [
    # name, cat_slug, price, compare, stock, gender, age, sizes, featured, best, img_key
    ("Organic Cotton Bodysuit", "bodysuits", 950, 1200, 40, "unisex", "0-2y", ["0-3m","3-6m","6-12m"], True, True, "bodysuits"),
    ("Ribbed Long-Sleeve Romper", "bodysuits", 1250, None, 25, "unisex", "0-2y", ["0-3m","3-6m"], True, False, "bodysuits"),
    ("Bamboo Sleep Onesie", "bodysuits", 1400, 1650, 30, "unisex", "newborn", ["nb","0-3m"], False, True, "bodysuits"),
    ("Floral Tiered Dress", "dresses", 1800, None, 18, "girl", "0-2y", ["6-12m","12-18m","2y"], True, True, "dresses"),
    ("Linen Pinafore Dress", "dresses", 2100, 2500, 12, "girl", "3-5y", ["2y","3y","4y"], True, False, "dresses"),
    ("Sunday Best Party Dress", "dresses", 2600, None, 9, "girl", "3-5y", ["3y","4y","5y"], False, True, "dresses"),
    ("Soft Sole Booties", "shoes", 890, None, 50, "unisex", "0-2y", ["s","m","l"], True, True, "shoes"),
    ("First Walker Sneakers", "shoes", 1650, 1950, 22, "unisex", "0-2y", ["4","5","6"], False, False, "shoes"),
    ("Knit Baby Slippers", "shoes", 750, None, 35, "unisex", "newborn", ["nb","0-3m"], False, False, "shoes"),
    ("Muslin Swaddle Set (3)", "blankets", 2200, 2700, 28, "unisex", "newborn", ["one"], True, True, "blankets"),
    ("Waffle Knit Blanket", "blankets", 1900, None, 20, "unisex", "0-2y", ["one"], True, False, "blankets"),
    ("Hooded Baby Towel", "blankets", 1350, None, 33, "unisex", "0-2y", ["one"], False, True, "blankets"),
    ("Wooden Rattle Toy", "toys", 650, None, 60, "unisex", "newborn", ["one"], True, False, "toys"),
    ("Plush Bunny Comforter", "toys", 1100, 1400, 40, "unisex", "0-2y", ["one"], True, True, "toys"),
    ("Stacking Rings Set", "toys", 980, None, 25, "unisex", "0-2y", ["one"], False, False, "toys"),
    ("3-Piece Coming Home Set", "sets", 2900, 3400, 15, "unisex", "newborn", ["nb","0-3m"], True, True, "sets"),
    ("Weekend Playwear Set", "sets", 2400, None, 19, "boy", "0-2y", ["6-12m","12-18m"], True, False, "sets"),
    ("Matching Sibling Set", "sets", 3200, 3800, 8, "unisex", "3-5y", ["2y","3y","4y"], False, True, "sets"),
]

REVIEW_TEXTS = [
    ("Amina W.", 5, "Beautiful quality and so soft. My baby lives in these!"),
    ("Grace M.", 5, "Fast delivery in Nairobi and the fabric is lovely."),
    ("Joy K.", 4, "Lovely fit, ordered a size up and it was perfect."),
    ("Njeri T.", 5, "Gifted this and the mum-to-be loved it. Will buy again."),
]


def run():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # --- Users (one of each role so permissions are demonstrable) ---
        admin = User(name="Store Admin", email="admin@totosnest.co.ke",
                     role="super_admin")
        admin.set_password("admin123")
        manager = User(name="Wanjiru (Manager)", email="manager@totosnest.co.ke",
                       role="manager")
        manager.set_password("manager123")
        staff = User(name="Otieno (Staff)", email="staff@totosnest.co.ke",
                     role="staff")
        staff.set_password("staff123")
        customer = User(name="Mama Zawadi", email="mama@totosnest.co.ke",
                        phone="0712345678", role="customer")
        customer.set_password("customer123")
        db.session.add_all([admin, manager, staff, customer])

        # --- Categories ---
        cat_map = {}
        for name, slug, desc in CATEGORIES:
            c = Category(name=name, slug=slug, description=desc, image=IMG[slug][0])
            db.session.add(c)
            cat_map[slug] = c
        db.session.flush()

        # --- Products ---
        products = []
        base = datetime.utcnow()
        for i, (name, slug, price, cmp, stock, gender, age, sizes, feat, best, key) in enumerate(PRODUCTS):
            p = Product(
                name=name, slug=name.lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-"),
                description=(f"{name} from Toto's Nest — made from gentle, "
                             "skin-friendly fabrics chosen for comfort and durability. "
                             "Easy to wash, easy to love. Ethically sourced and "
                             "designed for busy Kenyan families."),
                price=price, compare_at_price=cmp, stock=stock,
                category_id=cat_map[slug].id, gender=gender, age_group=age,
                sizes=json.dumps(sizes), is_featured=feat, is_best_seller=best,
                sold_count=random.randint(5, 90), views=random.randint(30, 400),
                created_at=base - timedelta(days=i),
            )
            db.session.add(p)
            db.session.flush()
            for pos, url in enumerate(IMG[key]):
                db.session.add(ProductImage(product_id=p.id, url=url, position=pos))
            # a couple of reviews each
            for author, rating, text in random.sample(REVIEW_TEXTS, k=random.randint(1, 3)):
                db.session.add(Review(product_id=p.id, author_name=author,
                                      rating=rating, comment=text,
                                      created_at=base - timedelta(days=random.randint(1, 20))))
            products.append(p)

        # --- Coupons ---
        db.session.add_all([
            Coupon(code="WELCOME10", kind="percent", value=10, min_spend=1000),
            Coupon(code="NEST500", kind="fixed", value=500, min_spend=3000),
        ])

        # --- Banner ---
        db.session.add(Banner(
            title="Softness for the littlest ones",
            subtitle="Thoughtfully made baby & kids essentials, delivered across Kenya.",
            image=IMG["dresses"][0], cta_text="Shop new arrivals",
            cta_link="/shop", position=0))

        # --- Synthetic analytics (30 days of visits) ---
        pages = ["/", "/shop", "/product/organic-cotton-bodysuit", "/cart",
                 "/about", "/contact", "/categories"]
        browsers = ["Chrome", "Safari", "Firefox", "Edge"]
        oses = ["Android", "iOS", "Windows", "Mac OS X"]
        devices = ["mobile", "mobile", "mobile", "desktop", "tablet"]
        sources = ["https://instagram.com", "https://tiktok.com",
                   "https://google.com", None, None]
        for d in range(30):
            day = base - timedelta(days=d)
            for _ in range(random.randint(20, 80)):
                vid = f"v{random.randint(1, 300)}"
                db.session.add(Visit(
                    session_id=f"s{random.randint(1, 800)}", visitor_id=vid,
                    ip="127.0.0.1", path=random.choice(pages),
                    referrer=random.choice(sources),
                    device_type=random.choice(devices),
                    browser=random.choice(browsers), os=random.choice(oses),
                    event="pageview",
                    created_at=day - timedelta(minutes=random.randint(0, 1400))))
            # funnel events
            for _ in range(random.randint(3, 12)):
                db.session.add(Visit(session_id=f"s{random.randint(1,800)}",
                    visitor_id=f"v{random.randint(1,300)}", path="/cart",
                    device_type=random.choice(devices), event="add_to_cart",
                    created_at=day))
            for _ in range(random.randint(1, 5)):
                db.session.add(Visit(session_id=f"s{random.randint(1,800)}",
                    visitor_id=f"v{random.randint(1,300)}", path="/checkout",
                    device_type=random.choice(devices), event="checkout_started",
                    created_at=day))

        # --- A few real orders ---
        for d in range(14):
            if random.random() < 0.7:
                day = base - timedelta(days=d)
                chosen = random.sample(products, k=random.randint(1, 3))
                sub = sum(p.price for p in chosen)
                o = Order(reference=f"TN-SEED{d:02d}", user_id=customer.id,
                          customer_name=customer.name, email=customer.email,
                          phone=customer.phone, address="Kilimani", city="Nairobi",
                          county="Nairobi", subtotal=sub, delivery_fee=350,
                          discount=0, total=sub + 350,
                          status=random.choice(["delivered", "shipped", "paid", "pending"]),
                          created_at=day)
                db.session.add(o)
                db.session.flush()
                for p in chosen:
                    db.session.add(OrderItem(order_id=o.id, product_id=p.id,
                        name=p.name, image=IMG[[k for k in IMG][0]][0],
                        price=p.price, quantity=1))

        db.session.commit()
        print("✓ Seed complete.")
        print("  Super admin: admin@totosnest.co.ke   / admin123")
        print("  Manager:     manager@totosnest.co.ke / manager123")
        print("  Staff:       staff@totosnest.co.ke   / staff123")
        print("  Customer:    mama@totosnest.co.ke    / customer123")
        print(f"  {len(products)} products, {len(CATEGORIES)} categories.")


if __name__ == "__main__":
    run()
