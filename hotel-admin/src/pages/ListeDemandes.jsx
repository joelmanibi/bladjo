import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  APPROVED:  { label: 'Validé',     color: '#166534', bg: '#dcfce7' },
  ORDERED:   { label: 'Commandé',   color: '#1e40af', bg: '#dbeafe' },
  DELIVERED: { label: 'Livré',      color: '#5b21b6', bg: '#ede9fe' },
};

const FILTERS = [
  { label: 'Toutes',     value: '' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Validé',     value: 'APPROVED' },
  { label: 'Commandé',   value: 'ORDERED' },
  { label: 'Livré',      value: 'DELIVERED' },
];

export default function ListeDemandes() {
  const navigate     = useNavigate();
  const { role }     = getAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canDeliver   = role === 'SUPER_ADMIN' || role === 'GERANT';

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState('');

  const fetchRequests = (status = '') => {
    setLoading(true);
    setError('');
    const qs = status ? `?status=${status}` : '';
    api.get(`/purchase-requests${qs}`)
      .then((r) => setRequests(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(filter); }, [filter]);

  const doApprove = async (id) => {
    if (!window.confirm('Valider cette demande d\'achat ?')) return;
    try {
      await api.patch(`/purchase-requests/${id}/approve`);
      fetchRequests(filter);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const doDeliver = async (id) => {
    if (!window.confirm('Marquer cette commande comme livrée ? Le stock sera mis à jour automatiquement.')) return;
    try {
      await api.patch(`/purchase-requests/${id}/deliver`);
      fetchRequests(filter);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la livraison');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <AdminLayout title="Bons d'achat">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Bons d'achat</h3>
          <p style={styles.subtitle}>
            {requests.length} demande(s)
            {pendingCount > 0 && (
              <span style={styles.alertBadge}>⏳ {pendingCount} en attente</span>
            )}
          </p>
        </div>
        {(isSuperAdmin || role === 'GERANT') && (
          <button onClick={() => navigate('/commandes/new')} style={styles.addBtn}>
            + Nouvelle demande
          </button>
        )}
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

      {/* Table */}
      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error   && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && requests.length === 0 && (
          <p style={styles.info}>Aucune demande trouvée.</p>
        )}
        {!loading && requests.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['#', 'Article', 'Catégorie', 'Quantité', 'Prix unitaire', 'Total', 'Date', 'Statut', 'Actions'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const s = STATUS_CONFIG[req.status] || {};
                  return (
                    <tr key={req.id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.idBadge}>#{req.id}</span></td>
                      <td style={styles.td}><strong>{req.item?.name || '—'}</strong></td>
                      <td style={styles.td}>
                        <span style={styles.catBadge}>{req.item?.category || '—'}</span>
                      </td>
                      <td style={styles.td}>{req.quantity}</td>
                      <td style={styles.td}>{Number(req.unitPrice).toFixed(2)} FCFA</td>
                      <td style={styles.td}><strong>{Number(req.totalPrice).toFixed(2)} FCFA</strong></td>
                      <td style={styles.td}>{new Date(req.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {req.status === 'PENDING' && isSuperAdmin && (
                            <button onClick={() => doApprove(req.id)} style={styles.btnApprove}>
                              ✔ Valider
                            </button>
                          )}
                          {req.status === 'ORDERED' && canDeliver && (
                            <button onClick={() => doDeliver(req.id)} style={styles.btnDeliver}>
                              📦 Livrer
                            </button>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:   { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:    { fontSize: '14px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  alertBadge:  {
    display: 'inline-block', padding: '2px 10px', background: '#fef3c7',
    border: '1px solid #fcd34d', borderRadius: '20px', fontSize: '12px',
    fontWeight: '700', color: '#92400e',
  },
  addBtn: {
    padding: '10px 20px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  filterBar:       { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn:       { padding: '6px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer' },
  filterBtnActive: { background: '#2563eb', borderColor: '#2563eb', color: '#fff' },
  card:            { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap:       { overflowX: 'auto' },
  table:           { width: '100%', borderCollapse: 'collapse', minWidth: '820px' },
  th: {
    padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
    background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
  },
  tr:      { borderBottom: '1px solid #f1f5f9' },
  td:      { padding: '12px 14px', fontSize: '13px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge: { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  catBadge: { display: 'inline-block', padding: '3px 10px', background: '#ede9fe', color: '#6d28d9', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badge:   { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  actions:    { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  btnApprove: { padding: '4px 10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#166534', cursor: 'pointer' },
  btnDeliver: { padding: '4px 10px', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '5px', fontSize: '11px', fontWeight: '700', color: '#1e40af', cursor: 'pointer' },
  info:     { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
};

