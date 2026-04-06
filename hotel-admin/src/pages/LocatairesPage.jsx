import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  lastname: '', firstname: '', phone: '', email: '', identityNumber: '',
};

export default function LocatairesPage() {
  const [tenants,  setTenants]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);

  // Modal
  const [modal,   setModal]   = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTenants = () => {
    setLoading(true);
    setError('');
    api.get('/tenants')
      .then((r) => setTenants(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTenants(); }, []);

  const displayed = search
    ? tenants.filter((t) =>
        `${t.firstname} ${t.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
        (t.phone || '').includes(search) ||
        (t.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : tenants;

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErr('');
    setEditing(null);
    setModal('add');
  };

  const openEdit = (t) => {
    setForm({
      lastname:       t.lastname       || '',
      firstname:      t.firstname      || '',
      phone:          t.phone          || '',
      email:          t.email          || '',
      identityNumber: t.identityNumber || '',
    });
    setFormErr('');
    setEditing(t);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      const payload = {
        lastname:       form.lastname.trim(),
        firstname:      form.firstname.trim(),
        phone:          form.phone.trim(),
        email:          form.email.trim(),
        identityNumber: form.identityNumber.trim() || null,
      };
      if (modal === 'add') {
        await api.post('/tenants', payload);
      } else {
        await api.put(`/tenants/${editing.id}`, payload);
      }
      closeModal();
      fetchTenants();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Locataires">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.pageTitle}>Gestion des locataires</h3>
          <p style={s.subtitle}>{tenants.length} locataire(s)</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>+ Ajouter un locataire</button>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <input style={s.searchInput}
          placeholder="Rechercher par nom, téléphone ou email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={s.info}>Chargement...</p>}
        {error   && <p style={s.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={s.info}>Aucun locataire trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Nom complet', 'Téléphone', 'Email', 'N° pièce', 'Actions'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} style={s.tr}>
                    <td style={s.td}><span style={s.idBadge}>#{t.id}</span></td>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <span style={s.avatar}>🧑</span>
                        <div>
                          <strong>{t.lastname} {t.firstname}</strong>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{t.phone || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>{t.email || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>{t.identityNumber || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => openEdit(t)} style={s.btnEdit}>✏ Modifier</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={displayed.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Modal Add / Edit */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>
              {modal === 'add' ? '+ Nouveau locataire' : '✏ Modifier le locataire'}
            </h3>
            <form onSubmit={handleSubmit}>
              {formErr && <p style={s.formErr}>{formErr}</p>}

              {/* Nom / Prénom */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Nom *</label>
                  <input style={s.input} name="lastname" required
                    value={form.lastname} onChange={handleChange}
                    placeholder="ex : Kouassi" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Prénom *</label>
                  <input style={s.input} name="firstname" required
                    value={form.firstname} onChange={handleChange}
                    placeholder="ex : Jean" />
                </div>
              </div>

              {/* Téléphone / Email */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Téléphone *</label>
                  <input style={s.input} name="phone" required
                    value={form.phone} onChange={handleChange}
                    placeholder="ex : 0707070707" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Email *</label>
                  <input style={s.input} name="email" type="email" required
                    value={form.email} onChange={handleChange}
                    placeholder="ex : jean@email.com" />
                </div>
              </div>

              {/* N° pièce d'identité */}
              <div style={s.field}>
                <label style={s.label}>Numéro pièce d'identité</label>
                <input style={s.input} name="identityNumber"
                  value={form.identityNumber} onChange={handleChange}
                  placeholder="ex : CI-123456" />
              </div>

              <div style={s.modalActions}>
                <button type="button" onClick={closeModal} style={s.btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={s.btnSave}>
                  {saving ? 'Sauvegarde...' : modal === 'add' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:   { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:    { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn:      { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  searchBar:   { marginBottom: '20px' },
  searchInput: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  card:        { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap:   { overflowX: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
  th:          { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge:     { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  nameCell:    { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:      { fontSize: '20px', flexShrink: 0 },
  empty:       { color: '#cbd5e1' },
  actions:     { display: 'flex', gap: '6px' },
  btnEdit:     { padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#0369a1', cursor: 'pointer' },
  info:        { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg:    { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
  // Modal
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
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

