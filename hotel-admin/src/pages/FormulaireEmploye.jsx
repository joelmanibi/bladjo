import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const EMPTY = { name: '', phone: '', position: '', salary: '' };

const POSITION_SUGGESTIONS = [
  'Réceptionniste', 'Femme de ménage', 'Gérant', 'Assistant',
  'Cuisinier', 'Serveur', 'Agent de sécurité', 'Technicien',
];

export default function FormulaireEmploye() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Load existing employee in edit mode
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/employees/${id}`)
      .then((r) => {
        const emp = r.data.data;
        setForm({
          name:     emp.name,
          phone:    emp.phone,
          position: emp.position,
          salary:   String(emp.salary),
        });
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const pickPosition = (pos) => setForm((prev) => ({ ...prev, position: pos }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name:     form.name.trim(),
        phone:    form.phone.trim(),
        position: form.position.trim(),
        salary:   parseFloat(form.salary),
      };
      if (isEdit) {
        await api.put(`/employees/${id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      navigate('/employees');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={isEdit ? 'Modifier employé' : 'Nouvel employé'}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            {isEdit ? '✏ Modifier un employé' : '+ Nouvel employé'}
          </h3>

          {loading && <p style={styles.info}>Chargement...</p>}

          {!loading && (
            <form onSubmit={handleSubmit}>
              {error && <p style={styles.errorMsg}>{error}</p>}

              {/* Nom + Téléphone on the same row */}
              <div style={styles.row}>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Nom complet *</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    required style={styles.input} placeholder="ex: Ahmed Benali" />
                </div>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Téléphone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    required style={styles.input} placeholder="ex: 06 12 34 56 78" />
                </div>
              </div>

              {/* Poste */}
              <div style={styles.field}>
                <label style={styles.label}>Poste *</label>
                <input name="position" value={form.position} onChange={handleChange}
                  required style={styles.input} placeholder="ex: Réceptionniste, Gérant..." />
                {/* Quick-pick suggestion chips */}
                <div style={styles.chips}>
                  {POSITION_SUGGESTIONS.map((pos) => (
                    <button key={pos} type="button" onClick={() => pickPosition(pos)}
                      style={{ ...styles.chip, ...(form.position === pos ? styles.chipActive : {}) }}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salaire */}
              <div style={styles.field}>
                <label style={styles.label}>Salaire mensuel ( FCFA) *</label>
                <input name="salary" type="number" min="0" step="0.01"
                  value={form.salary} onChange={handleChange}
                  required style={styles.input} placeholder="0.00" />
              </div>

              <div style={styles.actions}>
                <button type="button" onClick={() => navigate('/employees')} style={styles.btnBack}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={styles.btnSave}>
                  {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer l\'employé'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  wrapper:   { maxWidth: '620px', margin: '0 auto' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 28px' },
  row:       { display: 'flex', gap: '20px', marginBottom: '20px' },
  fieldHalf: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  field:     { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  label:     { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', color: '#1e293b', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  chips:     { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
  chip: {
    padding: '4px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: '#475569', cursor: 'pointer',
  },
  chipActive: { background: '#dcfce7', borderColor: '#86efac', color: '#166534', fontWeight: '700' },
  actions:  { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' },
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

