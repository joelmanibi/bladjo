import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const IMG_BASE_URL = 'http://localhost:3000/uploads/halls';
const MAX_IMAGES = 5;

const EMPTY_FORM = {
  name: '',
  capacity: '',
  pricePerDay: '',
  description: '',
};

export default function FormulaireSalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [keepImages, setKeepImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/halls/${id}`)
      .then((res) => {
        const hall = res.data.data;
        setForm({
          name: hall.name || '',
          capacity: hall.capacity || '',
          pricePerDay: hall.pricePerDay || '',
          description: hall.description || '',
        });
        setKeepImages(Array.isArray(hall.images) ? hall.images : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const total = keepImages.length + newFiles.length + selected.length;
    if (total > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images autorisées (${keepImages.length + newFiles.length} déjà sélectionnées)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError('');
    setNewFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeKeepImage = (filename) => setKeepImages((prev) => prev.filter((item) => item !== filename));
  const removeNewFile = (index) => setNewFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('capacity', form.capacity);
      payload.append('pricePerDay', form.pricePerDay);
      payload.append('description', form.description.trim());
      payload.append('keepImages', JSON.stringify(keepImages));
      newFiles.forEach((file) => payload.append('images', file));

      if (isEdit) {
        await api.put(`/halls/${id}`, payload);
      } else {
        await api.post('/halls', payload);
      }

      navigate('/halls');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={isEdit ? 'Modifier salle' : 'Nouvelle salle'}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>{isEdit ? 'Modifier la salle de réception' : 'Ajouter une salle de réception'}</h3>

          {loading && <p style={styles.info}>Chargement...</p>}

          {!loading && (
            <form onSubmit={handleSubmit}>
              {error && <p style={styles.errorMsg}>{error}</p>}

              <div style={styles.fieldFull}>
                <label style={styles.label}>Nom de la salle *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="ex: Salle Prestige"
                />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Capacité *</label>
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="ex: 150"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Prix / jour (FCFA) *</label>
                  <input
                    name="pricePerDay"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricePerDay}
                    onChange={handleChange}
                    required
                    style={styles.input}
                    placeholder="ex: 100000"
                  />
                </div>
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  style={styles.textarea}
                  rows={4}
                  placeholder="Décrivez l'ambiance, les équipements et l'usage de la salle..."
                />
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Photos ({keepImages.length + newFiles.length}/{MAX_IMAGES})</label>

                {keepImages.length > 0 && (
                  <div style={styles.thumbRow}>
                    {keepImages.map((filename) => (
                      <div key={filename} style={styles.thumbWrap}>
                        <img src={`${IMG_BASE_URL}/${filename}`} alt={filename} style={styles.thumb} />
                        <button type="button" style={styles.thumbDel} onClick={() => removeKeepImage(filename)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {newFiles.length > 0 && (
                  <div style={styles.thumbRow}>
                    {newFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} style={styles.thumbWrap}>
                        <img src={URL.createObjectURL(file)} alt={file.name} style={styles.thumb} />
                        <button type="button" style={styles.thumbDel} onClick={() => removeNewFile(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

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
                <button type="button" onClick={() => navigate('/halls')} style={styles.btnCancel}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={styles.btnSave}>
                  {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer la salle'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  wrapper: { maxWidth: '720px', margin: '0 auto' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 28px' },
  row: { display: 'flex', gap: '20px', marginBottom: '20px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldFull: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  thumbRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' },
  thumbWrap: { position: 'relative', width: '80px', height: '80px' },
  thumb: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  thumbDel: { position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  uploadLabel: { display: 'inline-block', padding: '8px 16px', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer', marginTop: '4px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  btnCancel: { padding: '10px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' },
  btnSave: { padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' },
  info: { textAlign: 'center', color: '#64748b', padding: '40px 0', fontSize: '14px' },
  errorMsg: { padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' },
};