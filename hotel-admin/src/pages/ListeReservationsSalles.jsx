import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente de validation', color: '#92400e', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmée',  color: '#166534', bg: '#dcfce7' },
  CANCELLED: { label: 'Annulée',    color: '#991b1b', bg: '#fee2e2' },
};

const FILTERS = [
  { label: 'Toutes', value: '' },
  { label: 'En attente de validation', value: 'PENDING' },
  { label: 'Confirmées', value: 'CONFIRMED' },
  { label: 'Annulées', value: 'CANCELLED' },
];

const calcInclusiveDayCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
};

export default function ListeReservationsSalles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role } = getAuth();
  const canEdit = role !== 'RECEPTION';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const hallId = searchParams.get('hallId');

  const fetchBookings = async (status = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (hallId) params.set('hallId', hallId);
      const qs = params.toString();
      const res = await api.get(`/hall-bookings${qs ? `?${qs}` : ''}`);
      setBookings(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(filter);
  }, [filter, hallId]);

  const changeStatus = async (id, status) => {
    const labels = { CONFIRMED: 'valider', CANCELLED: 'annuler' };
    if (!window.confirm(`Voulez-vous ${labels[status]} cette réservation de salle ?`)) return;
    try {
      await api.patch(`/hall-bookings/${id}/status`, { status });
      fetchBookings(filter);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <AdminLayout title="Réservations salles">
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Gestion des réservations de salles</h3>
          <p style={styles.subtitle}>{bookings.length} réservation(s)</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate(hallId ? `/hall-bookings/new?hallId=${hallId}` : '/hall-bookings/new')} style={styles.addBtn}>
            + Nouvelle réservation
          </button>
        )}
      </div>

      <div style={styles.filterBar}>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            style={{ ...styles.filterBtn, ...(filter === item.value ? styles.filterBtnActive : {}) }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={styles.noticeBox}>
        Les demandes envoyées depuis le site public arrivent ici <strong>en attente de validation</strong>. Seuls les profils de gestion peuvent les valider sur la plateforme.
      </div>

      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && bookings.length === 0 && <p style={styles.info}>Aucune réservation trouvée.</p>}

        {!loading && !error && bookings.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['#', 'Client', 'Téléphone', 'Salle', 'Début', 'Fin', 'Durée', 'Montant', 'Avance', 'Statut', 'Actions'].map((label) => (
                    <th key={label} style={styles.th}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const status = STATUS_CONFIG[booking.status] || {};
                  const dayCount = calcInclusiveDayCount(booking.startDate, booking.endDate);
                  return (
                    <tr key={booking.id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.idBadge}>#{booking.id}</span></td>
                      <td style={styles.td}><strong>{booking.customerName}</strong></td>
                      <td style={styles.td}>{booking.phone}</td>
                      <td style={styles.td}>{booking.hall ? booking.hall.name : '—'}</td>
                      <td style={styles.td}>{booking.startDate}</td>
                      <td style={styles.td}>{booking.endDate}</td>
                      <td style={styles.td}>{dayCount} j</td>
                      <td style={styles.td}>{Number(booking.totalAmount).toFixed(2)} FCFA</td>
                      <td style={styles.td}>{Number(booking.advanceAmount).toFixed(2)} FCFA</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: status.bg, color: status.color }}>{status.label}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {canEdit && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                            <button type="button" onClick={() => navigate(`/hall-bookings/${booking.id}/edit`)} style={styles.btnEdit}>Modifier</button>
                          )}
                          {canEdit && booking.status === 'PENDING' && (
                            <button type="button" onClick={() => changeStatus(booking.id, 'CONFIRMED')} style={styles.btnConfirm}>Valider</button>
                          )}
                          {canEdit && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                            <button type="button" onClick={() => changeStatus(booking.id, 'CANCELLED')} style={styles.btnCancel}>Annuler</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  noticeBox: {
    marginBottom: '18px', padding: '12px 14px', borderRadius: '10px',
    background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '14px',
  },
  filterBtn: { padding: '6px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer' },
  filterBtnActive: { background: '#2563eb', borderColor: '#2563eb', color: '#fff' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '820px' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 14px', fontSize: '13px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge: { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  actions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  btnEdit: { padding: '4px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#2563eb', cursor: 'pointer' },
  btnConfirm: { padding: '4px 10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#166534', cursor: 'pointer' },
  btnCancel: { padding: '4px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#991b1b', cursor: 'pointer' },
  info: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
};