import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const EMPTY = {
  customerName: '',
  phone: '',
  hallId: '',
  startDate: '',
  endDate: '',
  advanceAmount: '',
};

const calcInclusiveDayCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
};

export default function FormulaireReservationSalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/halls')
      .then((res) => setHalls(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const queryHallId = searchParams.get('hallId');
    const queryStartDate = searchParams.get('startDate');
    const queryEndDate = searchParams.get('endDate');
    if (!isEdit && queryHallId) {
      setForm((prev) => ({
        ...prev,
        hallId: queryHallId,
        startDate: queryStartDate || prev.startDate,
        endDate: queryEndDate || prev.endDate,
      }));
    }
  }, [isEdit, searchParams]);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/hall-bookings/${id}`)
      .then((res) => {
        const booking = res.data.data;
        setForm({
          customerName: booking.customerName || '',
          phone: booking.phone || '',
          hallId: booking.hallId ? String(booking.hallId) : '',
          startDate: booking.startDate || '',
          endDate: booking.endDate || '',
          advanceAmount: booking.advanceAmount || '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const selectedHall = useMemo(
    () => halls.find((hall) => String(hall.id) === String(form.hallId)) || null,
    [halls, form.hallId]
  );

  const dayCount = calcInclusiveDayCount(form.startDate, form.endDate);
  const estimatedTotal = selectedHall && dayCount ? (Number(selectedHall.pricePerDay) * dayCount).toFixed(2) : null;
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        hallId: parseInt(form.hallId, 10),
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        advanceAmount: form.advanceAmount ? parseFloat(form.advanceAmount) : 0,
      };

      if (isEdit) {
        await api.put(`/hall-bookings/${id}`, payload);
      } else {
        await api.post('/hall-bookings', payload);
      }

      navigate('/hall-bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={isEdit ? 'Modifier réservation salle' : 'Nouvelle réservation salle'}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>{isEdit ? 'Modifier la réservation de salle' : 'Nouvelle réservation de salle'}</h3>

          {loading && <p style={styles.info}>Chargement...</p>}

          {!loading && (
            <form onSubmit={handleSubmit}>
              {error && <p style={styles.errorMsg}>{error}</p>}

              <p style={styles.sectionLabel}>Informations client</p>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Nom complet *</label>
                  <input name="customerName" value={form.customerName} onChange={handleChange} required style={styles.input} placeholder="ex: Fatou Koné" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Téléphone *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required style={styles.input} placeholder="ex: 0700000000" />
                </div>
              </div>

              <p style={styles.sectionLabel}>Salle</p>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Sélectionner une salle *</label>
                <select name="hallId" value={form.hallId} onChange={handleChange} required style={styles.input}>
                  <option value="">-- Choisir une salle --</option>
                  {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} — {hall.capacity} pers. — {Number(hall.pricePerDay).toFixed(2)} FCFA/jour
                    </option>
                  ))}
                </select>
                {selectedHall && (
                  <div style={styles.previewBox}>
                    <span>🎉 <strong>{selectedHall.name}</strong> — {selectedHall.capacity} pers.</span>
                    <span>{Number(selectedHall.pricePerDay).toFixed(2)} FCFA / jour</span>
                  </div>
                )}
              </div>

              <p style={styles.sectionLabel}>Date & montant</p>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Date de début *</label>
                  <input name="startDate" type="date" min={today} value={form.startDate} onChange={handleChange} required style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Date de fin *</label>
                  <input name="endDate" type="date" min={form.startDate || today} value={form.endDate} onChange={handleChange} required style={styles.input} />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Avance versée (FCFA)</label>
                  <input name="advanceAmount" type="number" min="0" step="0.01" value={form.advanceAmount} onChange={handleChange} style={styles.input} placeholder="0.00" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Durée estimée</label>
                  <input value={dayCount ? `${dayCount} jour(s)` : ''} readOnly style={{ ...styles.input, background: '#f8fafc' }} placeholder="0 jour" />
                </div>
              </div>

              {estimatedTotal && (
                <div style={styles.totalPreview}>
                  <span>💰 Montant estimé</span>
                  <strong>{estimatedTotal} FCFA</strong>
                </div>
              )}

              <div style={styles.actions}>
                <button type="button" onClick={() => navigate('/hall-bookings')} style={styles.btnBack}>Annuler</button>
                <button type="submit" disabled={saving} style={styles.btnSave}>{saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer la réservation'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  wrapper: { maxWidth: '700px', margin: '0 auto' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px' },
  sectionLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' },
  row: { display: 'flex', gap: '20px', marginBottom: '4px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' },
  fieldFull: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' },
  previewBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', marginTop: '8px', fontSize: '13px', color: '#0369a1' },
  totalPreview: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', marginBottom: '20px', fontSize: '15px', color: '#166534' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  btnBack: { padding: '10px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' },
  btnSave: { padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' },
  info: { textAlign: 'center', color: '#64748b', padding: '40px 0', fontSize: '14px' },
  errorMsg: { padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' },
};