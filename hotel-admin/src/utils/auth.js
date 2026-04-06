// ─── Role Mapping : Backend → Frontend ───────────────────────────────────────
// Backend roles : ADMIN | OWNER | MANAGER | RECEPTIONIST | ACCOUNTANT
// Frontend roles: SUPER_ADMIN | GERANT | RECEPTION

const ROLE_MAP = {
  ADMIN:        'SUPER_ADMIN',
  OWNER:        'SUPER_ADMIN',
  MANAGER:      'GERANT',
  ACCOUNTANT:   'GERANT',
  RECEPTIONIST: 'RECEPTION',
};

// ─── Allowed Routes per Frontend Role ────────────────────────────────────────
export const ALLOWED_ROUTES = {
  SUPER_ADMIN: ['*'],
  GERANT:      ['/dashboard', '/rooms', '/halls', '/hall-bookings', '/stock', '/employees', '/reservations'],
  RECEPTION:   ['/dashboard', '/rooms', '/halls', '/hall-bookings', '/reservations'],
};

// ─── saveAuth ─────────────────────────────────────────────────────────────────
/**
 * Map backend role → frontend role, then persist token, role and userName.
 * @param {string} token       - JWT from API
 * @param {string} backendRole - Role value from the backend (ADMIN, MANAGER…)
 * @param {string} userName    - Display name from the API response
 */
export function saveAuth(token, backendRole, userName) {
  const role = ROLE_MAP[backendRole] || 'RECEPTION';
  localStorage.setItem('token',    token);
  localStorage.setItem('role',     role);
  localStorage.setItem('userName', userName || '');
}

// ─── getAuth ──────────────────────────────────────────────────────────────────
/**
 * Read auth data from localStorage.
 * @returns {{ token: string|null, role: string|null, userName: string|null }}
 */
export function getAuth() {
  return {
    token:    localStorage.getItem('token'),
    role:     localStorage.getItem('role'),
    userName: localStorage.getItem('userName'),
  };
}

// ─── clearAuth ────────────────────────────────────────────────────────────────
/**
 * Remove all auth data from localStorage (logout).
 */
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
}

// ─── canAccess ────────────────────────────────────────────────────────────────
/**
 * Check whether a given frontend role is allowed to visit a route.
 * @param {string} route    - e.g. '/stock'
 * @param {string} userRole - Frontend role (SUPER_ADMIN | GERANT | RECEPTION)
 * @returns {boolean}
 */
export function canAccess(route, userRole) {
  if (!userRole) return false;
  const allowed = ALLOWED_ROUTES[userRole];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some((r) => route === r || route.startsWith(r + '/'));
}

