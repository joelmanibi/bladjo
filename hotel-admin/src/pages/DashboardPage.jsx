import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth, isSupervisorOnlyUser } from '../utils/auth';
import { ADMIN_INTERFACES, getInterfaceMeta, useAdminInterface } from '../utils/adminInterface';
import { useResponsive } from '../utils/useResponsive';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const getMonthStart = (month) => `${month}-01`;
const getMonthEnd = (month) => {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex, 0).toISOString().slice(0, 10);
};
const fmtMoney = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const fmtCount = (value) => Number(value || 0).toLocaleString('fr-FR');
const fmtPercent = (value) => `${Number(value || 0).toLocaleString('fr-FR')}%`;
const toNumber = (value) => Number.parseFloat(value ?? 0) || 0;
const fmtDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function buildParams(filters) {
  return filters.mode === 'custom'
    ? { startDate: filters.startDate, endDate: filters.endDate }
    : { month: filters.month };
}

function getOccupancyColor(rate) {
  if (rate > 70) return '#dc2626';
  if (rate > 40) return '#f59e0b';
  return '#16a34a';
}

function getProfitTone(value) {
  return value >= 0
    ? { bg: '#dcfce7', color: '#166534', label: 'Rentabilité positive' }
    : { bg: '#fee2e2', color: '#b91c1c', label: 'Résultat à surveiller' };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userName, role, backendRole } = getAuth();
  const { currentInterface } = useAdminInterface();
  const isOwner = isSupervisorOnlyUser(backendRole);
  const allowNavigation = !isOwner;
  const isHotelInterface = currentInterface === ADMIN_INTERFACES.HOTEL;
  const isRentalInterface = currentInterface === ADMIN_INTERFACES.RENTAL;
  const interfaceMeta = getInterfaceMeta(currentInterface);
  const { isMobile, isCompact } = useResponsive();
  const currentMonth = useMemo(() => getCurrentMonth(), []);

  const [draftFilters, setDraftFilters] = useState({
    mode: 'month',
    month: currentMonth,
    startDate: getMonthStart(currentMonth),
    endDate: getMonthEnd(currentMonth),
  });
  const [appliedFilters, setAppliedFilters] = useState({
    mode: 'month',
    month: currentMonth,
    startDate: getMonthStart(currentMonth),
    endDate: getMonthEnd(currentMonth),
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const realEstate = data?.realEstate;
  const hotelRevenue = data ? toNumber(data.revenue.room) + toNumber(data.revenue.hall) : 0;
  const hotelExpenses = data ? toNumber(data.expenses.total) : 0;
  const hotelOperatingResult = hotelRevenue - hotelExpenses;
  const apartmentsOccupancyRate = data?.apartments?.total > 0
    ? Math.round((toNumber(data.apartments.occupied) / toNumber(data.apartments.total)) * 100)
    : 0;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api.get('/dashboard', { params: buildParams(appliedFilters) })
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Erreur de chargement du tableau de bord.');
          setData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [appliedFilters]);

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const applyFilters = () => {
    if (draftFilters.mode === 'custom' && (!draftFilters.startDate || !draftFilters.endDate)) {
      setError('Veuillez renseigner une date de début et une date de fin.');
      return;
    }
    setAppliedFilters({ ...draftFilters });
  };

  const resetToCurrentMonth = () => {
    const next = {
      mode: 'month',
      month: currentMonth,
      startDate: getMonthStart(currentMonth),
      endDate: getMonthEnd(currentMonth),
    };
    setDraftFilters(next);
    setAppliedFilters(next);
  };

  const overviewCards = data
    ? (isHotelInterface
        ? [
            { icon: '💰', label: 'Revenus hôtel', value: fmtMoney(hotelRevenue), color: '#15803d', bg: '#f0fdf4' },
            { icon: '💸', label: 'Charges exploitation', value: fmtMoney(hotelExpenses), color: '#b45309', bg: '#fff7ed' },
            { icon: '📈', label: 'Résultat exploitation', value: fmtMoney(hotelOperatingResult), color: hotelOperatingResult >= 0 ? '#2563eb' : '#dc2626', bg: '#eff6ff' },
            { icon: '👷', label: 'Employés', value: fmtCount(data.employees.total), color: '#0891b2', bg: '#ecfeff', onClick: allowNavigation && role !== 'RECEPTION' ? () => navigate('/employees') : undefined },
            { icon: '🛏️', label: 'Chambres occupées', value: fmtCount(data.rooms.occupied), color: '#dc2626', bg: '#fef2f2', onClick: allowNavigation ? () => navigate('/rooms') : undefined },
            { icon: '🎉', label: 'Salles réservées', value: fmtCount(data.halls.booked), color: '#7c3aed', bg: '#f5f3ff', onClick: allowNavigation ? () => navigate('/hall-bookings') : undefined },
            { icon: '📅', label: 'Arrivées période', value: fmtCount(data.bookings.arrivals), color: '#4338ca', bg: '#eef2ff', onClick: allowNavigation ? () => navigate('/reservations') : undefined },
            { icon: '⚠️', label: 'Stock faible', value: fmtCount(data.lowStockItems.count), color: '#d97706', bg: '#fffbeb', onClick: allowNavigation && role !== 'RECEPTION' ? () => navigate('/stock') : undefined },
          ]
        : [
            { icon: '🏘️', label: 'Loyers dus', value: fmtMoney(realEstate?.rentStatus.expected), color: '#0f172a', bg: '#f8fafc' },
            { icon: '💸', label: 'Loyers encaissés', value: fmtMoney(realEstate?.rentStatus.collected), color: '#15803d', bg: '#f0fdf4' },
            { icon: '🧾', label: 'Loyers impayés', value: fmtMoney(realEstate?.rentStatus.outstanding), color: '#b91c1c', bg: '#fef2f2' },
            { icon: '📊', label: 'Taux recouvrement', value: fmtPercent(realEstate?.rentStatus.collectionRate), color: '#2563eb', bg: '#eff6ff' },
            { icon: '🏢', label: 'Appartements occupés', value: fmtCount(data.apartments.occupied), color: '#0f766e', bg: '#ecfeff', onClick: allowNavigation && role !== 'RECEPTION' ? () => navigate('/appartements') : undefined },
            { icon: '📑', label: 'Baux actifs', value: fmtCount(realEstate?.rentStatus.activeLeases), color: '#7c3aed', bg: '#f5f3ff', onClick: allowNavigation && role !== 'RECEPTION' ? () => navigate('/loyers') : undefined },
            { icon: '🏚️', label: 'Appartements en dette', value: fmtCount(realEstate?.rentStatus.apartmentsInDebt), color: '#dc2626', bg: '#fff1f2', onClick: allowNavigation && role !== 'RECEPTION' ? () => navigate('/appartements') : undefined },
            { icon: '⏳', label: 'Mois impayés', value: fmtCount(realEstate?.rentStatus.unpaidMonths), color: '#b45309', bg: '#fff7ed', onClick: allowNavigation && role !== 'RECEPTION' ? () => navigate('/paiements') : undefined },
          ])
    : [];

  const quickActions = (isHotelInterface
    ? [
        { label: 'Réservations chambres', hint: 'Suivre les arrivées et statuts', path: '/reservations' },
        { label: 'Réservations salles', hint: 'Contrôler les événements', path: '/hall-bookings' },
        { label: 'Stock', hint: 'Surveiller les articles critiques', path: '/stock', disabled: role === 'RECEPTION' },
        { label: 'Employés', hint: 'Suivre l’effectif et la paie', path: '/employees', disabled: role === 'RECEPTION' },
      ]
    : [
        { label: 'Immeubles', hint: 'Piloter le parc immobilier', path: '/immeubles', disabled: role === 'RECEPTION' },
        { label: 'Appartements', hint: 'Suivre occupation et loyers', path: '/appartements', disabled: role === 'RECEPTION' },
        { label: 'Locataires', hint: 'Consulter les occupants', path: '/locataires', disabled: role === 'RECEPTION' },
        { label: 'Paiements loyers', hint: 'Suivre les encaissements', path: '/paiements', disabled: role === 'RECEPTION' },
      ]).filter((item) => !item.disabled && allowNavigation);

  const executiveStats = data
    ? (isHotelInterface
        ? [
            { label: 'Taux chambres', value: fmtPercent(data.rooms.occupancyRate), tone: getOccupancyColor(data.rooms.occupancyRate), sub: `${fmtCount(data.rooms.occupied)} / ${fmtCount(data.rooms.total)}` },
            { label: 'Taux salles', value: fmtPercent(data.halls.occupancyRate), tone: getOccupancyColor(data.halls.occupancyRate), sub: `${fmtCount(data.halls.booked)} / ${fmtCount(data.halls.total)}` },
            { label: 'Réservations actives', value: fmtCount((data.bookings.pending + data.bookings.confirmed) + (data.hallBookings.pending + data.hallBookings.confirmed)), tone: '#2563eb', sub: 'chambres + salles' },
            { label: 'Mise à jour', value: fmtDateTime(data.generatedAt), tone: '#0f172a', sub: 'dernière génération' },
          ]
        : [
            { label: 'Taux occupation appartements', value: fmtPercent(apartmentsOccupancyRate), tone: getOccupancyColor(apartmentsOccupancyRate), sub: `${fmtCount(data.apartments.occupied)} / ${fmtCount(data.apartments.total)}` },
            { label: 'Recouvrement loyers', value: fmtPercent(realEstate?.rentStatus.collectionRate), tone: toNumber(realEstate?.rentStatus.collectionRate) >= 80 ? '#16a34a' : '#dc2626', sub: `${fmtMoney(realEstate?.rentStatus.collected)} / ${fmtMoney(realEstate?.rentStatus.expected)}` },
            { label: 'Mois à couvrir', value: fmtCount(realEstate?.rentStatus.totalDueMonths), tone: '#1d4ed8', sub: `${fmtCount(realEstate?.rentStatus.paidMonths)} réglé(s)` },
            { label: 'Mise à jour', value: fmtDateTime(data.generatedAt), tone: '#0f172a', sub: 'dernière génération' },
          ])
    : [];

  const profitTone = data ? getProfitTone(data.summary.netProfit) : null;
  const dashboardTitle = isOwner
    ? `Dashboard superviseur — ${isHotelInterface ? 'Hôtel' : 'Immobilier locatif'}`
    : (isHotelInterface ? 'Dashboard hôtel' : 'Dashboard immobilier locatif');

  return (
    <AdminLayout title={dashboardTitle}>
      <div style={{ ...s.page, ...(isMobile ? s.pageMobile : {}) }}>
        <section style={{ ...s.welcome, ...(isCompact ? s.welcomeCompact : {}), ...(isMobile ? s.welcomeMobile : {}), background: interfaceMeta.heroGradient }}>
          <div style={s.heroMain}>
            <div style={s.rolePill}>
              {isOwner
                ? `Vue propriétaire / superviseur · ${isHotelInterface ? 'Hôtel' : 'Immobilier'}`
                : (isHotelInterface ? 'Vue opérationnelle hôtel' : 'Vue opérationnelle immobilier')}
            </div>
            <h2 style={{ ...s.welcomeTitle, ...(isMobile ? s.welcomeTitleMobile : {}) }}>Bonjour, {userName || 'Utilisateur'} 👋</h2>
            <p style={s.welcomeDate}>{dateLabel}</p>
            {data?.period && <p style={s.periodText}>Période analysée : <strong>{data.period.label}</strong></p>}
            <div style={s.heroContextLine}>
              <span style={{ ...s.heroContextBadge, background: interfaceMeta.accentSoft, color: interfaceMeta.accentText }}>
                {interfaceMeta.icon} {interfaceMeta.label}
              </span>
              <span style={s.heroContextText}>
                {isHotelInterface ? 'Réservations, occupation et exploitation' : 'Loyers, recouvrement et actifs locatifs'}
              </span>
            </div>
            {profitTone && isHotelInterface && (
              <span style={{ ...s.heroBadge, background: profitTone.bg, color: profitTone.color }}>
                {profitTone.label}
              </span>
            )}
          </div>

          <div style={{ ...s.progressWrap, ...(isMobile ? s.progressWrapMobile : {}) }}>
            {isHotelInterface ? (
              <>
                <ProgressCard label="Occupation chambres" value={data?.rooms?.occupancyRate || 0} />
                <ProgressCard label="Occupation salles" value={data?.halls?.occupancyRate || 0} compact />
              </>
            ) : (
              <>
                <ProgressCard label="Occupation appartements" value={apartmentsOccupancyRate} />
                <ProgressCard label="Recouvrement loyers" value={realEstate?.rentStatus?.collectionRate || 0} compact />
              </>
            )}
          </div>
        </section>

        {data && (
          <section style={{ ...s.executiveCard, ...(isMobile ? s.cardMobile : {}) }}>
            <div style={s.executiveTop}>
              <div>
                <h3 style={s.sectionTitle}>{isHotelInterface ? 'Synthèse exécutive hôtel' : 'Synthèse exécutive immobilier'}</h3>
                <p style={s.sectionText}>
                  {isHotelInterface
                    ? 'Vue rapide de la santé opérationnelle et financière de l’hôtel.'
                    : 'Vue rapide du parc locatif, des loyers et du niveau de recouvrement.'}
                </p>
              </div>
              <div style={s.periodPillWrap}>
                <span style={{ ...s.periodPill, background: interfaceMeta.accentSoft, color: interfaceMeta.accentText }}>
                  {appliedFilters.mode === 'month' ? 'Filtre mensuel' : 'Période personnalisée'}
                </span>
                {data.period?.days && <span style={s.periodPillMuted}>{fmtCount(data.period.days)} jour(s)</span>}
              </div>
            </div>

            <div style={s.executiveGrid}>
              {executiveStats.map((item) => (
                <div key={item.label} style={s.executiveItem}>
                  <span style={s.executiveLabel}>{item.label}</span>
                  <strong style={{ ...s.executiveValue, color: item.tone }}>{item.value}</strong>
                  <span style={s.executiveSub}>{item.sub}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ ...s.filtersCard, ...(isMobile ? s.cardMobile : {}) }}>
          <div style={s.filtersTop}>
            <div>
              <h3 style={s.sectionTitle}>Filtres de supervision</h3>
              <p style={s.sectionText}>
                {isHotelInterface
                  ? 'Analyse les activités de l’hôtel sur un mois précis ou sur une période personnalisée.'
                  : 'Analyse les loyers, baux et performances du parc locatif sur un mois précis ou sur une période personnalisée.'}
              </p>
            </div>
            <div style={s.modeSwitch}>
              <button type="button" style={{ ...s.modeBtn, ...(draftFilters.mode === 'month' ? s.modeBtnActive : {}) }} onClick={() => setDraftFilters((prev) => ({ ...prev, mode: 'month' }))}>Par mois</button>
              <button type="button" style={{ ...s.modeBtn, ...(draftFilters.mode === 'custom' ? s.modeBtnActive : {}) }} onClick={() => setDraftFilters((prev) => ({ ...prev, mode: 'custom' }))}>Période</button>
            </div>
          </div>

          <div style={s.filtersRow}>
            {draftFilters.mode === 'month' ? (
              <label style={s.field}>
                <span style={s.label}>Mois</span>
                <input type="month" value={draftFilters.month} onChange={(e) => setDraftFilters((prev) => ({ ...prev, month: e.target.value }))} style={s.input} />
              </label>
            ) : (
              <>
                <label style={s.field}>
                  <span style={s.label}>Date début</span>
                  <input type="date" value={draftFilters.startDate} onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))} style={s.input} />
                </label>
                <label style={s.field}>
                  <span style={s.label}>Date fin</span>
                  <input type="date" value={draftFilters.endDate} onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))} style={s.input} />
                </label>
              </>
            )}

            <div style={s.actions}>
              <button type="button" style={s.primaryBtn} onClick={applyFilters}>Appliquer</button>
              <button type="button" style={s.secondaryBtn} onClick={resetToCurrentMonth}>Mois en cours</button>
            </div>
          </div>
        </section>

        {loading && <p style={s.info}>Chargement des statistiques…</p>}
        {error && <p style={s.err}>{error}</p>}

        {data && (
          <>
            {quickActions.length > 0 && (
              <section style={{ ...s.quickActionsCard, ...(isMobile ? s.cardMobile : {}) }}>
                <div style={s.quickActionsHead}>
                  <div>
                    <h3 style={s.sectionTitle}>{isHotelInterface ? 'Actions rapides hôtel' : 'Actions rapides immobilier'}</h3>
                    <p style={s.sectionText}>
                      {isHotelInterface
                        ? 'Accès direct aux écrans clés de supervision hôtelière.'
                        : 'Accès direct aux écrans clés de gestion immobilière.'}
                    </p>
                  </div>
                </div>
                <div style={{ ...s.quickActionsGrid, ...(isMobile ? s.quickActionsGridMobile : {}) }}>
                  {quickActions.map((action) => (
                    <button key={action.path} type="button" style={s.quickActionBtn} onClick={() => navigate(action.path)}>
                      <span style={s.quickActionLabel}>{action.label}</span>
                      <span style={s.quickActionHint}>{action.hint}</span>
                      <span style={{ ...s.quickActionArrow, color: interfaceMeta.accent }}>→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section style={{ ...s.gridCards, ...(isMobile ? s.gridCardsMobile : {}) }}>
              {overviewCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </section>

            {isHotelInterface && (
              <>
                <section style={{ ...s.grid3, ...(isMobile ? s.gridMobile : {}) }}>
                  <Panel title="Répartition des revenus hôtel" subtitle="Sources hôtelières de revenus sur la période">
                    <MiniStat label="Chambres" value={fmtMoney(data.revenue.room)} color="#15803d" />
                    <MiniStat label="Salles" value={fmtMoney(data.revenue.hall)} color="#7c3aed" />
                    <MiniStat label="Total hôtel" value={fmtMoney(hotelRevenue)} color="#2563eb" />
                    <MiniStat label="Encaissement du jour" value={fmtMoney(data.revenue.today)} color="#b45309" />
                  </Panel>

                  <Panel title="Répartition des dépenses" subtitle="Charges d’exploitation enregistrées sur la période">
                    <MiniStat label="Salaires" value={fmtMoney(data.expenses.salaries)} color="#dc2626" />
                    <MiniStat label="Stock / achats" value={fmtMoney(data.expenses.stock)} color="#d97706" />
                    <MiniStat label="Autres dépenses" value={fmtMoney(data.expenses.other)} color="#475569" />
                    <MiniStat label="Total dépenses" value={fmtMoney(data.expenses.total)} color="#0f172a" />
                  </Panel>

                  <Panel title="Activité de réservation" subtitle="Vue synthétique des opérations hôtelières">
                    <MiniStat label="Réservations chambres" value={fmtCount(data.bookings.total)} color="#2563eb" />
                    <MiniStat label="Réservations salles" value={fmtCount(data.hallBookings.total)} color="#7c3aed" />
                    <MiniStat label="Chambres disponibles" value={fmtCount(data.rooms.available)} color="#16a34a" />
                    <MiniStat label="Salles disponibles" value={fmtCount(data.halls.available)} color="#16a34a" />
                  </Panel>
                </section>

                <section style={{ ...s.grid2, ...(isMobile ? s.gridMobile : {}) }}>
                  <Panel title="Statut des réservations chambres" subtitle="Répartition de la période">
                    <StatusRow label="En attente" value={data.bookings.pending} bg="#fef3c7" color="#92400e" />
                    <StatusRow label="Confirmées" value={data.bookings.confirmed} bg="#dcfce7" color="#166534" />
                    <StatusRow label="Terminées" value={data.bookings.completed} bg="#dbeafe" color="#1d4ed8" />
                    <StatusRow label="Annulées" value={data.bookings.cancelled} bg="#fee2e2" color="#b91c1c" />
                  </Panel>

                  <Panel title="Statut des réservations salles" subtitle="Répartition de la période">
                    <StatusRow label="En attente" value={data.hallBookings.pending} bg="#fef3c7" color="#92400e" />
                    <StatusRow label="Confirmées" value={data.hallBookings.confirmed} bg="#ede9fe" color="#6d28d9" />
                    <StatusRow label="Annulées" value={data.hallBookings.cancelled} bg="#fee2e2" color="#b91c1c" />
                  </Panel>
                </section>

                <section style={{ ...s.panel, ...(isMobile ? s.cardMobile : {}) }}>
                  <div style={s.panelHead}>
                    <div>
                      <h3 style={s.sectionTitle}>Articles en stock faible</h3>
                      <p style={s.sectionText}>Seuil actuel : {data.lowStockItems.threshold} unités.</p>
                    </div>
                    <span style={s.countBadge}>{fmtCount(data.lowStockItems.count)}</span>
                  </div>

                  {data.lowStockItems.count === 0 ? (
                    <p style={s.info}>✅ Aucun article critique sur la période.</p>
                  ) : (
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Article</th>
                          <th style={s.th}>Catégorie</th>
                          <th style={s.th}>Quantité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lowStockItems.items.map((item) => (
                          <tr key={item.id}>
                            <td style={s.td}><strong>{item.name}</strong></td>
                            <td style={s.td}>{item.category || '—'}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: item.quantity <= 3 ? '#dc2626' : '#d97706' }}>{fmtCount(item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}

            {isRentalInterface && realEstate && (
              <>
                <section style={{ ...s.grid2, ...(isMobile ? s.gridMobile : {}) }}>
                  <Panel title="Suivi des loyers" subtitle="Vue dédiée aux loyers dus, encaissés et impayés du parc locatif">
                    <MiniStat label="Loyers dus" value={fmtMoney(realEstate.rentStatus.expected)} color="#0f172a" />
                    <MiniStat label="Loyers encaissés" value={fmtMoney(realEstate.rentStatus.collected)} color="#15803d" />
                    <MiniStat label="Loyers impayés" value={fmtMoney(realEstate.rentStatus.outstanding)} color="#dc2626" />
                    <MiniStat label="Taux de recouvrement" value={fmtPercent(realEstate.rentStatus.collectionRate)} color="#2563eb" />
                  </Panel>

                  <Panel title="Statut des paiements locatifs" subtitle="Suivi des mois de loyers couverts sur la période">
                    <StatusRow label="Mois payés" value={realEstate.rentStatus.paidMonths} bg="#dcfce7" color="#166534" />
                    <StatusRow label="Paiements partiels" value={realEstate.rentStatus.partialMonths} bg="#fef3c7" color="#92400e" />
                    <StatusRow label="Mois impayés" value={realEstate.rentStatus.unpaidMonths} bg="#fee2e2" color="#b91c1c" />
                    <StatusRow label="Appartements en dette" value={realEstate.rentStatus.apartmentsInDebt} bg="#ede9fe" color="#6d28d9" />
                  </Panel>
                </section>

                {!realEstate.expenseTrackingAvailable && realEstate.expenseTrackingNote && (
                  <p style={s.notice}>{realEstate.expenseTrackingNote}</p>
                )}

                <section style={{ ...s.grid2, ...(isMobile ? s.gridMobile : {}) }}>
                  <section style={s.panel}>
                    <div style={s.panelHeadColumn}>
                      <h3 style={s.sectionTitle}>Performance loyers par appartement</h3>
                      <p style={s.sectionText}>Classement brut des appartements selon les loyers encaissés sur la période.</p>
                    </div>

                    {realEstate.topApartments?.length ? (
                      <table style={s.table}>
                        <thead>
                          <tr>
                            <th style={s.th}>Appartement</th>
                            <th style={s.th}>Immeuble</th>
                            <th style={s.th}>Locataire</th>
                            <th style={s.th}>Dû</th>
                            <th style={s.th}>Encaissé</th>
                            <th style={s.th}>Impayé</th>
                            <th style={s.th}>Taux</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realEstate.topApartments.map((item) => (
                            <tr key={item.apartmentId}>
                              <td style={s.td}><strong>{item.apartmentCode}</strong></td>
                              <td style={s.td}>{item.buildingName}</td>
                              <td style={s.td}>{item.tenantName || '—'}</td>
                              <td style={s.td}>{fmtMoney(item.expectedRent)}</td>
                              <td style={{ ...s.td, color: '#15803d', fontWeight: 700 }}>{fmtMoney(item.collectedRent)}</td>
                              <td style={{ ...s.td, color: item.outstandingRent > 0 ? '#dc2626' : '#166534', fontWeight: 700 }}>{fmtMoney(item.outstandingRent)}</td>
                              <td style={s.td}>{fmtPercent(item.collectionRate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={s.info}>Aucune donnée locative à afficher sur la période.</p>
                    )}
                  </section>

                  <section style={s.panel}>
                    <div style={s.panelHeadColumn}>
                      <h3 style={s.sectionTitle}>Performance loyers par immeuble</h3>
                      <p style={s.sectionText}>Vue consolidée par immeuble pour repérer les actifs les plus performants.</p>
                    </div>

                    {realEstate.topBuildings?.length ? (
                      <table style={s.table}>
                        <thead>
                          <tr>
                            <th style={s.th}>Immeuble</th>
                            <th style={s.th}>Appartements</th>
                            <th style={s.th}>Dû</th>
                            <th style={s.th}>Encaissé</th>
                            <th style={s.th}>Impayé</th>
                            <th style={s.th}>Taux</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realEstate.topBuildings.map((item, index) => (
                            <tr key={item.buildingId ?? `no-building-${index}`}>
                              <td style={s.td}><strong>{item.buildingName}</strong></td>
                              <td style={s.td}>{fmtCount(item.apartmentsCount)}</td>
                              <td style={s.td}>{fmtMoney(item.expectedRent)}</td>
                              <td style={{ ...s.td, color: '#15803d', fontWeight: 700 }}>{fmtMoney(item.collectedRent)}</td>
                              <td style={{ ...s.td, color: item.outstandingRent > 0 ? '#dc2626' : '#166534', fontWeight: 700 }}>{fmtMoney(item.outstandingRent)}</td>
                              <td style={s.td}>{fmtPercent(item.collectionRate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={s.info}>Aucun immeuble locatif à afficher sur la période.</p>
                    )}
                  </section>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, color, bg, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...s.statCard, background: bg, cursor: onClick ? 'pointer' : 'default', transform: hovered && onClick ? 'translateY(-3px)' : 'none', boxShadow: hovered && onClick ? '0 18px 36px rgba(15,23,42,0.10)' : s.statCard.boxShadow, opacity: onClick ? 1 : 0.98 }}
    >
      <span style={s.statIcon}>{icon}</span>
      <div>
        <p style={s.statLabel}>{label}</p>
        <p style={{ ...s.statValue, color }}>{value}</p>
      </div>
    </button>
  );
}

function ProgressCard({ label, value, compact = false }) {
  const color = getOccupancyColor(value);
  return (
    <div style={{ ...s.progressCard, minWidth: compact ? 180 : 220 }}>
      <span style={s.progressLabel}>{label}</span>
      <strong style={s.progressValue}>{value}%</strong>
      <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${value}%`, background: color }} /></div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section style={s.panel}>
      <div style={s.panelHeadColumn}>
        <h3 style={s.sectionTitle}>{title}</h3>
        <p style={s.sectionText}>{subtitle}</p>
      </div>
      <div style={s.stack12}>{children}</div>
    </section>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={s.miniRow}>
      <span style={s.miniLabel}>{label}</span>
      <strong style={{ ...s.miniValue, color }}>{value}</strong>
    </div>
  );
}

function StatusRow({ label, value, bg, color }) {
  return (
    <div style={s.statusRow}>
      <span style={{ ...s.statusChip, background: bg, color }}>{label}</span>
      <strong style={s.statusValue}>{fmtCount(value)}</strong>
    </div>
  );
}

const s = {
  page: { display: 'flex', flexDirection: 'column', gap: '20px' },
  pageMobile: { gap: '16px' },
  welcome: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', borderRadius: '18px', padding: '28px 32px', color: '#fff', background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)' },
  welcomeCompact: { padding: '24px' },
  welcomeMobile: { padding: '20px 18px', borderRadius: '16px' },
  heroMain: { display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '680px' },
  rolePill: { display: 'inline-flex', padding: '6px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.14)', fontSize: '12px', fontWeight: 700, marginBottom: '12px' },
  heroContextLine: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '6px' },
  heroContextBadge: { display: 'inline-flex', padding: '7px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 },
  heroContextText: { fontSize: '13px', color: 'rgba(255,255,255,0.86)', fontWeight: 600 },
  heroBadge: { display: 'inline-flex', alignSelf: 'flex-start', marginTop: '12px', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 },
  welcomeTitle: { margin: '0 0 4px', fontSize: '28px', fontWeight: 800 },
  welcomeTitleMobile: { fontSize: '24px', lineHeight: 1.2 },
  welcomeDate: { margin: '0 0 6px', opacity: 0.88, textTransform: 'capitalize' },
  periodText: { margin: 0, opacity: 0.92, fontSize: '14px' },
  progressWrap: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  progressWrapMobile: { width: '100%' },
  progressCard: { background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' },
  progressLabel: { display: 'block', fontSize: '12px', opacity: 0.85, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' },
  progressValue: { display: 'block', fontSize: '28px', marginBottom: '10px' },
  progressBar: { width: '100%', height: '8px', background: 'rgba(255,255,255,0.22)', borderRadius: '999px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '999px' },
  executiveCard: { background: '#fff', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 6px 18px rgba(15,23,42,0.06)' },
  cardMobile: { padding: '18px 16px', borderRadius: '14px' },
  executiveTop: { display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' },
  periodPillWrap: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  periodPill: { display: 'inline-flex', padding: '8px 12px', borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: 800 },
  periodPillMuted: { display: 'inline-flex', padding: '8px 12px', borderRadius: '999px', background: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: 700 },
  executiveGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' },
  executiveItem: { border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 8px 24px rgba(15,23,42,0.04)' },
  executiveLabel: { display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 700 },
  executiveValue: { display: 'block', fontSize: '22px', fontWeight: 800, lineHeight: 1.2 },
  executiveSub: { display: 'block', marginTop: '8px', fontSize: '13px', color: '#64748b' },
  filtersCard: { background: '#fff', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' },
  filtersTop: { display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' },
  modeSwitch: { display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '999px', gap: '4px' },
  modeBtn: { border: 'none', background: 'transparent', padding: '9px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer' },
  modeBtnActive: { background: '#fff', color: '#1d4ed8', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  filtersRow: { display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'end' },
  field: { display: 'flex', flexDirection: 'column', gap: '7px', minWidth: '200px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  input: { height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #dbe1ea', fontSize: '14px', outline: 'none' },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  primaryBtn: { height: '42px', padding: '0 16px', border: 'none', borderRadius: '10px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { height: '42px', padding: '0 16px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#fff', color: '#0f172a', fontWeight: 700, cursor: 'pointer' },
  quickActionsCard: { background: '#fff', borderRadius: '16px', padding: '22px 24px', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' },
  quickActionsHead: { marginBottom: '14px' },
  quickActionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  quickActionsGridMobile: { gridTemplateColumns: '1fr' },
  quickActionBtn: { border: '1px solid #e2e8f0', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '7px', cursor: 'pointer', textAlign: 'left', boxShadow: '0 10px 24px rgba(15,23,42,0.05)' },
  quickActionLabel: { fontSize: '15px', fontWeight: 800, color: '#0f172a' },
  quickActionHint: { fontSize: '13px', color: '#64748b' },
  quickActionArrow: { marginTop: '6px', fontSize: '18px', color: '#2563eb', fontWeight: 800 },
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' },
  gridCardsMobile: { gridTemplateColumns: '1fr' },
  statCard: { border: '1px solid rgba(226,232,240,0.9)', borderRadius: '18px', padding: '18px 18px', display: 'flex', gap: '14px', alignItems: 'center', textAlign: 'left', boxShadow: '0 10px 24px rgba(15,23,42,0.05)', transition: 'transform 0.16s ease' },
  statIcon: { width: '52px', height: '52px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', lineHeight: 1, background: 'rgba(255,255,255,0.62)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' },
  statLabel: { margin: '0 0 6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' },
  statValue: { margin: 0, fontSize: '24px', fontWeight: 800 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
  gridMobile: { gridTemplateColumns: '1fr' },
  panel: { background: '#fff', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 10px 24px rgba(15,23,42,0.05)', overflowX: 'auto', border: '1px solid rgba(226,232,240,0.8)' },
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  panelHeadColumn: { marginBottom: '14px' },
  sectionTitle: { margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' },
  sectionText: { margin: '6px 0 0', fontSize: '14px', color: '#64748b' },
  countBadge: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '42px', height: '42px', padding: '0 12px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontWeight: 800 },
  stack12: { display: 'flex', flexDirection: 'column', gap: '12px' },
  miniRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', paddingBottom: '10px', borderBottom: '1px solid #eef2f7' },
  miniLabel: { color: '#475569', fontSize: '14px' },
  miniValue: { fontSize: '15px' },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', padding: '10px 0', borderBottom: '1px solid #eef2f7' },
  statusChip: { display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 },
  statusValue: { fontSize: '16px', color: '#0f172a' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 14px', background: '#f8fafc', color: '#475569', fontSize: '13px', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 14px', borderBottom: '1px solid #eef2f7', fontSize: '14px', color: '#1e293b' },
  notice: { margin: 0, padding: '16px 18px', borderRadius: '12px', background: '#fff7ed', color: '#9a3412', fontSize: '14px', border: '1px solid #fed7aa' },
  info: { margin: 0, padding: '18px 20px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', fontSize: '14px' },
  err: { margin: 0, padding: '18px 20px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' },
};