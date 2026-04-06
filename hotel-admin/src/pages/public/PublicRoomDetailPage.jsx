import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/public/PublicLayout';
import AvailabilityCalendar from '../../components/public/AvailabilityCalendar';
import { formatCurrency, getRoomImageUrls } from './publicUtils';

export default function PublicRoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedRange, setSelectedRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/public/rooms/${id}`)
      .then((res) => setRoom(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger cette chambre.'))
      .finally(() => setLoading(false));
  }, [id]);

  const images = useMemo(() => getRoomImageUrls(room), [room]);
  const hasImages = images.length > 0;

  useEffect(() => {
    setActiveImage(0);
    setSelectedRange({ startDate: '', endDate: '' });
  }, [id]);

  const goToReservation = () => {
    if (!room || !selectedRange.startDate || !selectedRange.endDate) return;
    navigate(`/reservation?kind=room&id=${room.id}&checkInDate=${selectedRange.startDate}&checkOutDate=${selectedRange.endDate}`);
  };

  const prevImage = () => setActiveImage((index) => Math.max(0, index - 1));
  const nextImage = () => setActiveImage((index) => Math.min(images.length - 1, index + 1));

  return (
    <PublicLayout>
      <section className="public-section">
        <div className="public-breadcrumb">
          <Link to="/">Accueil</Link>
          <span>›</span>
          <Link to="/chambres">Chambres</Link>
          <span>›</span>
          <strong>{room?.type || 'Détail chambre'}</strong>
        </div>

        {loading && <div className="public-empty">Chargement de la chambre…</div>}
        {error && <div className="public-alert error">{error}</div>}

        {!loading && room && (
          <div className="public-detail-layout">
            <div className="public-detail-gallery-card">
              {hasImages ? (
                <>
                  <div className="public-gallery-main">
                    {activeImage > 0 && <button type="button" className="public-gallery-arrow left" onClick={prevImage}>‹</button>}
                    <img src={images[activeImage]} alt={`${room.type} ${room.roomNumber}`} className="public-gallery-image" />
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
                <div className="public-gallery-placeholder"><span>🛏️</span></div>
              )}
            </div>

            <aside className="public-detail-card">
              <span className="public-kicker">Chambre disponible</span>
              <h1 className="public-page-title">{room.type}</h1>
              <p className="public-page-subtitle">Chambre N° {room.roomNumber} pensée pour un séjour calme, confortable et élégant.</p>

              <div className="public-detail-meta-grid">
                <div className="public-summary-item">
                  <span className="public-summary-label">Tarif</span>
                  <span className="public-summary-value">{formatCurrency(room.price)} FCFA / nuit</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Statut</span>
                  <span className="public-summary-value">Disponible</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Type</span>
                  <span className="public-summary-value">{room.type}</span>
                </div>
                <div className="public-summary-item">
                  <span className="public-summary-label">Référence</span>
                  <span className="public-summary-value">Chambre {room.roomNumber}</span>
                </div>
              </div>

              <div className="public-detail-description">
                <h3>Description</h3>
                <p>{room.description || 'Profitez d’un espace soigné, d’une ambiance reposante et d’un accueil chaleureux signé Bladjo Hotel.'}</p>
              </div>

              <div className="public-inline-actions">
                <button type="button" className="public-button-secondary" onClick={() => setShowAvailability(true)}>
                  Voir disponibilité
                </button>
                {selectedRange.startDate && selectedRange.endDate && (
                  <span className="public-selected-date-chip">Séjour : {selectedRange.startDate} → {selectedRange.endDate}</span>
                )}
              </div>

              <div className="public-card-actions">
                <Link to={`/reservation?kind=room&id=${room.id}`} className="public-primary-link">Réserver cette chambre</Link>
                <Link to="/chambres" className="public-ghost-link">Retour aux chambres</Link>
              </div>
            </aside>
          </div>
        )}

        {showAvailability && room && (
          <div className="public-modal-backdrop" onClick={() => setShowAvailability(false)}>
            <div className="public-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="public-modal-head">
                <div>
                  <h3>Disponibilité de la chambre</h3>
                  <p>Choisissez une date libre pour commencer votre réservation.</p>
                </div>
                <button type="button" className="public-modal-close" onClick={() => setShowAvailability(false)}>✕</button>
              </div>

              <AvailabilityCalendar
                reservedDates={room.reservedDates || []}
                blockedRanges={room.reservedRanges || []}
                label="Jour réservé"
                selectionMode="room"
                onRangeSelect={setSelectedRange}
                reservedAlertMessage="Cette date est déjà prise pour cette chambre."
                rangeConflictAlertMessage="Cette période chevauche une réservation existante pour cette chambre."
              />

              <div className="public-modal-actions">
                <button type="button" className="public-ghost-link" onClick={() => setShowAvailability(false)}>Fermer</button>
                <button type="button" className="public-button" onClick={goToReservation} disabled={!selectedRange.startDate || !selectedRange.endDate}>
                  Réserver ces dates
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}