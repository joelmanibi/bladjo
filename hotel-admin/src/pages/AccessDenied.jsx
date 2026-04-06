import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>🚫</div>
        <h1 style={styles.title}>Accès refusé</h1>
        <p style={styles.message}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          <br />
          Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <button onClick={() => navigate('/dashboard')} style={styles.button}>
          Retour au Dashboard
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '52px 44px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
    maxWidth: '440px',
    width: '100%',
  },
  iconWrap: {
    fontSize: '60px',
    marginBottom: '20px',
    lineHeight: 1,
  },
  title: {
    margin: '0 0 14px',
    fontSize: '26px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  message: {
    margin: '0 0 32px',
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.65',
  },
  button: {
    padding: '11px 28px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

