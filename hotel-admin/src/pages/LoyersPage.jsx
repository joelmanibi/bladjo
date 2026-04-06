import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  tenantId: '', apartmentId: '', amount: '', month: '', paymentDate: '', notes: '',
};

export default function LoyersPage() {
  const [payments,   setPayments]   = useState([]);
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
  const fetchPayments = () => {
    setLoading(true);
    setError('');
    api.get('/rent-payments')
      .then((r) => setPayments(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
    api.get('/tenants').then((r) => setTenants(r.data.data)).catch(() => {});
    api.get('/apartments').then((r) => setApartments(r.data.data)).catch(() => {});
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const displayed = search
    ? payments.filter((p) => {
        const tenant = p.tenant ? `${p.tenant.firstname} ${p.tenant.lastname}`.toLowerCase() : '';
        const apt    = p.apartment?.code?.toLowerCase() || '';
        return tenant.includes(search.toLowerCase()) || apt.includes(search.toLowerCase());
      })
    : payments;

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, paymentDate: new Date().toISOString().slice(0, 10) });
    setFormErr('');
    setModal(true);
  };
  const closeModal  = () => setModal(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      await api.post('/rent-payments', {
        tenantId:    Number(form.tenantId),
        apartmentId: Number(form.apartmentId),
        amount:      Number(form.amount),
        month:       form.month + '-01',   // YYYY-MM → YYYY-MM-01
        paymentDate: form.paymentDate,
        notes:       form.notes || null,
      });
      closeModal();
      fetchPayments();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt     = (v) => v ? new Intl.NumberFormat('fr-FR').format(v) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  const fmtMonth = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Paiements loyers">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.pageTitle}>Paiements de loyers</h3>
          <p style={s.subtitle}>{payments.length} paiement(s) enregistré(s)</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>+ Enregistrer un paiement</button>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <input style={s.searchInput}
          placeholder="Rechercher par locataire ou appartement..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={s.info}>Chargement...</p>}
        {error   && <p style={s.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={s.info}>Aucun paiement enregistré.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Locataire', 'Appartement', 'Mois', 'Montant', 'Date paiement', 'Notes'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}><span style={s.idBadge}>#{p.id}</span></td>
                    <td style={s.td}>
                      {p.tenant
                        ? <><strong>{p.tenant.lastname}</strong> {p.tenant.firstname}</>
                        : <span style={s.empty}>—</span>}
                    </td>
                    <td style={s.td}>{p.apartment?.code || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>
                      <span style={s.monthBadge}>{fmtMonth(p.month)}</span>
                    </td>
                    <td style={s.td}><strong>{fmt(p.amount)} FCFA</strong></td>
                    <td style={s.td}>{fmtDate(p.paymentDate)}</td>
                    <td style={s.td}>{p.notes || <span style={s.empty}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={displayed.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Modal paiement */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>💳 Enregistrer un paiement</h3>
            <form onSubmit={handleSubmit}>
              {formErr && <p style={s.formErr}>{formErr}</p>}

              {/* Locataire */}
              <div style={s.field}>
                <label style={s.label}>Locataire *</label>
                <select style={s.input} name="tenantId" required
                  value={form.tenantId} onChange={handleChange}>
                  <option value="">— Sélectionner —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.lastname} {t.firstname}</option>
                  ))}
                </select>
              </div>

              {/* Appartement */}
              <div style={s.field}>
                <label style={s.label}>Appartement *</label>
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

              {/* Mois / Montant */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Mois *</label>
                  <input style={s.input} type="month" name="month" required
                    value={form.month} onChange={handleChange} />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Montant (FCFA) *</label>
                  <input style={s.input} type="number" name="amount" min="0" required
                    value={form.amount} onChange={handleChange} placeholder="ex : 150000" />
                </div>
              </div>

              {/* Date paiement */}
              <div style={s.field}>
                <label style={s.label}>Date de paiement *</label>
                <input style={s.input} type="date" name="paymentDate" required
                  value={form.paymentDate} onChange={handleChange} />
              </div>

              {/* Notes */}
              <div style={s.field}>
                <label style={s.label}>Notes</label>
                <input style={s.input} name="notes"
                  value={form.notes} onChange={handleChange}
                  placeholder="ex : Paiement partiel, retard..." />
              </div>

              <div style={s.modalActions}>
                <button type="button" onClick={closeModal} style={s.btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={s.btnSave}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
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
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '860px' },
  th:          { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge:     { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  monthBadge:  { display: 'inline-block', padding: '3px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' },
  empty:       { color: '#cbd5e1' },
  info:        { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg:    { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
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

