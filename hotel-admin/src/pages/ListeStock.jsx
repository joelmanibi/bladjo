import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const LOW_STOCK_THRESHOLD = 5;

export default function ListeStock() {
  const navigate = useNavigate();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState('');

  const fetchItems = () => {
    setLoading(true);
    setError('');
    api.get('/items')
      .then((r) => setItems(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  // Build dynamic category list from loaded items
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set).sort();
  }, [items]);

  const displayed = filter ? items.filter((i) => i.category === filter) : items;
  const lowCount  = items.filter((i) => i.quantity <= LOW_STOCK_THRESHOLD).length;

  return (
    <AdminLayout title="Stock">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Gestion du stock</h3>
          <p style={styles.subtitle}>
            {items.length} article(s)
            {lowCount > 0 && (
              <span style={styles.alertBadge}>⚠ {lowCount} stock faible</span>
            )}
          </p>
        </div>
        <button onClick={() => navigate('/stock/new')} style={styles.addBtn}>
          + Nouvel article
        </button>
      </div>

      {/* Category filter tabs */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setFilter('')}
          style={{ ...styles.filterBtn, ...(filter === '' ? styles.filterBtnActive : {}) }}
        >
          Tous
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{ ...styles.filterBtn, ...(filter === cat ? styles.filterBtnActive : {}) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error   && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={styles.info}>Aucun article trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['#', 'Nom article', 'Catégorie', 'Quantité', 'Prix unitaire', 'Actions'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((item) => {
                  const isLow = item.quantity <= LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.idBadge}>#{item.id}</span>
                      </td>
                      <td style={styles.td}>
                        <strong style={{ color: '#1e293b' }}>{item.name}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.catBadge}>{item.category}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.qtyBadge, ...(isLow ? styles.qtyLow : styles.qtyOk) }}>
                          {item.quantity}
                          {isLow && ' ⚠'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {Number(item.unitPrice).toFixed(2)} FCFA
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => navigate(`/stock/${item.id}/edit`)}
                          style={styles.btnEdit}
                        >
                          ✏ Modifier
                        </button>
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

// ─── Styles ──────────────────────────────────────────────────────────────────
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
  filterBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '6px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '20px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer',
  },
  filterBtnActive: { background: '#2563eb', borderColor: '#2563eb', color: '#fff' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: '640px' },
  th: {
    padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
    background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
  },
  tr:  { borderBottom: '1px solid #f1f5f9' },
  td:  { padding: '13px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge: {
    display: 'inline-block', padding: '2px 8px', background: '#f1f5f9',
    borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600',
  },
  catBadge: {
    display: 'inline-block', padding: '3px 10px', background: '#ede9fe',
    color: '#6d28d9', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
  },
  qtyBadge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    fontSize: '13px', fontWeight: '700',
  },
  qtyOk:  { background: '#dcfce7', color: '#166534' },
  qtyLow: { background: '#fef3c7', color: '#92400e' },
  btnEdit: {
    padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd',
    borderRadius: '6px', fontSize: '12px', fontWeight: '700',
    color: '#0369a1', cursor: 'pointer',
  },
  info:     { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
};

