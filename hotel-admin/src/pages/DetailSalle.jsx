import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const IMG_BASE_URL = 'http://localhost:3000/uploads/halls';

const BOOKING_STATUS_CONFIG = {
  PENDING:   { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmée',  color: '#166534', bg: '#dcfce7' },
  CANCELLED: { label: 'Annulée',    color: '#991b1b', bg: '#fee2e2' },
};

const formatRange = (startDate, endDate) => (
  startDate === endDate ? startDate : `${startDate} → ${endDate}`
);

export default function DetailSalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = getAuth();
  const canEdit = role !== 'RECEPTION';

  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    api.get(`/halls/${id}`)
      .then((res) => setHall(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Salle introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer la salle « ${hall.name} » ?`)) return;
    try {
      await api.delete(`/halls/${id}`);
      navigate('/halls');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout title="Détail salle">
      <div style={styles.wrapper}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error && <p style={styles.errorMsg}>{error}</p>}

        {hall && (
          <div style={styles.card}>
            {Array.isArray(hall.images) && hall.images.length > 0 && (
              <div style={styles.galleryWrap}>
                <div style={styles.galleryImgWrap}>
                  {imgIndex > 0 && (
                    <button type="button" style={{ ...styles.galleryArrow, left: '12px' }} onClick={() => setImgIndex((i) => i - 1)}>‹</button>
                  )}
                  <img src={`${IMG_BASE_URL}/${hall.images[imgIndex]}`} alt={`hall-${imgIndex}`} style={styles.galleryImg} />
                  {imgIndex < hall.images.length - 1 && (
                    <button type="button" style={{ ...styles.galleryArrow, right: '12px' }} onClick={() => setImgIndex((i) => i + 1)}>›</button>
                  )}
                </div>
                {hall.images.length > 1 && (
                  <>
                    <div style={styles.galleryDots}>
                      {hall.images.map((_, index) => (
                        <span key={index} style={{ ...styles.dot, background: index === imgIndex ? '#2563eb' : '#cbd5e1' }} onClick={() => setImgIndex(index)} />
                      ))}
                    </div>
                    <div style={styles.galleryStrip}>
                      {hall.images.map((filename, index) => (
                        <img
                          key={filename}
                          src={`${IMG_BASE_URL}/${filename}`}
                          alt={filename}
                          style={{ ...styles.stripThumb, border: index === imgIndex ? '2px solid #2563eb' : '2px solid transparent' }}
                          onClick={() => setImgIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.title}>{hall.name}</h2>
                <p style={styles.subtitle}>Salle de réception</p>
              </div>
              <button type="button" style={styles.bookingBtn} onClick={() => navigate(`/hall-bookings/new?hallId=${hall.id}`)}>
                + Réserver la salle
              </button>
            </div>

            <div style={styles.grid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Capacité</span>
                <span style={styles.detailValue}>{hall.capacity} personnes</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Prix / jour</span>
                <span style={styles.detailValue}>{Number(hall.pricePerDay).toFixed(2)} FCFA</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Réservations</span>
                <span style={styles.detailValue}>{hall.bookings?.length || 0}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Photos</span>
                <span style={styles.detailValue}>{Array.isArray(hall.images) ? hall.images.length : 0}</span>
              </div>
            </div>

            {hall.description && (
              <div style={styles.descBlock}>
                <p style={styles.detailLabel}>Description</p>
                <p style={styles.descText}>{hall.description}</p>
              </div>
            )}

            <div style={styles.bookingSection}>
              <div style={styles.bookingHeader}>
                <h3 style={styles.bookingTitle}>Historique des réservations</h3>
                <button type="button" style={styles.linkBtn} onClick={() => navigate(`/hall-bookings?hallId=${hall.id}`)}>
                  Voir tout
                </button>
              </div>

              {!hall.bookings || hall.bookings.length === 0 ? (
                <p style={styles.emptyText}>Aucune réservation enregistrée pour cette salle.</p>
              ) : (
                <div style={styles.bookingList}>
                  {hall.bookings.map((booking) => {
                    const status = BOOKING_STATUS_CONFIG[booking.status] || {};
                    return (
                      <div key={booking.id} style={styles.bookingCard}>
                        <div>
                          <strong style={styles.bookingCustomer}>{booking.customerName}</strong>
                          <p style={styles.bookingMeta}>{booking.phone} · {formatRange(booking.startDate, booking.endDate)}</p>
                        </div>
                        <span style={{ ...styles.badge, background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/halls')} style={styles.btnBack}>← Retour</button>
              {canEdit && (
                <>
                  <button type="button" onClick={() => navigate(`/halls/${id}/edit`)} style={styles.btnEdit}>Modifier</button>
                  <button type="button" onClick={handleDelete} style={styles.btnDel}>Supprimer</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const styles = {
  wrapper: { maxWidth: '820px', margin: '0 auto' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  galleryWrap: { background: '#0f172a', overflow: 'hidden' },
  galleryImgWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px' },
  galleryImg: { maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', display: 'block' },
  galleryArrow: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '32px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  galleryDots: { display: 'flex', justifyContent: 'center', gap: '6px', padding: '10px 0', background: '#0f172a' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer' },
  galleryStrip: { display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto', background: '#1e293b' },
  stripThumb: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '24px 28px 0' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  bookingBtn: { padding: '9px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', padding: '24px 28px', borderBottom: '1px solid #f1f5f9' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 0', borderBottom: '1px solid #f8fafc' },
  detailLabel: { fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 },
  detailValue: { fontSize: '15px', fontWeight: '600', color: '#1e293b' },
  descBlock: { padding: '20px 28px', borderBottom: '1px solid #f1f5f9' },
  descText: { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '8px 0 0' },
  bookingSection: { padding: '20px 28px', borderBottom: '1px solid #f1f5f9' },
  bookingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  bookingTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 },
  linkBtn: { background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  bookingList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  bookingCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' },
  bookingCustomer: { fontSize: '14px', color: '#1e293b' },
  bookingMeta: { fontSize: '13px', color: '#64748b', margin: '4px 0 0' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },
  emptyText: { fontSize: '14px', color: '#64748b', margin: 0 },
  actions: { display: 'flex', gap: '12px', padding: '20px 28px', alignItems: 'center' },
  btnBack: { padding: '9px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer', marginRight: 'auto' },
  btnEdit: { padding: '9px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' },
  btnDel: { padding: '9px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#dc2626', cursor: 'pointer' },
  info: { textAlign: 'center', color: '#64748b', padding: '60px 0', fontSize: '14px' },
  errorMsg: { padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' },
};