import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/public/PublicLayout';
import { formatCurrency, getRoomImageUrl, getShortText } from './publicUtils';

export default function PublicRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/rooms')
      .then((res) => setRooms(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les chambres.'))
      .finally(() => setLoading(false));
  }, []);

  const roomTypes = useMemo(() => [...new Set(rooms.map((room) => room.type).filter(Boolean))], [rooms]);
  const displayedRooms = typeFilter === 'ALL' ? rooms : rooms.filter((room) => room.type === typeFilter);

  return (
    <PublicLayout>
      <section className="public-section">
        <div className="public-page-head">
          <span className="public-kicker">Séjours</span>
          <h1 className="public-page-title">Nos chambres</h1>
          <p className="public-page-subtitle">
            Parcourez nos chambres disponibles et choisissez l’espace idéal pour un séjour reposant au Bladjo Hotel.
          </p>
        </div>

        <div className="public-toolbar">
          <div className="public-field">
            <label htmlFor="typeFilter">Filtrer par type</label>
            <select
              id="typeFilter"
              className="public-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Tous les types</option>
              {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="public-pill">{displayedRooms.length} chambre(s) affichée(s)</div>
        </div>

        {loading && <div className="public-empty">Chargement des chambres…</div>}
        {error && <div className="public-alert error">{error}</div>}
        {!loading && !error && displayedRooms.length === 0 && (
          <div className="public-empty">Aucune chambre disponible pour ce filtre.</div>
        )}

        <div className="public-grid">
          {displayedRooms.map((room) => {
            const imageUrl = getRoomImageUrl(room);
            return (
              <article key={room.id} className="public-card">
                <div className={`public-card-media${imageUrl ? '' : ' public-card-media--placeholder'}`}>
                  {imageUrl ? <img src={imageUrl} alt={`${room.type} ${room.roomNumber}`} /> : <span>🛏️</span>}
                </div>
                <div className="public-card-body">
                  <div className="public-card-title-row">
                    <h3>{room.type}</h3>
                    <span className="public-price">{formatCurrency(room.price)} <small>FCFA / nuit</small></span>
                  </div>
                  <div className="public-meta">
                    <span>Chambre N° {room.roomNumber}</span>
                    <span>Réservable en ligne</span>
                  </div>
                  <p>{getShortText(room.description, 140)}</p>
                  <div className="public-card-actions">
                    <Link to={`/chambres/${room.id}`} className="public-ghost-link">Voir les détails</Link>
                    <Link to={`/reservation?kind=room&id=${room.id}`} className="public-primary-link">Réserver cette chambre</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}