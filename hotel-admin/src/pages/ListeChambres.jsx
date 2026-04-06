import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const FILTERS = [
  { label: 'Toutes',      value: '' },
  { label: 'Disponible',  value: 'AVAILABLE' },
  { label: 'Occupée',     value: 'OCCUPIED' },
  { label: 'Nettoyage',   value: 'CLEANING' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

export default function ListeChambres() {
  const navigate = useNavigate();
  const { role } = getAuth();
  const canEdit = role !== 'RECEPTION';

  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('');

  // Gallery modal
  const [gallery, setGallery] = useState({ room: null, index: 0 });

  const fetchRooms = (status = '') => {
    setLoading(true);
    setError('');
    const params = status ? `?status=${status}` : '';
    api.get(`/rooms${params}`)
      .then((res) => setRooms(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(filter); }, [filter]);

  const handleDelete = async (room) => {
    if (!window.confirm(`Supprimer la chambre N° ${room.roomNumber} ?`)) return;
    try {
      await api.delete(`/rooms/${room.id}`);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout title="Chambres">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Gestion des chambres</h3>
          <p style={styles.subtitle}>{rooms.length} chambre(s) trouvée(s)</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/rooms/new')} style={styles.addBtn}>
            + Ajouter une chambre
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={styles.filterBar}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{ ...styles.filterBtn, ...(filter === f.value ? styles.filterBtnActive : {}) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error   && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && rooms.length === 0 && (
          <p style={styles.info}>Aucune chambre trouvée.</p>
        )}
        {!loading && rooms.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                {['N° Chambre', 'Type', 'Prix / nuit', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => {
                const s = STATUS_CONFIG[room.status] || {};
                return (
                  <tr key={room.id} style={styles.tr}>
                    <td style={styles.td}><strong>{room.roomNumber}</strong></td>
                    <td style={styles.td}>{room.type}</td>
                    <td style={styles.td}>{Number(room.price).toFixed(2)} FCFA</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        {Array.isArray(room.images) && room.images.length > 0 && (
                          <button
                            onClick={() => setGallery({ room, index: 0 })}
                            style={styles.btnPhoto}>
                            📷 {room.images.length}
                          </button>
                        )}
                        <button onClick={() => navigate(`/rooms/${room.id}`)} style={styles.btnView}>
                          Détails
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => navigate(`/rooms/${room.id}/edit`)} style={styles.btnEdit}>
                              Modifier
                            </button>
                            <button onClick={() => handleDelete(room)} style={styles.btnDel}>
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* ── Gallery Modal ───────────────────────────────────────────────── */}
      {gallery.room && (
        <div style={styles.overlay} onClick={() => setGallery({ room: null, index: 0 })}>
          <div style={styles.galleryBox} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={styles.galleryHeader}>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>
                🚪 Chambre {gallery.room.roomNumber} — Photo {gallery.index + 1} / {gallery.room.images.length}
              </span>
              <button style={styles.galleryClose}
                onClick={() => setGallery({ room: null, index: 0 })}>✕</button>
            </div>

            {/* Main image */}
            <div style={styles.galleryImgWrap}>
              {gallery.index > 0 && (
                <button style={{ ...styles.galleryArrow, left: '12px' }}
                  onClick={() => setGallery((g) => ({ ...g, index: g.index - 1 }))}>‹</button>
              )}
              <img
                src={`${IMG_BASE_URL}/${gallery.room.images[gallery.index]}`}
                alt={`photo-${gallery.index}`}
                style={styles.galleryImg}
              />
              {gallery.index < gallery.room.images.length - 1 && (
                <button style={{ ...styles.galleryArrow, right: '12px' }}
                  onClick={() => setGallery((g) => ({ ...g, index: g.index + 1 }))}>›</button>
              )}
            </div>

            {/* Dot indicators */}
            <div style={styles.galleryDots}>
              {gallery.room.images.map((_, i) => (
                <span key={i}
                  style={{ ...styles.dot, background: i === gallery.index ? '#2563eb' : '#cbd5e1' }}
                  onClick={() => setGallery((g) => ({ ...g, index: i }))}
                />
              ))}
            </div>

            {/* Thumbnail strip */}
            <div style={styles.galleryStrip}>
              {gallery.room.images.map((fn, i) => (
                <img key={fn} src={`${IMG_BASE_URL}/${fn}`} alt={fn}
                  style={{ ...styles.stripThumb, border: i === gallery.index ? '2px solid #2563eb' : '2px solid transparent' }}
                  onClick={() => setGallery((g) => ({ ...g, index: i }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  addBtn: {
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 16px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: '#2563eb',
    borderColor: '#2563eb',
    color: '#fff',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#1e293b',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  btnView: {
    padding: '5px 12px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  btnEdit: {
    padding: '5px 12px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    cursor: 'pointer',
  },
  btnDel: {
    padding: '5px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#dc2626',
    cursor: 'pointer',
  },
  info: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  errorMsg: {
    padding: '16px',
    color: '#dc2626',
    background: '#fef2f2',
    borderRadius: '8px',
    margin: '16px',
    fontSize: '14px',
  },
  // ── Gallery ──────────────────────────────────────────────────────────────
  btnPhoto:     { padding: '5px 10px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#7c3aed', cursor: 'pointer' },
  overlay:      { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  galleryBox:   { background: '#fff', borderRadius: '16px', overflow: 'hidden', maxWidth: '760px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' },
  galleryHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
  galleryClose: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' },
  galleryImgWrap:{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px', background: '#0f172a' },
  galleryImg:   { maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' },
  galleryArrow: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '32px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  galleryDots:  { display: 'flex', justifyContent: 'center', gap: '6px', padding: '10px 0', background: '#0f172a' },
  dot:          { width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' },
  galleryStrip: { display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto', background: '#1e293b' },
  stripThumb:   { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 },
};
