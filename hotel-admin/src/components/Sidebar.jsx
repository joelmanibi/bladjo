import { NavLink } from 'react-router-dom';
import { getAuth } from '../utils/auth';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard',    icon: '🏠', roles: ['SUPER_ADMIN', 'GERANT', 'RECEPTION'] },
  { label: 'Utilisateurs', path: '/users',        icon: '👥', roles: ['SUPER_ADMIN'] },
  { label: 'Chambres',     path: '/rooms',        icon: '🛏️', roles: ['SUPER_ADMIN', 'GERANT', 'RECEPTION'] },
  { label: 'Salles',       path: '/halls',        icon: '🎉', roles: ['SUPER_ADMIN', 'GERANT', 'RECEPTION'] },
  { label: 'Réservations', path: '/reservations', icon: '📅', roles: ['SUPER_ADMIN', 'GERANT', 'RECEPTION'] },
  { label: 'Résa. salles', path: '/hall-bookings', icon: '🗓️', roles: ['SUPER_ADMIN', 'GERANT', 'RECEPTION'] },
  { label: 'Stock',         path: '/stock',        icon: '📦', roles: ['SUPER_ADMIN', 'GERANT'] },
  { label: "Bons d'achat", path: '/commandes',    icon: '📋', roles: ['SUPER_ADMIN', 'GERANT'] },
  { label: 'Employés',     path: '/employees',    icon: '👷', roles: ['SUPER_ADMIN', 'GERANT'] },
  // ── Immobilier ──────────────────────────────────────────────────────────────
  { label: 'Immeubles',    path: '/immeubles',    icon: '🏢', roles: ['SUPER_ADMIN', 'GERANT'] },
  { label: 'Appartements', path: '/appartements', icon: '🚪', roles: ['SUPER_ADMIN', 'GERANT'] },
  { label: 'Locataires',   path: '/locataires',   icon: '🧑‍🤝‍🧑', roles: ['SUPER_ADMIN', 'GERANT'] },
  { label: 'Loyers',       path: '/loyers',       icon: '💰', roles: ['SUPER_ADMIN', 'GERANT'] },
  { label: 'Paiements',   path: '/paiements',    icon: '💳', roles: ['SUPER_ADMIN', 'GERANT'] },
];

export default function Sidebar() {
  const { role } = getAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🏨</span>
        <span style={styles.brandName}>Bladjo Hotel</span>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {visibleItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={styles.sidebarFooter}>
        <span style={styles.footerText}>Administration</span>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    minWidth: '240px',
    height: '100vh',
    background: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  brandIcon: { fontSize: '24px' },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.3px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    gap: '4px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.65)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: {
    background: 'rgba(37,99,235,0.85)',
    color: '#ffffff',
  },
  navIcon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  footerText: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' },
};

