import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PublicLayout from '../../components/public/PublicLayout';
import { formatCurrency, getHallImageUrl, getRoomImageUrl, getShortText } from './publicUtils';

export default function PublicHomePage() {
  const [rooms, setRooms] = useState([]);
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    Promise.allSettled([api.get('/public/rooms'), api.get('/public/halls')]).then(([roomsRes, hallsRes]) => {
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data.data || []);
      if (hallsRes.status === 'fulfilled') setHalls(hallsRes.value.data.data || []);
    });
  }, []);

  const startingPrice = useMemo(() => {
    if (!rooms.length) return 0;
    return Math.min(...rooms.map((room) => Number(room.price || 0)));
  }, [rooms]);

  return (
    <PublicLayout>
      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="public-kicker">Bienvenue à Bladjo Hotel</span>
          <h1>Un séjour chaleureux, élégant et simple à réserver.</h1>
          <p className="public-lead">
            Découvrez nos chambres confortables et nos salles de réception conçues pour accueillir vos séjours,
            cérémonies, réunions et moments d’exception.
          </p>
          <div className="public-cta-row">
            <Link to="/reservation" className="public-primary-link">Réserver un séjour</Link>
            <Link to="/salles" className="public-ghost-link">Voir les salles</Link>
          </div>
          <div className="public-pill-row">
            <span className="public-pill">Chambres disponibles en ligne</span>
            <span className="public-pill">Réservation de salles de réception</span>
            <span className="public-pill">Confirmation traitée par l’hôtel</span>
          </div>
        </div>

        <div className="public-hero-card">
          <div>
            <span className="public-kicker">Pourquoi nous choisir</span>
            <h2>Une expérience accueillante au style hôtel premium.</h2>
          </div>
          <div>
            <div className="public-stat">
              <strong>{rooms.length}</strong>
              <span>chambre(s) visible(s) en ligne</span>
            </div>
            <div className="public-stat">
              <strong>{halls.length}</strong>
              <span>salle(s) de réception disponible(s)</span>
            </div>
            <div className="public-stat">
              <strong>{formatCurrency(startingPrice)} FCFA</strong>
              <span>tarif de départ par nuit</span>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-page-head">
          <span className="public-kicker">Nos chambres</span>
          <h2>Confort, calme et raffinement</h2>
          <p className="public-page-subtitle">Quelques chambres disponibles pour vos prochains séjours.</p>
        </div>
        <div className="public-grid">
          {rooms.slice(0, 3).map((room) => {
            const imageUrl = getRoomImageUrl(room);
            return (
              <article key={room.id} className="public-card">
                <div className={`public-card-media${imageUrl ? '' : ' public-card-media--placeholder'}`}>
                  {imageUrl ? <img src={imageUrl} alt={room.type} /> : <span>🛏️</span>}
                </div>
                <div className="public-card-body">
                  <div className="public-card-title-row">
                    <h3>{room.type}</h3>
                    <span className="public-price">{formatCurrency(room.price)} <small>FCFA / nuit</small></span>
                  </div>
                  <div className="public-meta">
                    <span>Chambre N° {room.roomNumber}</span>
                    <span>Disponible</span>
                  </div>
                  <p>{getShortText(room.description)}</p>
                  <div className="public-card-actions">
                    <Link to={`/chambres/${room.id}`} className="public-ghost-link">Voir détails</Link>
                    <Link to={`/reservation?kind=room&id=${room.id}`} className="public-primary-link">Réserver</Link>
                    <Link to="/chambres" className="public-ghost-link">Tout voir</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-section">
        <div className="public-page-head">
          <span className="public-kicker">Événements</span>
          <h2>Des salles adaptées à vos réceptions</h2>
          <p className="public-page-subtitle">Mariage, conférence, anniversaire ou séminaire : nous avons l’espace qu’il vous faut.</p>
        </div>
        <div className="public-grid">
          {halls.slice(0, 2).map((hall) => {
            const imageUrl = getHallImageUrl(hall);
            return (
              <article key={hall.id} className="public-card">
                <div className={`public-card-media${imageUrl ? '' : ' public-card-media--placeholder'}`}>
                  {imageUrl ? <img src={imageUrl} alt={hall.name} /> : <span>🎉</span>}
                </div>
                <div className="public-card-body">
                  <div className="public-card-title-row">
                    <h3>{hall.name}</h3>
                    <span className="public-price">{formatCurrency(hall.pricePerDay)} <small>FCFA / jour</small></span>
                  </div>
                  <div className="public-meta">
                    <span>Capacité : {hall.capacity} pers.</span>
                    <span>Réservation sur période</span>
                  </div>
                  <p>{getShortText(hall.description, 120)}</p>
                  <div className="public-card-actions">
                    <Link to={`/salles/${hall.id}`} className="public-ghost-link">Voir détails</Link>
                    <Link to={`/reservation?kind=hall&id=${hall.id}`} className="public-primary-link">Réserver la salle</Link>
                    <Link to="/salles" className="public-ghost-link">Découvrir</Link>
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