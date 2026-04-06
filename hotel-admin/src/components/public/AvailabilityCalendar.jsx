import { useMemo, useState } from 'react';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const mondayOffset = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7;
const pad = (value) => String(value).padStart(2, '0');
const toKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const toTime = (dateKey) => new Date(`${dateKey}T00:00:00`).getTime();

const rangeOverlaps = (range, startDate, endDate, selectionMode) => {
  if (!range?.startDate || !range?.endDate) return false;
  if (selectionMode === 'room') {
    return range.startDate < endDate && range.endDate > startDate;
  }
  return range.startDate <= endDate && range.endDate >= startDate;
};

export default function AvailabilityCalendar({
  reservedDates = [],
  blockedRanges = [],
  label = 'Jour déjà réservé',
  selectionMode = 'room',
  onRangeSelect,
  reservedAlertMessage = 'Cette date est déjà prise.',
  rangeConflictAlertMessage = 'Cette période chevauche une réservation existante.',
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedRange, setSelectedRange] = useState({ startDate: '', endDate: '' });

  const reservedSet = useMemo(() => new Set(reservedDates), [reservedDates]);

  const { year, month } = current;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = mondayOffset(year, month);
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  const prevMonth = () => setCurrent(({ year: y, month: m }) => (m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }));
  const nextMonth = () => setCurrent(({ year: y, month: m }) => (m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 }));

  const commitRange = (nextRange) => {
    setSelectedRange(nextRange);
    if (onRangeSelect) onRangeSelect(nextRange);
  };

  const isInsideRange = (dateKey) => {
    const { startDate, endDate } = selectedRange;
    if (!startDate || !endDate) return false;
    return toTime(dateKey) >= toTime(startDate) && toTime(dateKey) <= toTime(endDate);
  };

  return (
    <div className="public-calendar-box">
      <div className="public-calendar-header">
        <div>
          <h3>Disponibilités</h3>
          <p>Les jours marqués sont déjà réservés.</p>
        </div>
        <div className="public-calendar-legend">
          <span className="public-calendar-legend-dot reserved" />
          <span>{label}</span>
        </div>
      </div>

      <div className="public-calendar-nav">
        <button type="button" onClick={prevMonth}>‹</button>
        <strong>{MONTHS_FR[month]} {year}</strong>
        <button type="button" onClick={nextMonth}>›</button>
      </div>

      <div className="public-calendar-grid">
        {WEEK_DAYS.map((day) => <div key={day} className="public-calendar-day-name">{day}</div>)}

        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="public-calendar-cell empty" />;

          const dateKey = toKey(year, month, day);
          const isReserved = reservedSet.has(dateKey);
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const isPast = dateKey < todayKey;
          const isRangeStart = selectedRange.startDate === dateKey;
          const isRangeEnd = selectedRange.endDate === dateKey;
          const isInSelectedRange = isInsideRange(dateKey);

          const handleClick = () => {
            if (isPast) return;

            const allowSameDay = selectionMode === 'hall';

            if (!selectedRange.startDate || selectedRange.endDate) {
              if (isReserved) {
                window.alert(reservedAlertMessage);
                return;
              }
              commitRange({ startDate: dateKey, endDate: '' });
              return;
            }

            if (isReserved) {
              window.alert(reservedAlertMessage);
              return;
            }

            if ((!allowSameDay && dateKey <= selectedRange.startDate) || (allowSameDay && dateKey < selectedRange.startDate)) {
              commitRange({ startDate: dateKey, endDate: '' });
              return;
            }

            const conflict = blockedRanges.some((range) => rangeOverlaps(range, selectedRange.startDate, dateKey, selectionMode));
            if (conflict) {
              window.alert(rangeConflictAlertMessage);
              return;
            }

            commitRange({ startDate: selectedRange.startDate, endDate: dateKey });
          };

          return (
            <button
              key={dateKey}
              type="button"
              disabled={isPast}
              className={`public-calendar-cell${isReserved ? ' reserved' : ' available'}${isToday ? ' today' : ''}${isPast ? ' disabled' : ''}${isRangeStart ? ' range-start' : ''}${isRangeEnd ? ' range-end' : ''}${isInSelectedRange ? ' in-range' : ''}`}
              onClick={handleClick}
            >
              <span>{day}</span>
            </button>
          );
        })}
      </div>

      <div className="public-calendar-note">
        {selectedRange.startDate && selectedRange.endDate
          ? `${selectionMode === 'room' ? 'Séjour' : 'Période'} sélectionné(e) : ${selectedRange.startDate} → ${selectedRange.endDate}`
          : selectedRange.startDate
            ? `${selectionMode === 'room' ? 'Arrivée' : 'Début'} sélectionné(e) : ${selectedRange.startDate}. Choisissez ${selectionMode === 'room' ? 'la date de départ' : 'la date de fin'}.`
            : 'Choisissez une date de début puis une date de fin disponibles.'}
      </div>
    </div>
  );
}