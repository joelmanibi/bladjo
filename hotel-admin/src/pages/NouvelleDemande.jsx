import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const EMPTY = { itemId: '', quantity: '1', unitPrice: '' };

export default function NouvelleDemande() {
  const navigate = useNavigate();

  const [form,   setForm]   = useState(EMPTY);
  const [items,  setItems]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Load all stock items for the select dropdown
  useEffect(() => {
    api.get('/items').then((r) => setItems(r.data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // When an item is selected, pre-fill its unitPrice
  const handleItemChange = (e) => {
    const id = e.target.value;
    const item = items.find((i) => String(i.id) === id);
    setForm((prev) => ({
      ...prev,
      itemId:    id,
      unitPrice: item ? String(item.unitPrice) : '',
    }));
  };

  // Selected item details for the preview card
  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === String(form.itemId)) || null,
    [items, form.itemId]
  );

  // Auto-calculate total = quantity × unitPrice
  const total = useMemo(() => {
    const qty   = parseFloat(form.quantity);
    const price = parseFloat(form.unitPrice);
    if (!qty || !price || qty <= 0 || price < 0) return null;
    return (qty * price).toFixed(2);
  }, [form.quantity, form.unitPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/purchase-requests', {
        itemId:    parseInt(form.itemId, 10),
        quantity:  parseInt(form.quantity, 10),
        unitPrice: parseFloat(form.unitPrice),
      });
      navigate('/commandes');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Nouvelle demande d'achat">
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Nouvelle demande d'achat</h3>

          <form onSubmit={handleSubmit}>
            {error && <p style={styles.errorMsg}>{error}</p>}

            {/* Article */}
            <div style={styles.field}>
              <label style={styles.label}>Article *</label>
              <select name="itemId" value={form.itemId} onChange={handleItemChange}
                required style={styles.select}>
                <option value="">— Sélectionner un article —</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category}) — Stock actuel: {item.quantity}
                  </option>
                ))}
              </select>
            </div>

            {/* Article preview card */}
            {selectedItem && (
              <div style={styles.previewCard}>
                <span style={styles.previewLabel}>📦 {selectedItem.name}</span>
                <span style={styles.previewDetail}>Catégorie : {selectedItem.category}</span>
                <span style={styles.previewDetail}>Stock actuel : {selectedItem.quantity} unité(s)</span>
              </div>
            )}

            {/* Quantité + Prix unitaire on the same row */}
            <div style={styles.row}>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>Quantité *</label>
                <input name="quantity" type="number" min="1" step="1"
                  value={form.quantity} onChange={handleChange}
                  required style={styles.input} />
              </div>
              <div style={styles.fieldHalf}>
                <label style={styles.label}>Prix unitaire ( FCFA) *</label>
                <input name="unitPrice" type="number" min="0" step="0.01"
                  value={form.unitPrice} onChange={handleChange}
                  required style={styles.input} placeholder="0.00" />
              </div>
            </div>

            {/* Total preview */}
            {total !== null && (
              <div style={styles.totalCard}>
                <span style={styles.totalLabel}>Total estimé</span>
                <span style={styles.totalAmount}>{total} FCFA</span>
                <span style={styles.totalNote}>
                  {form.quantity} × {parseFloat(form.unitPrice).toFixed(2)} FCFA
                </span>
              </div>
            )}

            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/commandes')} style={styles.btnBack}>
                Annuler
              </button>
              <button type="submit" disabled={saving} style={styles.btnSave}>
                {saving ? 'Envoi...' : 'Créer la demande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper:   { maxWidth: '580px', margin: '0 auto' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 28px' },
  field:     { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  fieldHalf: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  row:       { display: 'flex', gap: '20px', marginBottom: '20px' },
  label:     { fontSize: '13px', fontWeight: '600', color: '#374151' },
  select: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', color: '#1e293b', background: '#fff',
    width: '100%', boxSizing: 'border-box',
  },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', color: '#1e293b', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  previewCard: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac',
    borderRadius: '8px', marginBottom: '20px',
  },
  previewLabel:  { fontSize: '14px', fontWeight: '700', color: '#166534' },
  previewDetail: { fontSize: '12px', color: '#16a34a' },
  totalCard: {
    display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end',
    padding: '16px 20px', background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: '8px', marginBottom: '24px',
  },
  totalLabel:  { fontSize: '12px', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' },
  totalAmount: { fontSize: '28px', fontWeight: '800', color: '#1e40af' },
  totalNote:   { fontSize: '12px', color: '#3b82f6' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  btnBack: {
    padding: '10px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer',
  },
  btnSave: {
    padding: '10px 24px', background: '#2563eb', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer',
  },
  errorMsg: {
    padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
  },
};

