import { useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';

// Label and color for each frontend role badge
const ROLE_META = {
  SUPER_ADMIN: { label: 'Super Admin', bg: '#dbeafe', color: '#1d4ed8' },
  GERANT:      { label: 'Gérant',      bg: '#dcfce7', color: '#16a34a' },
  RECEPTION:   { label: 'Réception',   bg: '#ffedd5', color: '#c2410c' },
};

export default function Topbar({ title }) {
  const navigate = useNavigate();
  const { userName, role } = getAuth();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const initial  = userName ? userName.charAt(0).toUpperCase() : '?';
  const roleMeta = ROLE_META[role] || { label: role || '—', bg: '#f1f5f9', color: '#64748b' };

  return (
    <header style={styles.topbar}>
      <h2 style={styles.title}>{title}</h2>

      <div style={styles.right}>
        <div style={styles.userBadge}>
          <span style={styles.avatar}>{initial}</span>
          <div style={styles.userInfo}>
            <span style={styles.username}>{userName || 'Utilisateur'}</span>
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
    height: '64px',
    minHeight: '64px',
    background: '#ffffff',
    borderBottom: '1px solid #e8ecf0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  title:    { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a2e' },
  right:    { display: 'flex', alignItems: 'center', gap: '16px' },
  userBadge:{ display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: '#2563eb', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', flexShrink: 0,
  },
  userInfo:  { display: 'flex', flexDirection: 'column', gap: '2px' },
  username:  { fontSize: '13px', fontWeight: '600', color: '#1a1a2e', lineHeight: 1.2 },
  roleBadge: {
    display: 'inline-block', padding: '2px 7px',
    borderRadius: '20px', fontSize: '11px', fontWeight: '600',
    lineHeight: 1.5,
  },
  logoutBtn: {
    padding: '7px 16px', background: '#ef4444', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
};

