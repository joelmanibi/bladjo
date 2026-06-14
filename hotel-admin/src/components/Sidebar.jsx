import { NavLink } from 'react-router-dom';
import { canAccess, getAuth } from '../utils/auth';
import { getInterfaceMeta, getRouteGroup, isRouteVisibleInInterface, useAdminInterface } from '../utils/adminInterface';

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

export default function Sidebar({ mobile = false, open = true, onClose = () => {}, compact = false }) {
  const { role, backendRole } = getAuth();
  const { currentInterface } = useAdminInterface();
  const interfaceMeta = getInterfaceMeta(currentInterface);
  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(role)
      && canAccess(item.path, role, backendRole)
      && isRouteVisibleInInterface(item.path, currentInterface)
  );
  const globalItems = visibleItems.filter((item) => getRouteGroup(item.path) === 'GLOBAL');
  const domainItems = visibleItems.filter((item) => getRouteGroup(item.path) !== 'GLOBAL');

  return (
    <>
      {mobile && open && <button type="button" style={styles.overlay} onClick={onClose} aria-label="Fermer la navigation" />}
      <aside
        style={{
          ...styles.sidebar,
          ...(compact ? styles.sidebarCompact : {}),
          ...(mobile ? styles.sidebarMobile : {}),
          ...(mobile ? { transform: open ? 'translateX(0)' : 'translateX(-100%)' } : {}),
        }}
      >
      {/* Brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🏨</span>
        <div style={styles.brandTextWrap}>
          <span style={styles.brandName}>Bladjo Hotel</span>
          <span style={styles.brandSub}>ERP multi-activité</span>
        </div>
        {mobile && (
          <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Fermer le menu">
            ✕
          </button>
        )}
      </div>

      <div style={{ ...styles.contextCard, borderColor: interfaceMeta.accent, background: interfaceMeta.accentMuted }}>
        <span style={styles.contextLabel}>Interface active</span>
        <strong style={{ ...styles.contextValue, color: interfaceMeta.accentText }}>{interfaceMeta.icon} {interfaceMeta.label}</strong>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {globalItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={mobile ? onClose : undefined}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? { ...styles.navItemActive, background: interfaceMeta.accent, boxShadow: `0 10px 24px ${interfaceMeta.accent}33` } : {}),
            })}
          >
            <span style={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}

        {domainItems.length > 0 && (
          <>
            <span style={{ ...styles.sectionLabel, color: interfaceMeta.accentSoft }}>{interfaceMeta.label}</span>
            {domainItems.map(({ label, path, icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={mobile ? onClose : undefined}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? { ...styles.navItemActive, background: interfaceMeta.accent, boxShadow: `0 10px 24px ${interfaceMeta.accent}33` } : {}),
                })}
              >
                <span style={styles.navIcon}>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={styles.sidebarFooter}>
        <span style={styles.footerText}>Administration</span>
      </div>
      </aside>
    </>
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
    overflow: 'hidden',
    boxShadow: '8px 0 30px rgba(15,23,42,0.12)',
    zIndex: 20,
  },
  sidebarCompact: {
    width: '224px',
    minWidth: '224px',
  },
  sidebarMobile: {
    position: 'fixed',
    left: 0,
    width: 'min(88vw, 320px)',
    minWidth: 'min(88vw, 320px)',
    transition: 'transform 0.22s ease',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.45)',
    border: 'none',
    zIndex: 19,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  closeBtn: { marginLeft: 'auto', width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: '14px' },
  brandIcon: { fontSize: '24px' },
  brandTextWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.3px',
  },
  brandSub: { fontSize: '11px', color: 'rgba(255,255,255,0.48)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
  contextCard: {
    margin: '14px 12px 0',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  contextLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 },
  contextValue: { fontSize: '14px' },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    gap: '4px',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.18) transparent',
  },
  sectionLabel: { padding: '14px 12px 6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.34)', fontWeight: 700 },
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
    transition: 'background 0.15s, color 0.15s, transform 0.15s',
  },
  navItemActive: {
    color: '#ffffff',
  },
  navIcon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  footerText: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' },
};

