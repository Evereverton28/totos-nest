"""Roles and permissions — the single source of truth for authorization.

Define the map once here and enforce it in the route guards (see utils.py).
The frontend mirrors this map in `src/permissions.js`, but that copy is only
for UX (hiding menus / choosing where to redirect). The real boundary is here,
on the server: every protected route re-checks the role and returns 403 if the
permission isn't granted, so a customer token calling an admin endpoint directly
is still rejected.
"""

# --- Roles -----------------------------------------------------------------
CUSTOMER = "customer"
SUPER_ADMIN = "super_admin"
MANAGER = "manager"
STAFF = "staff"

# Any role that belongs in the admin panel (i.e. not a shopper).
ADMIN_ROLES = {SUPER_ADMIN, MANAGER, STAFF}
# Roles that /auth/admin-register is allowed to mint.
ASSIGNABLE_ADMIN_ROLES = {SUPER_ADMIN, MANAGER, STAFF}


# --- Permissions (named capabilities) --------------------------------------
DASHBOARD = "dashboard"            # view the admin dashboard summary
PRODUCTS_READ = "products:read"    # view products in admin
PRODUCTS_WRITE = "products:write"  # add / edit / delete products
CATEGORIES = "categories"          # manage categories
ORDERS = "orders"                  # view orders & update status
CUSTOMERS = "customers"            # view the customer list
REVIEWS = "reviews"                # moderate reviews
MESSAGES = "messages"              # read contact messages
COUPONS = "coupons"                # manage coupons
BANNERS = "banners"                # manage homepage banners
ANALYTICS = "analytics"            # view analytics dashboards
USER_MANAGEMENT = "user_management"  # manage admin accounts & roles
SETTINGS = "settings"              # change store settings


# --- Role -> permissions ---------------------------------------------------
# super_admin: everything. manager: everything except user-management &
# settings. staff: orders, products (read only), reviews, messages.
_ALL = {
    DASHBOARD, PRODUCTS_READ, PRODUCTS_WRITE, CATEGORIES, ORDERS, CUSTOMERS,
    REVIEWS, MESSAGES, COUPONS, BANNERS, ANALYTICS, USER_MANAGEMENT, SETTINGS,
}

PERMISSIONS = {
    SUPER_ADMIN: set(_ALL),
    MANAGER: _ALL - {USER_MANAGEMENT, SETTINGS},
    STAFF: {ORDERS, PRODUCTS_READ, REVIEWS, MESSAGES},
    CUSTOMER: set(),
}


def has_permission(role, permission):
    """True if the given role is granted the permission."""
    return permission in PERMISSIONS.get(role, set())


def permissions_for(role):
    """The sorted list of permissions a role holds (handy for the client)."""
    return sorted(PERMISSIONS.get(role, set()))
