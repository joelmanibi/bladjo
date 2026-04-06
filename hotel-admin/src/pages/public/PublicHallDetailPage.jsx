import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/public/PublicLayout';
import AvailabilityCalendar from '../../components/public/AvailabilityCalendar';
import { formatCurrency, getHallImageUrls } from './publicUtils';

export default function PublicHallDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedRange, setSelectedRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/public/halls/${id}`)
      .then((res) => setHall(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger cette salle.'))
      .finally(() => setLoading(false));
  }, [id]);

  const images = useMemo(() => getHallImageUrls(hall), [hall]);
  const hasImages = images.length > 0;

  useEffect(() => {
    setActiveImage(0);
    setSelectedRange({ startDate: '', endDate: '' });
  }, [id]);

  const goToReservation = () => {
    if (!hall || !selectedRange.startDate || !selectedRange.endDate) return;
    navigate(`/reservation?kind=hall&id=${hall.id}&startDate=${selectedRange.startDate}&endDate=${selectedRange.endDate}`);
  };

  const prevImage = () => setActiveImage((index) => Math.max(0, index - 1));
  const nextImage = () => setActiveImage((index) => Math.min(images.length - 1, index + 1));

  return (
    <PublicLayout>
      <section className="public-section">
        <div className="public-breadcrumb">
          <Link to="/">Accueil</Link>
          <span>›</span>
          <Link to="/salles">Salles</Link>
          <span>›</span>
          <strong>{hall?.name || 'Détail salle'}</strong>
        </div>

        {loading && <div className="public-empty">Chargement de la salle…</div>}
        {error && <div className="public-alert error">{error}</div>}

        {!loading && hall && (
          <div className="public-detail-layout">
            <div className="public-detail-gallery-card">
              {hasImages ? (
                <>
                  <div className="public-gallery-main">
                    {activeImage > 0 && <button type="button" className="public-gallery-arrow left" onClick={prevImage}>‹</button>}
                    <img src={images[activeImage]} alt={hall.name} className="public-gallery-image" />
                    {activeImage < images.length - 1 && <button type="button" className="public-gallery-arrow right" onClick={nextImage}>›</button>}
                  </div>
                  {images.length > 1 && (
                    <div className="public-gallery-thumbs">
                      {images.map((imageUrl, index) => (
                        <button
                          key={imageUrl}
                          type="button"
                          className={`public-gallery-thumb${index === activeImage ? ' active' : ''}`}
                          onClick={() => setActiveImage(index)}
                        >
                          <img src={imageUrl} alt={`Vue ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="public-gallery-placeholder"><span>🎉</span></div>
              )}
            </div>

            <aside className="public-detail-card">
              <span className="public-kicker">Salle de réception</span>
              <h1 className="public-page-title">{hall.name}</h1>
              <p className="public-page-subtitle">Un espace élégant et accueillant pour vos cérémonies, anniversaires, séminaires et événements professionnels.</p>

              <div className="public-detail-meta-grid">
                <div className="public-summary-item">
                  <span className="public-summary-label">Tarif</span>
                  <span className="public-summary-value">{formatCurrency(hall.pricePerDay)} FCFA / jour</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Capacité</span>
                  <span className="public-summary-value">{hall.capacity} personnes</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Réservation</span>
                  <span className="public-summary-value">Par période</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Photos</span>
                  <span className="public-summary-value">{images.length}</span>
                </div>
              </div>

              <div className="public-detail-description">
                <h3>Description</h3>
                <p>{hall.description || 'Un cadre raffiné pour accueillir vos moments importants avec le service chaleureux du Bladjo Hotel.'}</p>
              </div>

              <div className="public-inline-actions">
                <button type="button" className="public-button-secondary" onClick={() => setShowAvailability(true)}>
                  Voir disponibilité
                </button>
                {selectedRange.startDate && selectedRange.endDate && (
                  <span className="public-selected-date-chip">Période : {selectedRange.startDate} → {selectedRange.endDate}</span>
                )}
              </div>

              <div className="public-card-actions">
                <Link to={`/reservation?kind=hall&id=${hall.id}`} className="public-primary-link">Réserver cette salle</Link>
                <Link to="/salles" className="public-ghost-link">Retour aux salles</Link>
              </div>
            </aside>
          </div>
        )}

        {showAvailability && hall && (
          <div className="public-modal-backdrop" onClick={() => setShowAvailability(false)}>
            <div className="public-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="public-modal-head">
                <div>
                  <h3>Disponibilité de la salle</h3>
                  <p>Choisissez une date de début puis une date de fin libres pour préparer votre réservation.</p>
                </div>
                <button type="button" className="public-modal-close" onClick={() => setShowAvailability(false)}>✕</button>
              </div>

              <AvailabilityCalendar
                reservedDates={hall.reservedDates || []}
                blockedRanges={hall.reservedRanges || []}
                label="Date réservée"
                selectionMode="hall"
                onRangeSelect={setSelectedRange}
                reservedAlertMessage="Cette date est déjà prise pour cette salle."
                rangeConflictAlertMessage="Cette période chevauche une réservation existante pour cette salle."
              />

              <div className="public-modal-actions">
                <button type="button" className="public-ghost-link" onClick={() => setShowAvailability(false)}>Fermer</button>
                <button type="button" className="public-button" onClick={goToReservation} disabled={!selectedRange.startDate || !selectedRange.endDate}>
                  Réserver cette période
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}