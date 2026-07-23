# Toto's Nest 🪺

A custom-built, full-stack e-commerce store for baby & kids essentials, themed
from the Toto's Nest logo (warm cream, sage green, soft clay). React + Vite on
the front, Flask + SQLite on the back, JWT auth, and a self-contained analytics
pipeline — no third-party storefront platform.

---

## Tech stack

**Frontend** — React 18 (JavaScript), Vite, React Router (with lazy-loaded
routes), Axios, Framer Motion, Recharts, plain CSS with design tokens.

**Backend** — Flask 3, SQLAlchemy ORM, SQLite, Flask-JWT-Extended, Flask-CORS,
organised as an application factory with Blueprints.

---

## Project structure

```
totos-nest/
├── backend/
│   ├── app/
│   │   ├── __init__.py         # app factory, CORS, error handlers, /settings
│   │   ├── config.py           # env-driven config (currency, delivery fee…)
│   │   ├── extensions.py       # db, jwt, cors instances
│   │   ├── models.py           # User, Product, Order, Review, Coupon, Visit…
│   │   ├── utils.py            # admin_required, order refs, pagination
│   │   └── blueprints/         # auth, products, orders, analytics, admin…
│   ├── seed.py                 # demo data + 30 days of synthetic analytics
│   ├── run.py                  # dev entry point
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js        # axios instance + JWT interceptor
    │   ├── context/             # Auth, Cart, Toast providers
    │   ├── hooks/useAnalytics   # pageview + funnel event tracking
    │   ├── components/          # Navbar, Footer, ProductCard, Loader…
    │   ├── pages/               # Home, Shop, Product, Cart, Checkout…
    │   │   ├── account/         # user dashboard (profile, orders, wishlist…)
    │   │   └── admin/           # dashboard, products, orders, analytics…
    │   └── styles/              # theme.css (brand tokens) + components.css
    ├── vite.config.js           # dev proxy /api -> :5000
    └── package.json
```

---

## Running it locally

You'll need **Python 3.10+** and **Node 18+**.

### 1. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                   # creates totos_nest.db with demo data
python run.py                    # API on http://localhost:5000
```

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev                      # app on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to Flask, so
there's nothing else to configure.

### Demo accounts (created by `seed.py`)

| Role        | Email                     | Password      |
|-------------|---------------------------|---------------|
| Super admin | admin@totosnest.co.ke     | `admin123`    |
| Manager     | manager@totosnest.co.ke   | `manager123`  |
| Staff       | staff@totosnest.co.ke     | `staff123`    |
| Customer    | mama@totosnest.co.ke      | `customer123` |

Everyone logs in at **/login**. After login the app redirects by role: customers
stay on the storefront; admins land in the admin panel at **/admin**.

---

## What's included

**Storefront** — home (hero, featured categories, new arrivals, best sellers,
testimonials, newsletter, Instagram strip), shop with filters (category, gender,
age, size, price, availability) + sorting + live search suggestions, product
detail (gallery, sizes, quantity, reviews, related), cart, guest/authed
checkout, order confirmation, about, contact, FAQ, auth, and a user account area
(profile, orders, wishlist, addresses).

**Admin** — dashboard (today/week/month visitors, orders & revenue today, low
stock, latest orders, top products), product CRUD with image/size/stock/featured
management, order management with the full status lifecycle
(pending → paid → packed → shipped → delivered / cancelled), customers with
total-spent, and an analytics view with visitor/sales charts, a conversion
funnel, and device/traffic breakdowns.

**Analytics pipeline** — `POST /api/track` records session id, visitor id, IP,
path, referrer, device, browser, OS and funnel events (pageview, add_to_cart,
checkout_started, purchase) into SQLite. The frontend fires it on every route
change via `useAnalytics`.

**Theming** — light and dark mode, toggled from the navbar (and the admin
header) with a sun/moon button. The choice persists and respects the device's
`prefers-color-scheme` on first visit. Dark mode is a warm espresso palette, not
cold black, to keep the soft feel. It's driven entirely by CSS variables in
`src/styles/theme.css` (a `[data-theme="dark"]` block), so restyling is central.

---

## Roles & access control

There is **one login** for everyone. A `role` field on each account decides two
things: where the client sends you after login, and what the server lets you
touch. Roles are `customer`, `super_admin`, `manager`, and `staff`.

Four endpoints carry the whole model:

- `POST /auth/register` — public; **always** creates a `customer`. Any role sent
  by the client is ignored, so nobody can self-promote.
- `POST /auth/login` — shared by everyone; returns a JWT with the role baked in
  as a claim.
- `POST /auth/admin-register` — the separate admin door; requires the invite
  code (`ADMIN_INVITE_CODE`). Wrong/absent code → `403`. This is the only path
  that can mint a non-customer role. There's a matching page at `/admin-register`.
- Protected routes — each admin route is guarded by a permission derived from
  the caller's role.

**The redirect and the hidden menu items are UX only — not security.** The real
boundary is server-side: every admin route re-checks the role from the token via
`permission_required(...)` and returns `403` if the permission isn't granted. A
customer token calling an admin endpoint directly is still rejected (verified in
`backend/rbac_test.py`).

The permission map is defined once in **`backend/app/roles.py`** and mirrored for
the client in **`frontend/src/permissions.js`**:

| Role        | Access |
|-------------|--------|
| super_admin | everything |
| manager     | everything except settings; team management limited to staff |
| staff       | orders, products (read), reviews, messages — no account management |

### Account creation & hierarchy

Who may create, edit, deactivate and delete whom (`MANAGEABLE_ROLES` in
`roles.py`, mirrored in `permissions.js`), managed from **Admin → Team**:

| Actor       | Can manage        |
|-------------|-------------------|
| super_admin | managers + staff  |
| manager     | staff only        |
| staff       | nobody            |
| customer    | nobody            |

Two roles are deliberately *not* manageable through the panel:

- **Customers** self-register on the public Sign Up page and are never created
  or role-changed by an admin.
- **Super admins** can't be created or edited here either — they come only from
  the seed or the invite-code endpoint — so no account can escalate to, or
  tamper with, the top role.

Admins also can't act on their own account through this screen, which prevents
self-lockout and self-deletion.

**Deactivating** an account keeps its data and history but blocks sign-in — and
because the check runs on every authenticated request, any token the user
already holds stops working immediately rather than lingering until it expires.

To add a role or change what one can do, edit the map in `roles.py` (and mirror
it in `permissions.js`) — the route guards and the sidebar both follow from it.

## Extending it (structure is ready)

- **Payments** — the checkout creates a `pending` order and stops at a clearly
  marked `PAYMENT INTEGRATION POINT` in `backend/app/blueprints/orders.py`. Drop
  in an M-Pesa STK push, Stripe PaymentIntent, or PayPal order there and flip the
  status to `paid` on the provider callback.
- **Notifications** — order creation is the single hook point for email / SMS /
  push. Add your provider call right after `db.session.commit()`.
- **Config** — currency, delivery fee, and the free-delivery threshold are all
  environment variables (see `backend/config` defaults); no code changes needed.

Copy `backend/.env.example` and `frontend/.env.example` to `.env` and set real
secrets before deploying.

---

## Notes

- Product photos in the seed data point to Unsplash URLs, so the catalogue needs
  an internet connection to show images the first time. Swap in your own product
  photography (or a real upload flow) for production.
- SQLite is perfect for development and small stores. For higher traffic, point
  `DATABASE_URL` at PostgreSQL — SQLAlchemy handles the rest.
