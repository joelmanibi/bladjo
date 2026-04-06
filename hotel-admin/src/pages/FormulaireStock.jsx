import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const EMPTY = { name: '', category: '', quantity: '0', unitPrice: '' };

// Suggested categories (user can also type a custom one)
const CATEGORY_SUGGESTIONS = ['Linge', 'Hygiène', 'Ménage', 'Cuisine', 'Boissons', 'Matériel'];

export default function FormulaireStock() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Load existing item in edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/items/${id}`)
      .then((r) => {
        const it = r.data.data;
        setForm({
          name:      it.name,
          category:  it.category,
          quantity:  String(it.quantity),
          unitPrice: String(it.unitPrice),
        });
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const pickCategory = (cat) => setForm((prev) => ({ ...prev, category: cat }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name:      form.name.trim(),
        category:  form.category.trim(),
        quantity:  parseInt(form.quantity, 10),
        unitPrice: parseFloat(form.unitPrice),
      };
      if (isEdit) {
        await api.put(`/items/${id}`, payload);
      } else {
        await api.post('/items', payload);
      }
      navigate('/stock');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={isEdit ? 'Modifier article' : 'Nouvel article'}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            {isEdit ? '✏ Modifier un article' : '+ Nouvel article de stock'}
          </h3>

          {loading && <p style={styles.info}>Chargement...</p>}

          {!loading && (
            <form onSubmit={handleSubmit}>
              {error && <p style={styles.errorMsg}>{error}</p>}

              {/* Nom */}
              <div style={styles.field}>
                <label style={styles.label}>Nom de l'article *</label>
                <input
                  name="name" value={form.name} onChange={handleChange}
                  required style={styles.input}
                  placeholder="ex: Serviette de bain, Savon, Drap..."
                />
              </div>

              {/* Catégorie */}
              <div style={styles.field}>
                <label style={styles.label}>Catégorie *</label>
                <input
                  name="category" value={form.category} onChange={handleChange}
                  required style={styles.input}
                  placeholder="ex: Linge, Hygiène, Ménage..."
                />
                {/* Quick-pick suggestion chips */}
                <div style={styles.chips}>
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <button
                      key={cat} type="button"
                      onClick={() => pickCategory(cat)}
                      style={{
                        ...styles.chip,
                        ...(form.category === cat ? styles.chipActive : {}),
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantité + Prix sur la même ligne */}
              <div style={styles.row}>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Quantité *</label>
                  <input
                    name="quantity" type="number" min="0" step="1"
                    value={form.quantity} onChange={handleChange}
                    required style={styles.input}
                  />
                </div>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Prix unitaire ( FCFA) *</label>
                  <input
                    name="unitPrice" type="number" min="0" step="0.01"
                    value={form.unitPrice} onChange={handleChange}
                    required style={styles.input}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={styles.actions}>
                <button type="button" onClick={() => navigate('/stock')} style={styles.btnBack}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={styles.btnSave}>
                  {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer l\'article'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  wrapper:   { maxWidth: '580px', margin: '0 auto' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 28px' },
  field:     { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  fieldHalf: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  row:       { display: 'flex', gap: '20px', marginBottom: '20px' },
  label:     { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', color: '#1e293b', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  chips:     { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
  chip: {
    padding: '4px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '20px', fontSize: '12px', fontWeight: '500',
    color: '#475569', cursor: 'pointer',
  },
  chipActive: { background: '#ede9fe', borderColor: '#c4b5fd', color: '#6d28d9', fontWeight: '700' },
  actions:   { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' },
  btnBack: {
    padding: '10px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer',
  },
  btnSave: {
    padding: '10px 24px', background: '#2563eb', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer',
  },
  info:     { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: {
    padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
  },
};

