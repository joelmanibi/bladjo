import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const IMG_BASE_URL = 'http://localhost:3000/uploads/rooms';
const MAX_IMAGES   = 5;

const STATUTS = [
  { value: 'AVAILABLE',   label: 'Disponible'  },
  { value: 'OCCUPIED',    label: 'Occupée'     },
  { value: 'CLEANING',    label: 'Nettoyage'   },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

const EMPTY_FORM = {
  roomNumber:  '',
  type:        '',
  price:       '',
  status:      'AVAILABLE',
  description: '',
};

export default function FormulaireChambre() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Image state
  const [keepImages, setKeepImages] = useState([]); // existing filenames to keep
  const [newFiles,   setNewFiles]   = useState([]); // new File objects
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/rooms/${id}`)
      .then((res) => {
        const r = res.data.data;
        setForm({
          roomNumber:  r.roomNumber  || '',
          type:        r.type        || '',
          price:       r.price       || '',
          status:      r.status      || 'AVAILABLE',
          description: r.description || '',
        });
        setKeepImages(Array.isArray(r.images) ? r.images : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const total    = keepImages.length + newFiles.length + selected.length;
    if (total > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images autorisées (${keepImages.length + newFiles.length} déjà sélectionnées)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError('');
    setNewFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeKeepImage = (filename) => setKeepImages((prev) => prev.filter((f) => f !== filename));
  const removeNewFile   = (index)    => setNewFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Submit (FormData) ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('roomNumber',  form.roomNumber.trim());
      fd.append('type',        form.type.trim());
      fd.append('price',       form.price);
      fd.append('status',      form.status);
      fd.append('description', form.description.trim());
      fd.append('keepImages',  JSON.stringify(keepImages));
      newFiles.forEach((file) => fd.append('images', file));

      if (isEdit) {
        await api.put(`/rooms/${id}`, fd);
      } else {
        await api.post('/rooms', fd);
      }
      navigate('/rooms');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit ? 'Modifier la chambre' : 'Ajouter une chambre';

  return (
    <AdminLayout title={isEdit ? 'Modifier chambre' : 'Nouvelle chambre'}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>{title}</h3>

          {loading && <p style={styles.info}>Chargement...</p>}

          {!loading && (
            <form onSubmit={handleSubmit}>
              {error && <p style={styles.errorMsg}>{error}</p>}

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>N° Chambre *</label>
                  <input name="roomNumber" value={form.roomNumber}
                    onChange={handleChange} required style={styles.input}
                    placeholder="ex: 101" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Type *</label>
                  <input name="type" value={form.type}
                    onChange={handleChange} required style={styles.input}
                    placeholder="ex: Suite, Standard..." />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Prix / nuit ( FCFA) *</label>
                  <input name="price" type="number" min="0" step="0.01"
                    value={form.price} onChange={handleChange} required style={styles.input}
                    placeholder="ex: 500" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Statut</label>
                  <select name="status" value={form.status}
                    onChange={handleChange} style={styles.input}>
                    {STATUTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Description</label>
                <textarea name="description" value={form.description}
                  onChange={handleChange} style={styles.textarea} rows={3}
                  placeholder="Description de la chambre..." />
              </div>

              {/* ── Images ─────────────────────────────────────────────── */}
              <div style={styles.fieldFull}>
                <label style={styles.label}>
                  Photos ({keepImages.length + newFiles.length}/{MAX_IMAGES})
                </label>

                {/* Existing images to keep */}
                {keepImages.length > 0 && (
                  <div style={styles.thumbRow}>
                    {keepImages.map((fn) => (
                      <div key={fn} style={styles.thumbWrap}>
                        <img src={`${IMG_BASE_URL}/${fn}`} alt={fn} style={styles.thumb} />
                        <button type="button" style={styles.thumbDel}
                          onClick={() => removeKeepImage(fn)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New files preview */}
                {newFiles.length > 0 && (
                  <div style={styles.thumbRow}>
                    {newFiles.map((file, i) => (
                      <div key={i} style={styles.thumbWrap}>
                        <img src={URL.createObjectURL(file)} alt={file.name} style={styles.thumb} />
                        <button type="button" style={styles.thumbDel}
                          onClick={() => removeNewFile(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File picker — hidden when limit reached */}
                {keepImages.length + newFiles.length < MAX_IMAGES && (
                  <label style={styles.uploadLabel}>
                    + Ajouter des photos
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              <div style={styles.actions}>
                <button type="button" onClick={() => navigate('/rooms')} style={styles.btnCancel}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={styles.btnSave}>
                  {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer la chambre'}
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
  wrapper: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '32px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 28px',
  },
  row: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '20px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  thumbRow:    { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' },
  thumbWrap:   { position: 'relative', width: '80px', height: '80px' },
  thumb:       { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  thumbDel:    { position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  uploadLabel: { display: 'inline-block', padding: '8px 16px', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer', marginTop: '4px' },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  btnCancel: {
    padding: '10px 24px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  btnSave: {
    padding: '10px 24px',
    background: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },
  info: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px 0',
    fontSize: '14px',
  },
  errorMsg: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '20px',
  },
};
