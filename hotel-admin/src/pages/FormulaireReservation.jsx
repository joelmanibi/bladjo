import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const EMPTY = {
  customerName: '',
  phone:        '',
  roomId:       '',
  checkInDate:  '',
  checkOutDate: '',
  advanceAmount: '',
};

const STATUS_LABELS = {
  AVAILABLE:   'Disponible',
  OCCUPIED:    'Occupée',
  CLEANING:    'Nettoyage',
  MAINTENANCE: 'Maintenance',
};

export default function FormulaireReservation() {
  const navigate = useNavigate();

  const [form,   setForm]   = useState(EMPTY);
  const [rooms,  setRooms]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Load all rooms (filter out OCCUPIED in the select)
  useEffect(() => {
    api.get('/rooms').then((r) => setRooms(r.data.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Selected room object
  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(form.roomId)) || null,
    [rooms, form.roomId]
  );

  // Estimated total: price × nights
  const estimatedTotal = useMemo(() => {
    if (!selectedRoom || !form.checkInDate || !form.checkOutDate) return null;
    const nights = Math.round(
      (new Date(form.checkOutDate) - new Date(form.checkInDate)) / 86400000
    );
    if (nights <= 0) return null;
    return (parseFloat(selectedRoom.price) * nights).toFixed(2);
  }, [selectedRoom, form.checkInDate, form.checkOutDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/bookings', {
        roomId:        parseInt(form.roomId, 10),
        customerName:  form.customerName.trim(),
        phone:         form.phone.trim(),
        checkInDate:   form.checkInDate,
        checkOutDate:  form.checkOutDate,
        advanceAmount: form.advanceAmount ? parseFloat(form.advanceAmount) : 0,
      });
      navigate('/reservations');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  // Today as min date for inputs
  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminLayout title="Nouvelle réservation">
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Nouvelle réservation</h3>

          <form onSubmit={handleSubmit}>
            {error && <p style={styles.errorMsg}>{error}</p>}

            {/* Client info */}
            <p style={styles.sectionLabel}>Informations client</p>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Nom complet *</label>
                <input name="customerName" value={form.customerName} onChange={handleChange}
                  required style={styles.input} placeholder="ex: Mohamed Alami" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Téléphone *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  required style={styles.input} placeholder="ex: 0612345678" />
              </div>
            </div>

            {/* Room */}
            <p style={styles.sectionLabel}>Chambre</p>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Sélectionner une chambre *</label>
              <select name="roomId" value={form.roomId} onChange={handleChange}
                required style={styles.input}>
                <option value="">-- Choisir une chambre --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}
                    disabled={r.status === 'OCCUPIED'}>
                    Chambre {r.roomNumber} — {r.type} — {Number(r.price).toFixed(2)} FCFA/nuit
                    {r.status !== 'AVAILABLE' ? ` (${STATUS_LABELS[r.status]})` : ''}
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <div style={styles.roomPreview}>
                  <span>🛏 <strong>{selectedRoom.roomNumber}</strong> — {selectedRoom.type}</span>
                  <span>{Number(selectedRoom.price).toFixed(2)}  FCFA/ nuit</span>
                </div>
              )}
            </div>

            {/* Dates */}
            <p style={styles.sectionLabel}>Dates du séjour</p>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Date d'arrivée *</label>
                <input name="checkInDate" type="date" value={form.checkInDate}
                  onChange={handleChange} required style={styles.input} min={today} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Date de départ *</label>
                <input name="checkOutDate" type="date" value={form.checkOutDate}
                  onChange={handleChange} required style={styles.input}
                  min={form.checkInDate || today} />
              </div>
            </div>

            {/* Total preview */}
            {estimatedTotal && (
              <div style={styles.totalPreview}>
                <span>💰 Montant estimé</span>
                <strong>{estimatedTotal} FCFA</strong>
              </div>
            )}

            {/* Advance */}
            <div style={styles.fieldFull}>
              <label style={styles.label}>Avance versée ( FCFA)</label>
              <input name="advanceAmount" type="number" min="0" step="0.01"
                value={form.advanceAmount} onChange={handleChange}
                style={styles.input} placeholder="0.00" />
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => navigate('/reservations')} style={styles.btnBack}>
                Annuler
              </button>
              <button type="submit" disabled={saving} style={styles.btnSave}>
                {saving ? 'Création...' : 'Créer la réservation'}
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
  wrapper:   { maxWidth: '700px', margin: '0 auto' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: '0.08em', margin: '20px 0 12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px',
  },
  row:      { display: 'flex', gap: '20px', marginBottom: '4px' },
  field:    { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' },
  fieldFull:{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' },
  label:    { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input:    {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  roomPreview: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd',
    borderRadius: '8px', marginTop: '8px', fontSize: '13px', color: '#0369a1',
  },
  totalPreview: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: '10px', marginBottom: '20px', fontSize: '15px', color: '#166534',
  },
  actions:  { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
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

