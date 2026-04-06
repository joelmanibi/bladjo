import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/public/PublicLayout';
import { calcInclusiveDayCount, calcNightCount, formatCurrency } from './publicUtils';

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  customerName: '',
  phone: '',
  advanceAmount: '',
  roomId: '',
  hallId: '',
  checkInDate: '',
  checkOutDate: '',
  startDate: '',
  endDate: '',
};

export default function PublicReservationPage() {
  const [searchParams] = useSearchParams();
  const [kind, setKind] = useState('room');
  const [rooms, setRooms] = useState([]);
  const [halls, setHalls] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([api.get('/public/rooms'), api.get('/public/halls')]).then(([roomsRes, hallsRes]) => {
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data.data || []);
      if (hallsRes.status === 'fulfilled') setHalls(hallsRes.value.data.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const queryKind = searchParams.get('kind');
    const queryId = searchParams.get('id');
    const queryCheckInDate = searchParams.get('checkInDate');
    const queryCheckOutDate = searchParams.get('checkOutDate');
    const queryStartDate = searchParams.get('startDate');
    const queryEndDate = searchParams.get('endDate');

    if (queryKind === 'room' || queryKind === 'hall') {
      setKind(queryKind);
      setForm((prev) => ({
        ...prev,
        roomId: queryKind === 'room' ? (queryId || prev.roomId) : prev.roomId,
        hallId: queryKind === 'hall' ? (queryId || prev.hallId) : prev.hallId,
        checkInDate: queryKind === 'room' ? (queryCheckInDate || prev.checkInDate) : prev.checkInDate,
        checkOutDate: queryKind === 'room' ? (queryCheckOutDate || prev.checkOutDate) : prev.checkOutDate,
        startDate: queryKind === 'hall' ? (queryStartDate || prev.startDate) : prev.startDate,
        endDate: queryKind === 'hall' ? (queryEndDate || prev.endDate) : prev.endDate,
      }));
    }
  }, [searchParams]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(form.roomId)),
    [rooms, form.roomId]
  );

  const selectedHall = useMemo(
    () => halls.find((hall) => String(hall.id) === String(form.hallId)),
    [halls, form.hallId]
  );

  const nightCount = calcNightCount(form.checkInDate, form.checkOutDate);
  const estimatedRoomTotal = selectedRoom && nightCount ? Number(selectedRoom.price) * nightCount : 0;
  const hallDayCount = calcInclusiveDayCount(form.startDate, form.endDate);
  const estimatedHallTotal = selectedHall && hallDayCount ? Number(selectedHall.pricePerDay) * hallDayCount : 0;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (kind === 'room') {
        await api.post('/public/room-bookings', {
          roomId: form.roomId,
          customerName: form.customerName,
          phone: form.phone,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          advanceAmount: form.advanceAmount || 0,
        });
      } else {
        await api.post('/public/hall-bookings', {
          hallId: form.hallId,
          customerName: form.customerName,
          phone: form.phone,
          startDate: form.startDate,
          endDate: form.endDate,
          advanceAmount: form.advanceAmount || 0,
        });
      }

      setSuccess('Votre demande de réservation a été envoyée avec succès. Elle reste en attente jusqu’à validation par le gérant ou l’administrateur de la plateforme.');
      setForm((prev) => ({
        ...initialForm,
        roomId: kind === 'room' ? prev.roomId : '',
        hallId: kind === 'hall' ? prev.hallId : '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d’envoyer la réservation pour le moment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicLayout>
      <section className="public-two-col">
        <div className="public-form-card">
          <span className="public-kicker">Réservation en ligne</span>
          <h1 className="public-page-title">Réservez votre expérience</h1>
          <p className="public-page-subtitle">
            Choisissez une chambre ou une salle, renseignez vos informations et envoyez votre demande en quelques instants.
          </p>

          <div className="public-alert info">
            Après l’envoi, votre réservation reste en attente. Elle sera validée sur la plateforme par le gérant ou l’administrateur avant confirmation finale.
          </div>

          <div className="public-tabs">
            <button type="button" className={`public-tab${kind === 'room' ? ' active' : ''}`} onClick={() => setKind('room')}>
              Chambre
            </button>
            <button type="button" className={`public-tab${kind === 'hall' ? ' active' : ''}`} onClick={() => setKind('hall')}>
              Salle de réception
            </button>
          </div>

          {success && <div className="public-alert success">{success}</div>}
          {error && <div className="public-alert error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="public-form-grid">
              <div className="public-field">
                <label htmlFor="customerName">Nom complet</label>
                <input id="customerName" className="public-input" value={form.customerName} onChange={handleChange('customerName')} required />
              </div>
              <div className="public-field">
                <label htmlFor="phone">Téléphone</label>
                <input id="phone" className="public-input" value={form.phone} onChange={handleChange('phone')} required />
              </div>
            </div>

            {kind === 'room' ? (
              <>
                <div className="public-field">
                  <label htmlFor="roomId">Choisir une chambre</label>
                  <select id="roomId" className="public-select" value={form.roomId} onChange={handleChange('roomId')} required>
                    <option value="">Sélectionner une chambre</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.type} — Chambre {room.roomNumber} — {formatCurrency(room.price)} FCFA / nuit
                      </option>
                    ))}
                  </select>
                </div>

                <div className="public-form-grid">
                  <div className="public-field">
                    <label htmlFor="checkInDate">Date d’arrivée</label>
                    <input id="checkInDate" type="date" min={today} className="public-input" value={form.checkInDate} onChange={handleChange('checkInDate')} required />
                  </div>
                  <div className="public-field">
                    <label htmlFor="checkOutDate">Date de départ</label>
                    <input id="checkOutDate" type="date" min={form.checkInDate || today} className="public-input" value={form.checkOutDate} onChange={handleChange('checkOutDate')} required />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="public-field">
                  <label htmlFor="hallId">Choisir une salle</label>
                  <select id="hallId" className="public-select" value={form.hallId} onChange={handleChange('hallId')} required>
                    <option value="">Sélectionner une salle</option>
                    {halls.map((hall) => (
                      <option key={hall.id} value={hall.id}>
                        {hall.name} — {hall.capacity} pers. — {formatCurrency(hall.pricePerDay)} FCFA / jour
                      </option>
                    ))}
                  </select>
                </div>

                <div className="public-field">
                  <label htmlFor="startDate">Date de début</label>
                  <input id="startDate" type="date" min={today} className="public-input" value={form.startDate} onChange={handleChange('startDate')} required />
                </div>
                <div className="public-field">
                  <label htmlFor="endDate">Date de fin</label>
                  <input id="endDate" type="date" min={form.startDate || today} className="public-input" value={form.endDate} onChange={handleChange('endDate')} required />
                </div>
              </>
            )}

            <div className="public-field">
              <label htmlFor="advanceAmount">Avance prévue (optionnel)</label>
              <input id="advanceAmount" type="number" min="0" className="public-input" value={form.advanceAmount} onChange={handleChange('advanceAmount')} placeholder="0" />
            </div>

            <div className="public-card-actions">
              <button type="submit" className="public-button" disabled={saving || loading}>
                {saving ? 'Envoi en cours…' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>

        <aside className="public-summary-card">
          <span className="public-kicker">Résumé</span>
          <h2>Votre sélection</h2>
          <p className="public-page-subtitle">Le montant exact sera confirmé par l’hôtel après validation de la demande.</p>

          {loading ? <div className="public-empty">Chargement des options…</div> : null}

          {!loading && kind === 'room' && selectedRoom && (
            <>
              <div className="public-summary-row">
                <strong>{selectedRoom.type}</strong>
                <span className="public-price">{formatCurrency(selectedRoom.price)} <small>FCFA / nuit</small></span>
              </div>
              <div className="public-summary-grid">
                <div className="public-summary-item">
                  <span className="public-summary-label">Chambre</span>
                  <span className="public-summary-value">N° {selectedRoom.roomNumber}</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Durée</span>
                  <span className="public-summary-value">{nightCount || 0} nuit(s)</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Estimation</span>
                  <span className="public-summary-value">{formatCurrency(estimatedRoomTotal)} FCFA</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Statut initial</span>
                  <span className="public-summary-value">En attente de validation</span>
                </div>
              </div>
            </>
          )}

          {!loading && kind === 'hall' && selectedHall && (
            <>
              <div className="public-summary-row">
                <strong>{selectedHall.name}</strong>
                <span className="public-price">{formatCurrency(selectedHall.pricePerDay)} <small>FCFA / jour</small></span>
              </div>
              <div className="public-summary-grid">
                <div className="public-summary-item">
                  <span className="public-summary-label">Capacité</span>
                  <span className="public-summary-value">{selectedHall.capacity} pers.</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Estimation</span>
                  <span className="public-summary-value">{formatCurrency(estimatedHallTotal)} FCFA</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Période</span>
                  <span className="public-summary-value">{form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : 'À sélectionner'}</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Durée</span>
                  <span className="public-summary-value">{hallDayCount || 0} jour(s)</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Statut initial</span>
                  <span className="public-summary-value">En attente de validation</span>
                </div>
              </div>
            </>
          )}

          {!loading && ((kind === 'room' && !selectedRoom) || (kind === 'hall' && !selectedHall)) && (
            <div className="public-empty">Sélectionnez une option pour voir le résumé de votre réservation.</div>
          )}
        </aside>
      </section>
    </PublicLayout>
  );
}