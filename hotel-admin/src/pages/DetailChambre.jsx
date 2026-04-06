import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const IMG_BASE_URL = 'http://localhost:3000/uploads/rooms';

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Disponible',  color: '#16a34a', bg: '#dcfce7' },
  OCCUPIED:    { label: 'Occupée',     color: '#dc2626', bg: '#fee2e2' },
  CLEANING:    { label: 'Nettoyage',   color: '#2563eb', bg: '#dbeafe' },
  MAINTENANCE: { label: 'Maintenance', color: '#ea580c', bg: '#ffedd5' },
};

export default function DetailChambre() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { role } = getAuth();
  const canEdit  = role !== 'RECEPTION';

  const [room,    setRoom]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    api.get(`/rooms/${id}`)
      .then((res) => setRoom(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Chambre introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer la chambre N° ${room.roomNumber} ?`)) return;
    try {
      await api.delete(`/rooms/${id}`);
      navigate('/rooms');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const status = room ? (STATUS_CONFIG[room.status] || {}) : {};

  return (
    <AdminLayout title="Détail chambre">
      <div style={styles.wrapper}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error   && <p style={styles.errorMsg}>{error}</p>}

        {room && (
          <div style={styles.card}>
            {/* ── Image gallery ────────────────────────────────────────── */}
            {Array.isArray(room.images) && room.images.length > 0 ? (
              <div style={styles.galleryWrap}>
                {/* Main image */}
                <div style={styles.galleryImgWrap}>
                  {imgIndex > 0 && (
                    <button style={{ ...styles.galleryArrow, left: '12px' }}
                      onClick={() => setImgIndex((i) => i - 1)}>‹</button>
                  )}
                  <img
                    src={`${IMG_BASE_URL}/${room.images[imgIndex]}`}
                    alt={`photo-${imgIndex}`}
                    style={styles.galleryImg}
                  />
                  {imgIndex < room.images.length - 1 && (
                    <button style={{ ...styles.galleryArrow, right: '12px' }}
                      onClick={() => setImgIndex((i) => i + 1)}>›</button>
                  )}
                </div>
                {/* Dot indicators */}
                {room.images.length > 1 && (
                  <div style={styles.galleryDots}>
                    {room.images.map((_, i) => (
                      <span key={i}
                        style={{ ...styles.dot, background: i === imgIndex ? '#2563eb' : '#cbd5e1' }}
                        onClick={() => setImgIndex(i)}
                      />
                    ))}
                  </div>
                )}
                {/* Thumbnail strip */}
                {room.images.length > 1 && (
                  <div style={styles.galleryStrip}>
                    {room.images.map((fn, i) => (
                      <img key={fn} src={`${IMG_BASE_URL}/${fn}`} alt={fn}
                        style={{ ...styles.stripThumb, border: i === imgIndex ? '2px solid #2563eb' : '2px solid transparent' }}
                        onClick={() => setImgIndex(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : room.imageUrl ? (
              <img src={room.imageUrl} alt={`Chambre ${room.roomNumber}`}
                style={styles.image} onError={(e) => { e.target.style.display = 'none'; }} />
            ) : null}

            {/* Header */}
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.roomTitle}>Chambre N° {room.roomNumber}</h2>
                <p style={styles.roomType}>{room.type}</p>
              </div>
              <span style={{ ...styles.badge, background: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>

            {/* Details grid */}
            <div style={styles.grid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Prix / nuit</span>
                <span style={styles.detailValue}>{Number(room.price).toFixed(2)} FCFA</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Statut</span>
                <span style={styles.detailValue}>{status.label}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Type</span>
                <span style={styles.detailValue}>{room.type}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>N° Chambre</span>
                <span style={styles.detailValue}>{room.roomNumber}</span>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <div style={styles.descBlock}>
                <p style={styles.detailLabel}>Description</p>
                <p style={styles.descText}>{room.description}</p>
              </div>
            )}

            {/* Actions */}
            <div style={styles.actions}>
              <button onClick={() => navigate('/rooms')} style={styles.btnBack}>
                ← Retour
              </button>
              {canEdit && (
                <>
                  <button onClick={() => navigate(`/rooms/${id}/edit`)} style={styles.btnEdit}>
                    Modifier
                  </button>
                  <button onClick={handleDelete} style={styles.btnDel}>
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '240px',
    objectFit: 'cover',
    display: 'block',
  },
  galleryWrap:    { background: '#0f172a', overflow: 'hidden' },
  galleryImgWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' },
  galleryImg:     { maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' },
  galleryArrow:   { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '32px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  galleryDots:    { display: 'flex', justifyContent: 'center', gap: '6px', padding: '10px 0', background: '#0f172a' },
  dot:            { width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' },
  galleryStrip:   { display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto', background: '#1e293b' },
  stripThumb:     { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 28px 0',
  },
  roomTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px',
  },
  roomType: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0',
    padding: '24px 28px',
    borderBottom: '1px solid #f1f5f9',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 0',
    borderBottom: '1px solid #f8fafc',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
  },
  descBlock: {
    padding: '20px 28px',
    borderBottom: '1px solid #f1f5f9',
  },
  descText: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '8px 0 0',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '20px 28px',
    alignItems: 'center',
  },
  btnBack: {
    padding: '9px 20px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    marginRight: 'auto',
  },
  btnEdit: {
    padding: '9px 20px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2563eb',
    cursor: 'pointer',
  },
  btnDel: {
    padding: '9px 20px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#dc2626',
    cursor: 'pointer',
  },
  info: {
    textAlign: 'center',
    color: '#64748b',
    padding: '60px 0',
    fontSize: '14px',
  },
  errorMsg: {
    padding: '16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
  },
};

