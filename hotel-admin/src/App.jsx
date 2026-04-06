import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage                from './pages/LoginPage';
import DashboardPage            from './pages/DashboardPage';
import AccessDenied             from './pages/AccessDenied';
import ListeChambres            from './pages/ListeChambres';
import FormulaireChambre        from './pages/FormulaireChambre';
import DetailChambre            from './pages/DetailChambre';
import ListeSalles              from './pages/ListeSalles';
import FormulaireSalle          from './pages/FormulaireSalle';
import DetailSalle              from './pages/DetailSalle';
import ListeReservationsSalles  from './pages/ListeReservationsSalles';
import FormulaireReservationSalle from './pages/FormulaireReservationSalle';
import ListeReservations        from './pages/ListeReservations';
import FormulaireReservation    from './pages/FormulaireReservation';
import CalendrierReservations   from './pages/CalendrierReservations';
import ListeStock               from './pages/ListeStock';
import FormulaireStock          from './pages/FormulaireStock';
import ListeDemandes            from './pages/ListeDemandes';
import NouvelleDemande          from './pages/NouvelleDemande';
import ListeEmployes            from './pages/ListeEmployes';
import FormulaireEmploye        from './pages/FormulaireEmploye';
import UsersPage                from './pages/UsersPage';
import ImmeublesPage            from './pages/ImmeublesPage';
import AppartementsPage         from './pages/AppartementsPage';
import LocatairesPage           from './pages/LocatairesPage';
import ContratsPage             from './pages/ContratsPage';
import LoyersPage               from './pages/LoyersPage';
import PublicHomePage           from './pages/public/PublicHomePage';
import PublicRoomsPage          from './pages/public/PublicRoomsPage';
import PublicHallsPage          from './pages/public/PublicHallsPage';
import PublicRoomDetailPage     from './pages/public/PublicRoomDetailPage';
import PublicHallDetailPage     from './pages/public/PublicHallDetailPage';
import PublicReservationPage    from './pages/public/PublicReservationPage';
import { getAuth }              from './utils/auth';

// ─── Route guard: checks auth + role ─────────────────────────────────────────
function RoleProtectedRoute({ children, allowedRoles }) {
  const { token, role } = getAuth();
  if (!token || !role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/access-denied" replace />;
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"             element={<PublicHomePage />} />
        <Route path="/chambres"     element={<PublicRoomsPage />} />
        <Route path="/chambres/:id" element={<PublicRoomDetailPage />} />
        <Route path="/salles"       element={<PublicHallsPage />} />
        <Route path="/salles/:id"   element={<PublicHallDetailPage />} />
        <Route path="/reservation"  element={<PublicReservationPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Dashboard — all authenticated roles */}
        <Route path="/dashboard" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <DashboardPage />
          </RoleProtectedRoute>
        } />

        {/* Users — SUPER_ADMIN only */}
        <Route path="/users" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <UsersPage />
          </RoleProtectedRoute>
        } />

        {/* Rooms — list: all roles */}
        <Route path="/rooms" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <ListeChambres />
          </RoleProtectedRoute>
        } />

        {/* Rooms — new: SUPER_ADMIN + GERANT only */}
        <Route path="/rooms/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireChambre />
          </RoleProtectedRoute>
        } />

        {/* Rooms — detail: all roles */}
        <Route path="/rooms/:id" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <DetailChambre />
          </RoleProtectedRoute>
        } />

        {/* Rooms — edit: SUPER_ADMIN + GERANT only */}
        <Route path="/rooms/:id/edit" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireChambre />
          </RoleProtectedRoute>
        } />

        {/* Halls — list: all roles */}
        <Route path="/halls" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <ListeSalles />
          </RoleProtectedRoute>
        } />

        <Route path="/halls/:id" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <DetailSalle />
          </RoleProtectedRoute>
        } />

        {/* Halls — new: SUPER_ADMIN + GERANT only */}
        <Route path="/halls/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireSalle />
          </RoleProtectedRoute>
        } />

        {/* Halls — edit: SUPER_ADMIN + GERANT only */}
        <Route path="/halls/:id/edit" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireSalle />
          </RoleProtectedRoute>
        } />

        <Route path="/hall-bookings" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <ListeReservationsSalles />
          </RoleProtectedRoute>
        } />

        <Route path="/hall-bookings/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireReservationSalle />
          </RoleProtectedRoute>
        } />

        <Route path="/hall-bookings/:id/edit" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireReservationSalle />
          </RoleProtectedRoute>
        } />

        {/* Reservations — list: all roles */}
        <Route path="/reservations" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <ListeReservations />
          </RoleProtectedRoute>
        } />

        {/* Reservations — new: SUPER_ADMIN + GERANT only */}
        <Route path="/reservations/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireReservation />
          </RoleProtectedRoute>
        } />

        {/* Reservations — calendar: all roles */}
        <Route path="/reservations/calendrier" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT', 'RECEPTION']}>
            <CalendrierReservations />
          </RoleProtectedRoute>
        } />

        {/* Stock — list: SUPER_ADMIN + GERANT */}
        <Route path="/stock" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <ListeStock />
          </RoleProtectedRoute>
        } />

        {/* Stock — new: SUPER_ADMIN + GERANT */}
        <Route path="/stock/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireStock />
          </RoleProtectedRoute>
        } />

        {/* Stock — edit: SUPER_ADMIN + GERANT */}
        <Route path="/stock/:id/edit" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireStock />
          </RoleProtectedRoute>
        } />

        {/* Purchase requests — list: SUPER_ADMIN + GERANT */}
        <Route path="/commandes" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <ListeDemandes />
          </RoleProtectedRoute>
        } />

        {/* Purchase requests — new: SUPER_ADMIN + GERANT */}
        <Route path="/commandes/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <NouvelleDemande />
          </RoleProtectedRoute>
        } />

        {/* Employees — list: SUPER_ADMIN + GERANT */}
        <Route path="/employees" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <ListeEmployes />
          </RoleProtectedRoute>
        } />

        {/* Employees — new: SUPER_ADMIN + GERANT */}
        <Route path="/employees/new" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireEmploye />
          </RoleProtectedRoute>
        } />

        {/* Employees — edit: SUPER_ADMIN + GERANT */}
        <Route path="/employees/:id/edit" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <FormulaireEmploye />
          </RoleProtectedRoute>
        } />

        {/* Immeubles */}
        <Route path="/immeubles" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <ImmeublesPage />
          </RoleProtectedRoute>
        } />

        {/* Appartements */}
        <Route path="/appartements" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <AppartementsPage />
          </RoleProtectedRoute>
        } />

        {/* Locataires */}
        <Route path="/locataires" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <LocatairesPage />
          </RoleProtectedRoute>
        } />

        {/* Contrats / Loyers */}
        <Route path="/loyers" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <ContratsPage />
          </RoleProtectedRoute>
        } />

        {/* Paiements loyers */}
        <Route path="/paiements" element={
          <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT']}>
            <LoyersPage />
          </RoleProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
