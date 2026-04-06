import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente de validation',  color: '#92400e', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmée',   color: '#166534', bg: '#dcfce7' },
  CANCELLED: { label: 'Annulée',     color: '#991b1b', bg: '#fee2e2' },
  COMPLETED: { label: 'Terminée',    color: '#1e40af', bg: '#dbeafe' },
};

const FILTERS = [
  { label: 'Toutes',      value: '' },
  { label: 'En attente de validation',  value: 'PENDING' },
  { label: 'Confirmées',  value: 'CONFIRMED' },
  { label: 'Annulées',    value: 'CANCELLED' },
  { label: 'Terminées',   value: 'COMPLETED' },
];

const nights = (ci, co) =>
  Math.round((new Date(co) - new Date(ci)) / 86400000);

export default function ListeReservations() {
  const navigate       = useNavigate();
  const { role }       = getAuth();
  const canEdit        = role !== 'RECEPTION';

  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState('');

  const fetchBookings = (status = '') => {
    setLoading(true);
    setError('');
    const qs = status ? `?status=${status}` : '';
    api.get(`/bookings${qs}`)
      .then((r) => setBookings(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(filter); }, [filter]);

  const changeStatus = async (id, status) => {
    const labels = { CONFIRMED: 'valider', CANCELLED: 'annuler', COMPLETED: 'terminer' };
    if (!window.confirm(`Voulez-vous ${labels[status]} cette réservation ?`)) return;
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      fetchBookings(filter);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return (
    <AdminLayout title="Réservations">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Gestion des réservations</h3>
          <p style={styles.subtitle}>{bookings.length} réservation(s)</p>
        </div>
        <div style={styles.headerActions}>
          {canEdit && (
            <button onClick={() => navigate('/reservations/new')} style={styles.addBtn}>
              + Nouvelle réservation
            </button>
          )}
          <button onClick={() => navigate('/reservations/calendrier')} style={styles.calBtn}>
            📅 Calendrier
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.filterBar}>
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{ ...styles.filterBtn, ...(filter === f.value ? styles.filterBtnActive : {}) }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={styles.noticeBox}>
        Les demandes envoyées depuis le site public arrivent ici <strong>en attente de validation</strong>. Seuls les profils de gestion peuvent les valider sur la plateforme.
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error   && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && bookings.length === 0 && (
          <p style={styles.info}>Aucune réservation trouvée.</p>
        )}
        {!loading && bookings.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['#', 'Client', 'Téléphone', 'Chambre', 'Arrivée', 'Départ', 'Nuits', 'Montant', 'Avance', 'Statut', 'Actions'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const s  = STATUS_CONFIG[b.status] || {};
                  const n  = nights(b.checkInDate, b.checkOutDate);
                  return (
                    <tr key={b.id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.idBadge}>#{b.id}</span></td>
                      <td style={styles.td}><strong>{b.customerName}</strong></td>
                      <td style={styles.td}>{b.phone}</td>
                      <td style={styles.td}>
                        {b.room
                          ? <span style={styles.roomTag}>{b.room.roomNumber} <em>({b.room.type})</em></span>
                          : '—'}
                      </td>
                      <td style={styles.td}>{b.checkInDate}</td>
                      <td style={styles.td}>{b.checkOutDate}</td>
                      <td style={styles.td}>{n}n</td>
                      <td style={styles.td}>{Number(b.totalAmount).toFixed(2)} FCFA</td>
                      <td style={styles.td}>{Number(b.advanceAmount).toFixed(2)} FCFA</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={styles.td}>
                        {canEdit && (
                          <div style={styles.actions}>
                            {b.status === 'PENDING' && (
                              <button onClick={() => changeStatus(b.id, 'CONFIRMED')} style={styles.btnConfirm}>
                                Valider
                              </button>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <button onClick={() => changeStatus(b.id, 'COMPLETED')} style={styles.btnComplete}>
                                Terminer
                              </button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(b.status) && (
                              <button onClick={() => changeStatus(b.id, 'CANCELLED')} style={styles.btnCancel}>
                                Annuler
                              </button>
                            )}
                          </div>
                        )}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:  { fontSize: '14px', color: '#64748b', margin: 0 },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  addBtn: {
    padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  calBtn: {
    padding: '10px 16px', background: '#f8fafc', color: '#475569',
    border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  noticeBox: {
    marginBottom: '18px', padding: '12px 14px', borderRadius: '10px',
    background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '14px',
  },
  filterBtn: {
    padding: '6px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '20px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer',
  },
  filterBtnActive: { background: '#2563eb', borderColor: '#2563eb', color: '#fff' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: {
    padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
    background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
  },
  tr:  { borderBottom: '1px solid #f1f5f9' },
  td:  { padding: '12px 14px', fontSize: '13px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge: {
    display: 'inline-block', padding: '2px 8px', background: '#f1f5f9',
    borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600',
  },
  roomTag: { fontSize: '13px', color: '#1e293b' },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '700',
  },
  actions:     { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  btnConfirm: {
    padding: '4px 10px', background: '#dcfce7', border: '1px solid #86efac',
    borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#166534', cursor: 'pointer',
  },
  btnComplete: {
    padding: '4px 10px', background: '#dbeafe', border: '1px solid #93c5fd',
    borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#1e40af', cursor: 'pointer',
  },
  btnCancel: {
    padding: '4px 10px', background: '#fee2e2', border: '1px solid #fca5a5',
    borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#991b1b', cursor: 'pointer',
  },
  info:     { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
};

