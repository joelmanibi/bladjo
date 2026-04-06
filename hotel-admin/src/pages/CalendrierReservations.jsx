import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  CONFIRMED: { label: 'Confirmée',  color: '#166534', bg: '#dcfce7', dot: '#22c55e' },
  CANCELLED: { label: 'Annulée',    color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
  COMPLETED: { label: 'Terminée',   color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
};

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Monday-first offset (JS Sunday=0 → index 6, Monday=1 → index 0) */
const mondayOffset = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7;

/** True if the booking is active on the given date (checkIn ≤ date < checkOut) */
const isActiveOn = (booking, year, month, day) => {
  const d  = new Date(year, month, day);
  const ci = new Date(booking.checkInDate);
  const co = new Date(booking.checkOutDate);
  ci.setHours(0, 0, 0, 0);
  co.setHours(0, 0, 0, 0);
  return ci <= d && d < co;
};

export default function CalendrierReservations() {
  const navigate      = useNavigate();
  const { role }      = getAuth();
  const canEdit       = role !== 'RECEPTION';
  const todayDate     = new Date();

  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [current,     setCurrent]     = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    api.get('/bookings')
      .then((r) => setBookings(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => setCurrent(({ year, month }) =>
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
  );
  const nextMonth = () => setCurrent(({ year, month }) =>
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
  );

  // Build calendar cells (null = empty slot, number = day)
  const { year, month } = current;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = mondayOffset(year, month);
  const cells       = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const bookingsForDay = (day) =>
    day ? bookings.filter((b) => isActiveOn(b, year, month, day)) : [];

  const selectedBookings = bookingsForDay(selectedDay);

  return (
    <AdminLayout title="Calendrier réservations">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Calendrier des réservations</h3>
          <p style={styles.subtitle}>Vue mensuelle — occupation des chambres</p>
        </div>
        <div style={styles.headerActions}>
          {canEdit && (
            <button onClick={() => navigate('/reservations/new')} style={styles.addBtn}>
              + Nouvelle réservation
            </button>
          )}
          <button onClick={() => navigate('/reservations')} style={styles.listBtn}>
            ☰ Liste
          </button>
        </div>
      </div>

      {loading && <p style={styles.info}>Chargement...</p>}
      {error   && <p style={styles.errorMsg}>{error}</p>}

      {!loading && !error && (
        <div style={styles.calendarWrap}>
          {/* Month navigation */}
          <div style={styles.monthNav}>
            <button onClick={prevMonth} style={styles.navBtn}>‹</button>
            <h4 style={styles.monthTitle}>{MONTHS_FR[month]} {year}</h4>
            <button onClick={nextMonth} style={styles.navBtn}>›</button>
          </div>

          <div style={styles.layout}>
            {/* ── Grid ── */}
            <div style={styles.gridWrap}>
              {/* Day-of-week headers */}
              {WEEK_DAYS.map((d) => (
                <div key={d} style={styles.dayHeader}>{d}</div>
              ))}

              {/* Day cells */}
              {cells.map((day, idx) => {
                const dayBookings = bookingsForDay(day);
                const isToday =
                  day &&
                  todayDate.getDate()  === day &&
                  todayDate.getMonth() === month &&
                  todayDate.getFullYear() === year;
                const isSelected = day === selectedDay;

                return (
                  <div key={idx}
                    onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    style={{
                      ...styles.dayCell,
                      ...(day     ? {} : styles.emptyCell),
                      ...(isToday ? styles.todayCell : {}),
                      ...(isSelected ? styles.selectedCell : {}),
                      cursor: day ? 'pointer' : 'default',
                    }}
                  >
                    {day && (
                      <>
                        <span style={{ ...styles.dayNumber, ...(isToday ? styles.todayNumber : {}) }}>
                          {day}
                        </span>
                        <div style={styles.chipList}>
                          {dayBookings.slice(0, 2).map((b) => {
                            const s = STATUS_CONFIG[b.status] || {};
                            return (
                              <div key={b.id} style={{ ...styles.chip, background: s.bg, color: s.color }}>
                                {b.room?.roomNumber} · {b.customerName.split(' ')[0]}
                              </div>
                            );
                          })}
                          {dayBookings.length > 2 && (
                            <div style={styles.moreChip}>+{dayBookings.length - 2}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Side panel ── */}
            <div style={styles.sidePanel}>
              {/* Legend */}
              <div style={styles.legendBox}>
                <p style={styles.legendTitle}>Légende</p>
                {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                  <div key={k} style={styles.legendRow}>
                    <span style={{ ...styles.legendDot, background: cfg.dot }} />
                    <span style={{ fontSize: '12px', color: '#475569' }}>{cfg.label}</span>
                  </div>
                ))}
              </div>

              {/* Selected day detail */}
              {selectedDay ? (
                <div style={styles.detailBox}>
                  <p style={styles.legendTitle}>
                    {selectedDay} {MONTHS_FR[month]} {year}
                  </p>
                  {selectedBookings.length === 0 ? (
                    <p style={styles.noBookings}>Aucune réservation ce jour.</p>
                  ) : (
                    selectedBookings.map((b) => {
                      const s = STATUS_CONFIG[b.status] || {};
                      return (
                        <div key={b.id} style={styles.detailCard}>
                          <div style={styles.detailCardHeader}>
                            <strong style={{ fontSize: '13px' }}>Chambre {b.room?.roomNumber}</strong>
                            <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </div>
                          <p style={styles.detailLine}>👤 {b.customerName}</p>
                          <p style={styles.detailLine}>📞 {b.phone}</p>
                          <p style={styles.detailLine}>📅 {b.checkInDate} → {b.checkOutDate}</p>
                          <p style={styles.detailLine}>💰 {Number(b.totalAmount).toFixed(2)} FCFA</p>
                          {Number(b.advanceAmount) > 0 && (
                            <p style={styles.detailLine}>Avance : {Number(b.advanceAmount).toFixed(2)} FCFA</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={styles.detailBox}>
                  <p style={{ ...styles.noBookings, marginTop: 0 }}>
                    Cliquez sur un jour pour voir les réservations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle:    { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:     { fontSize: '14px', color: '#64748b', margin: 0 },
  headerActions:{ display: 'flex', gap: '10px' },
  addBtn: {
    padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  listBtn: {
    padding: '10px 16px', background: '#f8fafc', color: '#475569',
    border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  },
  info:     { textAlign: 'center', color: '#64748b', padding: '60px 0', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', fontSize: '14px' },
  calendarWrap: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  monthNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '24px', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
  },
  navBtn: {
    width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px',
    background: '#fff', fontSize: '18px', cursor: 'pointer', color: '#374151',
  },
  monthTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0, minWidth: '160px', textAlign: 'center' },
  layout:     { display: 'grid', gridTemplateColumns: '1fr 220px' },
  gridWrap:   { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderRight: '1px solid #e2e8f0' },
  dayHeader: {
    padding: '10px 4px', textAlign: 'center', fontSize: '11px', fontWeight: '700',
    color: '#94a3b8', textTransform: 'uppercase', background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  dayCell: {
    minHeight: '90px', padding: '6px', borderRight: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9', verticalAlign: 'top',
  },
  emptyCell:    { background: '#fafafa' },
  todayCell:    { background: '#eff6ff' },
  selectedCell: { background: '#e0f2fe', outline: '2px solid #0ea5e9', outlineOffset: '-2px' },
  dayNumber:    { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' },
  todayNumber:  { color: '#2563eb' },
  chipList:     { display: 'flex', flexDirection: 'column', gap: '2px' },
  chip: {
    fontSize: '10px', fontWeight: '600', padding: '2px 5px',
    borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  moreChip:    { fontSize: '10px', color: '#94a3b8', fontWeight: '600', padding: '1px 4px' },
  sidePanel:   { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' },
  legendBox:   { background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' },
  legendTitle: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', margin: '0 0 10px' },
  legendRow:   { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  legendDot:   { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  detailBox:   { background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0', flex: 1 },
  detailCard:  { background: '#fff', borderRadius: '8px', padding: '10px', marginBottom: '8px', border: '1px solid #e2e8f0' },
  detailCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  badge:       { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' },
  detailLine:  { fontSize: '11px', color: '#475569', margin: '3px 0' },
  noBookings:  { fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '20px 0' },
};
