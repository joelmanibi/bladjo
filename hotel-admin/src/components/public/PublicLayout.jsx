import { Link, NavLink } from 'react-router-dom';
import '../../public.css';

const NAV_ITEMS = [
  { label: 'Accueil', path: '/' },
  { label: 'Chambres', path: '/chambres' },
  { label: 'Salles', path: '/salles' },
  { label: 'Réservation', path: '/reservation' },
];

export default function PublicLayout({ children }) {
  return (
    <div className="bladjo-site">
      <header className="public-header">
        <div className="public-container public-header-inner">
          <Link to="/" className="public-brand">
            <small>Hospitalité & élégance</small>
            <strong>Bladjo Hotel</strong>
          </Link>

          <nav className="public-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="public-actions">
            <Link to="/reservation" className="public-primary-link">Réserver maintenant</Link>
          </div>
        </div>
      </header>

      <main className="public-page">
        <div className="public-container">{children}</div>
      </main>

      <footer className="public-footer">
        <div className="public-container public-footer-inner">
          <div>
            <h4>Bladjo Hotel</h4>
            <p>Un accueil chaleureux, des chambres confortables et des espaces élégants pour vos événements.</p>
          </div>
          <div>
            <h4>Réservations</h4>
            <p>Chambres disponibles en ligne</p>
            <p>Salles de réception pour vos événements</p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>Téléphone : +225 00 00 00 00</p>
            <p>Email : contact@bladjohotel.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}