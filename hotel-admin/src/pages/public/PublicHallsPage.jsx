import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/public/PublicLayout';
import { formatCurrency, getHallImageUrl, getShortText } from './publicUtils';

export default function PublicHallsPage() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/halls')
      .then((res) => setHalls(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les salles.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <section className="public-section">
        <div className="public-page-head">
          <span className="public-kicker">Réceptions & événements</span>
          <h1 className="public-page-title">Nos salles de réception</h1>
          <p className="public-page-subtitle">
            Des espaces élégants et accueillants pour vos cérémonies, conférences, anniversaires et événements professionnels.
          </p>
        </div>

        {loading && <div className="public-empty">Chargement des salles…</div>}
        {error && <div className="public-alert error">{error}</div>}
        {!loading && !error && halls.length === 0 && (
          <div className="public-empty">Aucune salle n’est encore disponible en ligne.</div>
        )}

        <div className="public-grid">
          {halls.map((hall) => {
            const imageUrl = getHallImageUrl(hall);
            return (
              <article key={hall.id} className="public-card">
                <div className={`public-card-media${imageUrl ? '' : ' public-card-media--placeholder'}`}>
                  {imageUrl ? <img src={imageUrl} alt={hall.name} /> : <span>🎊</span>}
                </div>
                <div className="public-card-body">
                  <div className="public-card-title-row">
                    <h3>{hall.name}</h3>
                    <span className="public-price">{formatCurrency(hall.pricePerDay)} <small>FCFA / jour</small></span>
                  </div>
                  <div className="public-meta">
                    <span>Capacité : {hall.capacity} personnes</span>
                    <span>Réservation sur période</span>
                  </div>
                  <p>{getShortText(hall.description, 150)}</p>
                  <div className="public-card-actions">
                    <Link to={`/salles/${hall.id}`} className="public-ghost-link">Voir les détails</Link>
                    <Link to={`/reservation?kind=hall&id=${hall.id}`} className="public-primary-link">Réserver cette salle</Link>
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