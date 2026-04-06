import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userName, role } = getAuth();

  const [data,         setData]         = useState(null);
  const [todayBookings,setTodayBookings] = useState(0);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  useEffect(() => {
    Promise.allSettled([
      api.get('/dashboard'),
      api.get('/bookings'),
    ]).then(([dashRes, bookRes]) => {
      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value.data.data);
      } else {
        setError(dashRes.reason?.response?.data?.message || 'Erreur de chargement du tableau de bord.');
      }
      if (bookRes.status === 'fulfilled') {
        const all = bookRes.value.data.data;
        setTodayBookings(all.filter(b => b.checkInDate === todayStr).length);
      }
    }).finally(() => setLoading(false));
  }, []);

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const occupancyRate = data && data.rooms.total > 0
    ? Math.round((data.rooms.occupied / data.rooms.total) * 100)
    : 0;

  const barColor = occupancyRate > 70 ? '#dc2626' : occupancyRate > 40 ? '#f59e0b' : '#16a34a';

  return (
    <AdminLayout title="Tableau de bord">
      {loading && <p style={s.info}>Chargement…</p>}
      {error   && <p style={s.err}>{error}</p>}

      {data && (
        <>
          {/* ── Barre de bienvenue ───────────────────────────── */}
          <div style={s.welcome}>
            <div>
              <h2 style={s.welcomeTitle}>Bonjour, {userName || 'Admin'} 👋</h2>
              <p style={s.welcomeDate}>{dateLabel}</p>
            </div>
            <div style={s.occupancyBox}>
              <span style={s.occupancyLabel}>Taux d'occupation</span>
              <span style={s.occupancyValue}>{occupancyRate}%</span>
              <div style={s.bar}>
                <div style={{ ...s.barFill, width: `${occupancyRate}%`, background: barColor }} />
              </div>
            </div>
          </div>

          {/* ── 6 cartes KPI ────────────────────────────────── */}
          <div style={s.grid6}>
            <KpiCard icon="🏨" label="Chambres"        value={data.rooms.total}           color="#2563eb" bg="#eff6ff" onClick={() => navigate('/rooms')} />
            <KpiCard icon="🔴" label="Occupées"         value={data.rooms.occupied}        color="#dc2626" bg="#fef2f2" onClick={() => navigate('/rooms')} />
            <KpiCard icon="🟢" label="Disponibles"      value={data.rooms.available}       color="#16a34a" bg="#f0fdf4" onClick={() => navigate('/rooms')} />
            <KpiCard icon="👷" label="Employés"         value={data.totalEmployees}        color="#0891b2" bg="#ecfeff"
              onClick={role !== 'RECEPTION' ? () => navigate('/employees') : undefined} />
            <KpiCard icon="⚠️" label="Stock faible"    value={data.lowStockItems.count}   color="#d97706" bg="#fffbeb"
              onClick={role !== 'RECEPTION' ? () => navigate('/stock') : undefined} />
            <KpiCard icon="📅" label="Arrivées du jour" value={todayBookings}              color="#7c3aed" bg="#f5f3ff" onClick={() => navigate('/reservations')} />
          </div>

          {/* ── 2 cartes revenus ────────────────────────────── */}
          <div style={s.grid2}>
            <RevenueCard label="Revenu du mois" value={data.revenue.monthly} icon="📊" color="#15803d" />
            <RevenueCard label="Revenu du jour"  value={data.revenue.today}  icon="💵" color="#b45309" />
          </div>

          {/* ── Table stock faible ──────────────────────────── */}
          <section style={s.section}>
            <h3 style={s.secTitle}>
              ⚠️ Articles en stock faible
              <span style={s.badge}>{data.lowStockItems.count}</span>
            </h3>
            {data.lowStockItems.count === 0 ? (
              <p style={s.info}>✅ Tous les articles sont suffisamment approvisionnés.</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>{['Article', 'Catégorie', 'Quantité'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {data.lowStockItems.items.map(item => (
                    <tr key={item.id}>
                      <td style={s.td}><strong>{item.name}</strong></td>
                      <td style={s.td}>{item.category || '—'}</td>
                      <td style={{ ...s.td, color: item.quantity <= 3 ? '#dc2626' : '#d97706', fontWeight: '700' }}>
                        {item.quantity} unité(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────── */

function KpiCard({ icon, label, value, color, bg, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ ...s.kpiCard, background: bg, cursor: onClick ? 'pointer' : 'default',
        transform: hovered && onClick ? 'translateY(-3px)' : 'none',
        boxShadow: hovered && onClick ? '0 6px 20px rgba(0,0,0,0.10)' : s.kpiCard.boxShadow }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.kpiIcon}>{icon}</div>
      <div>
        <p style={s.kpiLabel}>{label}</p>
        <p style={{ ...s.kpiValue, color }}>{value}</p>
      </div>
    </div>
  );
}

function RevenueCard({ label, value, icon, color }) {
  return (
    <div style={{ ...s.revCard, borderLeft: `5px solid ${color}` }}>
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <div style={{ marginLeft: '16px' }}>
        <p style={s.revLabel}>{label}</p>
        <p style={{ ...s.revValue, color }}>
          {Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA
        </p>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const s = {
  info:          { color: '#666', fontSize: '14px' },
  err:           { color: '#dc2626', fontSize: '14px' },
  welcome:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                   background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                   borderRadius: '14px', padding: '24px 32px', marginBottom: '28px', color: '#fff',
                   flexWrap: 'wrap', gap: '16px' },
  welcomeTitle:  { margin: '0 0 4px', fontSize: '22px', fontWeight: '700' },
  welcomeDate:   { margin: 0, fontSize: '14px', opacity: 0.85, textTransform: 'capitalize' },
  occupancyBox:  { textAlign: 'right' },
  occupancyLabel:{ display: 'block', fontSize: '11px', opacity: 0.8, marginBottom: '4px',
                   textTransform: 'uppercase', letterSpacing: '0.8px' },
  occupancyValue:{ display: 'block', fontSize: '34px', fontWeight: '800', marginBottom: '8px', lineHeight: 1 },
  bar:           { width: '160px', height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px' },
  barFill:       { height: '8px', borderRadius: '4px', transition: 'width 0.6s ease' },
  grid6:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '16px', marginBottom: '20px' },
  kpiCard:       { borderRadius: '14px', padding: '20px 18px', display: 'flex', alignItems: 'center', gap: '14px',
                   boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.15s, box-shadow 0.15s' },
  kpiIcon:       { fontSize: '28px', lineHeight: 1, flexShrink: 0 },
  kpiLabel:      { margin: '0 0 4px', fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  kpiValue:      { margin: 0, fontSize: '28px', fontWeight: '800' },
  grid2:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' },
  revCard:       { background: '#fff', borderRadius: '14px', padding: '22px 24px', display: 'flex',
                   alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  revLabel:      { margin: '0 0 4px', fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  revValue:      { margin: 0, fontSize: '22px', fontWeight: '800' },
  section:       { background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  secTitle:      { margin: '0 0 16px', fontSize: '17px', fontWeight: '700', color: '#1a1a2e',
                   display: 'flex', alignItems: 'center', gap: '10px' },
  badge:         { background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { textAlign: 'left', padding: '10px 14px', background: '#f8fafc', fontSize: '13px',
                   fontWeight: '600', color: '#555', borderBottom: '1px solid #e2e8f0' },
  td:            { padding: '11px 14px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f1f5f9' },
};

