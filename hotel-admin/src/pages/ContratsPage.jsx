import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  tenantId: '', apartmentId: '', startDate: '', endDate: '', rentAmount: '', deposit: '',
};

export default function ContratsPage() {
  const [leases,     setLeases]     = useState([]);
  const [tenants,    setTenants]    = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  // Modal
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeases = () => {
    setLoading(true);
    setError('');
    api.get('/leases')
      .then((r) => setLeases(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeases();
    api.get('/tenants').then((r) => setTenants(r.data.data)).catch(() => {});
    api.get('/apartments').then((r) =>
      setApartments(r.data.data.filter((a) => a.status === 'AVAILABLE'))
    ).catch(() => {});
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const displayed = search
    ? leases.filter((l) => {
        const tenant = l.tenant ? `${l.tenant.firstname} ${l.tenant.lastname}`.toLowerCase() : '';
        const apt    = l.apartment?.code?.toLowerCase() || '';
        return tenant.includes(search.toLowerCase()) || apt.includes(search.toLowerCase());
      })
    : leases;

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErr('');
    setModal(true);
  };
  const closeModal = () => { setModal(false); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      const payload = {
        tenantId:    Number(form.tenantId),
        apartmentId: Number(form.apartmentId),
        startDate:   form.startDate,
        endDate:     form.endDate,
        rentAmount:  Number(form.rentAmount),
        deposit:     form.deposit ? Number(form.deposit) : null,
      };
      await api.post('/leases', payload);
      closeModal();
      fetchLeases();
      api.get('/apartments').then((r) =>
        setApartments(r.data.data.filter((a) => a.status === 'AVAILABLE'))
      ).catch(() => {});
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const cfg = status === 'active'
      ? { bg: '#dcfce7', color: '#16a34a', label: 'Actif' }
      : { bg: '#f1f5f9', color: '#64748b', label: 'Terminé' };
    return (
      <span style={{ ...s.badge, background: cfg.bg, color: cfg.color }}>
        {cfg.label}
      </span>
    );
  };

  const fmt = (v) => v ? new Intl.NumberFormat('fr-FR').format(v) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Contrats">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.pageTitle}>Contrats de location</h3>
          <p style={s.subtitle}>{leases.length} contrat(s)</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>+ Nouveau contrat</button>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <input style={s.searchInput}
          placeholder="Rechercher par locataire ou code appartement..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={s.info}>Chargement...</p>}
        {error   && <p style={s.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={s.info}>Aucun contrat trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Locataire', 'Appartement', 'Début', 'Fin', 'Loyer/mois', 'Caution', 'Statut'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((l) => (
                  <tr key={l.id} style={s.tr}>
                    <td style={s.td}><span style={s.idBadge}>#{l.id}</span></td>
                    <td style={s.td}>
                      {l.tenant
                        ? <><strong>{l.tenant.lastname}</strong> {l.tenant.firstname}</>
                        : <span style={s.empty}>—</span>}
                    </td>
                    <td style={s.td}>{l.apartment?.code || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>{fmtDate(l.startDate)}</td>
                    <td style={s.td}>{fmtDate(l.endDate)}</td>
                    <td style={s.td}>{fmt(l.rentAmount)} FCFA</td>
                    <td style={s.td}>{l.deposit ? `${fmt(l.deposit)} FCFA` : <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>{statusBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={displayed.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Modal création */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>+ Nouveau contrat</h3>
            <form onSubmit={handleSubmit}>
              {formErr && <p style={s.formErr}>{formErr}</p>}

              {/* Locataire */}
              <div style={s.field}>
                <label style={s.label}>Locataire *</label>
                <select style={s.input} name="tenantId" required
                  value={form.tenantId} onChange={handleChange}>
                  <option value="">— Sélectionner —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.lastname} {t.firstname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appartement */}
              <div style={s.field}>
                <label style={s.label}>Appartement (disponibles) *</label>
                <select style={s.input} name="apartmentId" required
                  value={form.apartmentId} onChange={handleChange}>
                  <option value="">— Sélectionner —</option>
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code}{a.building ? ` — ${a.building.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Date début *</label>
                  <input style={s.input} type="date" name="startDate" required
                    value={form.startDate} onChange={handleChange} />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Date fin *</label>
                  <input style={s.input} type="date" name="endDate" required
                    value={form.endDate} onChange={handleChange} />
                </div>
              </div>

              {/* Loyer / Caution */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Loyer mensuel (FCFA) *</label>
                  <input style={s.input} type="number" name="rentAmount" min="0" required
                    value={form.rentAmount} onChange={handleChange} placeholder="ex : 150000" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Caution (FCFA)</label>
                  <input style={s.input} type="number" name="deposit" min="0"
                    value={form.deposit} onChange={handleChange} placeholder="ex : 300000" />
                </div>
              </div>

              <div style={s.modalActions}>
                <button type="button" onClick={closeModal} style={s.btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={s.btnSave}>
                  {saving ? 'Création...' : 'Créer le contrat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:   { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:    { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn:      { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  searchBar:   { marginBottom: '20px' },
  searchInput: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  card:        { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap:   { overflowX: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th:          { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge:     { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  badge:       { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  empty:       { color: '#cbd5e1' },
  info:        { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg:    { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
  // Modal
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:   { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px' },
  field:        { marginBottom: '16px' },
  row:          { display: 'flex', gap: '16px', marginBottom: '16px' },
  col:          { flex: 1 },
  label:        { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input:        { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  formErr:      { padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
  btnCancel:    { padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
  btnSave:      { padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' },
};

