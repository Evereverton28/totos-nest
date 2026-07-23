// Mirror of the backend role map (app/roles.py). This is UX ONLY — it decides
// where to redirect and which menu items to show. It is NOT security: every
// admin API route re-checks the role on the server and returns 403 regardless
// of what the client does here.

export const ADMIN_ROLES = ['super_admin', 'manager', 'staff']

export const PERMISSIONS = {
  super_admin: [
    'dashboard', 'products:read', 'products:write', 'categories', 'orders',
    'customers', 'reviews', 'messages', 'coupons', 'banners', 'analytics',
    'user_management', 'settings',
  ],
  manager: [
    'dashboard', 'products:read', 'products:write', 'categories', 'orders',
    'customers', 'reviews', 'messages', 'coupons', 'banners', 'analytics',
    'user_management',
  ],
  staff: ['orders', 'products:read', 'reviews', 'messages'],
  customer: [],
}

// Account-creation hierarchy — mirrors MANAGEABLE_ROLES in app/roles.py.
// Customers are absent by design: they self-register and are never created by
// an admin. Super admins are absent too, so the top role can't be assigned.
export const MANAGEABLE_ROLES = {
  super_admin: ['manager', 'staff'],
  manager: ['staff'],
  staff: [],
  customer: [],
}

export const manageableRoles = (role) => MANAGEABLE_ROLES[role] || []

export const canManageRole = (actorRole, targetRole) =>
  manageableRoles(actorRole).includes(targetRole)

export const ROLE_LABELS = {
  super_admin: 'Super admin',
  manager: 'Manager',
  staff: 'Staff',
  customer: 'Customer',
}

export const isAdminRole = (role) => ADMIN_ROLES.includes(role)

export const can = (user, permission) =>
  !!user && (PERMISSIONS[user.role] || []).includes(permission)

// Where to send a user after login. Customers go to the storefront; admins
// land on the first admin section their role can actually open.
const ADMIN_LANDING_ORDER = [
  ['dashboard', '/admin'],
  ['orders', '/admin/orders'],
  ['products:read', '/admin/products'],
  ['reviews', '/admin/reviews'],
]

export function landingFor(user, fallback = '/account') {
  if (!user) return '/login'
  if (!isAdminRole(user.role)) return fallback
  const perms = PERMISSIONS[user.role] || []
  const match = ADMIN_LANDING_ORDER.find(([perm]) => perms.includes(perm))
  return match ? match[1] : '/admin'
}
