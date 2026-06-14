import { useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';
import { ADMIN_INTERFACES, getInterfaceMeta, useAdminInterface } from '../utils/adminInterface';

// Label and color for each role badge
const ROLE_META = {
  OWNER:       { label: 'Propriétaire', bg: '#ede9fe', color: '#6d28d9' },
  ADMIN:       { label: 'Admin',        bg: '#dbeafe', color: '#1d4ed8' },
  MANAGER:     { label: 'Gérant',       bg: '#dcfce7', color: '#16a34a' },
  ACCOUNTANT:  { label: 'Comptable',    bg: '#fef3c7', color: '#b45309' },
  RECEPTIONIST:{ label: 'Réception',    bg: '#ffedd5', color: '#c2410c' },
  SUPER_ADMIN: { label: 'Super Admin', bg: '#dbeafe', color: '#1d4ed8' },
  GERANT:      { label: 'Gérant',      bg: '#dcfce7', color: '#16a34a' },
  RECEPTION:   { label: 'Réception',   bg: '#ffedd5', color: '#c2410c' },
};

export default function Topbar({ title, onToggleSidebar, isMobile = false, isTablet = false }) {
  const navigate = useNavigate();
  const { userName, role, backendRole } = getAuth();
  const { currentInterface, availableInterfaces, routeGroup, setCurrentInterface } = useAdminInterface();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const switchInterface = (nextInterface) => {
    if (nextInterface === currentInterface) return;
    setCurrentInterface(nextInterface);
    if (routeGroup !== 'GLOBAL' && routeGroup !== nextInterface) {
      navigate('/dashboard');
    }
  };

  const initial  = userName ? userName.charAt(0).toUpperCase() : '?';
  const roleKey = backendRole || role;
  const roleMeta = ROLE_META[roleKey] || ROLE_META[role] || { label: roleKey || '—', bg: '#f1f5f9', color: '#64748b' };
  const interfaceMeta = getInterfaceMeta(currentInterface);

  return (
    <header style={{ ...styles.topbar, ...(isMobile ? styles.topbarMobile : isTablet ? styles.topbarTablet : {}) }}>
      <div style={{ ...styles.left, ...(isMobile ? styles.leftMobile : {}) }}>
        {onToggleSidebar && (
          <button type="button" onClick={onToggleSidebar} style={styles.menuBtn}>
            ☰
          </button>
        )}
        <div>
          <h2 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : {}) }}>{title}</h2>
          <div style={{ ...styles.titleMetaRow, ...(isMobile ? styles.titleMetaRowMobile : {}) }}>
            <span style={{ ...styles.interfacePill, background: interfaceMeta.accentSoft, color: interfaceMeta.accentText }}>
              {interfaceMeta.icon} {interfaceMeta.label}
            </span>
            {!isMobile && <span style={styles.interfaceHint}>Vue dédiée</span>}
          </div>
        </div>

        {availableInterfaces.length > 1 && (
          <div style={{ ...styles.switchWrap, ...(isMobile ? styles.switchWrapMobile : {}) }}>
            <button
              type="button"
              onClick={() => switchInterface(ADMIN_INTERFACES.HOTEL)}
              style={{
                ...styles.switchBtn,
                ...(isMobile ? styles.switchBtnMobile : {}),
                ...(currentInterface === ADMIN_INTERFACES.HOTEL ? { ...styles.switchBtnActive, background: '#2563eb' } : {}),
              }}
            >
              Hôtel
            </button>
            <button
              type="button"
              onClick={() => switchInterface(ADMIN_INTERFACES.RENTAL)}
              style={{
                ...styles.switchBtn,
                ...(isMobile ? styles.switchBtnMobile : {}),
                ...(currentInterface === ADMIN_INTERFACES.RENTAL ? { ...styles.switchBtnActive, background: '#0f766e' } : {}),
              }}
            >
              Immobilier
            </button>
          </div>
        )}
      </div>

      <div style={{ ...styles.right, ...(isMobile ? styles.rightMobile : {}) }}>
        <div style={styles.userBadge}>
          <span style={styles.avatar}>{initial}</span>
          <div style={styles.userInfo}>
            <span style={{ ...styles.username, ...(isMobile ? styles.usernameMobile : {}) }}>{userName || 'Utilisateur'}</span>
            <span style={{ ...styles.roleBadge, background: roleMeta.bg, color: roleMeta.color }}>
              {roleMeta.label}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    minHeight: '64px',
    background: 'rgba(255,255,255,0.92)',
    borderBottom: '1px solid #e8ecf0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  topbarTablet: {
    padding: '0 20px',
  },
  topbarMobile: {
    padding: '12px 16px',
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: '12px',
  },
  left: { display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' },
  leftMobile: { width: '100%', gap: '12px', alignItems: 'flex-start' },
  menuBtn: { width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe1ea', background: '#fff', color: '#0f172a', fontSize: '18px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 },
  title:    { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a2e' },
  titleMobile: { fontSize: '16px', lineHeight: 1.3 },
  titleMetaRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' },
  titleMetaRowMobile: { gap: '6px' },
  interfacePill: { display: 'inline-flex', padding: '4px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' },
  interfaceHint: { fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' },
  switchWrap: { display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '999px', gap: '4px' },
  switchWrapMobile: { width: '100%', justifyContent: 'space-between' },
  switchBtn: { border: 'none', background: 'transparent', color: '#475569', fontSize: '12px', fontWeight: '700', padding: '8px 12px', borderRadius: '999px', cursor: 'pointer' },
  switchBtnMobile: { flex: 1, textAlign: 'center' },
  switchBtnActive: { background: '#1d4ed8', color: '#ffffff' },
  right:    { display: 'flex', alignItems: 'center', gap: '16px' },
  rightMobile: { width: '100%', justifyContent: 'space-between', gap: '12px' },
  userBadge:{ display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: '#2563eb', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', flexShrink: 0,
  },
  userInfo:  { display: 'flex', flexDirection: 'column', gap: '2px' },
  username:  { fontSize: '13px', fontWeight: '600', color: '#1a1a2e', lineHeight: 1.2 },
  usernameMobile: { maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  roleBadge: {
    display: 'inline-block', padding: '2px 7px',
    borderRadius: '20px', fontSize: '11px', fontWeight: '600',
    lineHeight: 1.5,
  },
  logoutBtn: {
    padding: '7px 16px', background: '#ef4444', color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
};

