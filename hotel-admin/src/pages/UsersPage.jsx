import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const ROLES = ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'];

const ROLE_LABELS = {
  ADMIN:        'Administrateur',
  OWNER:        'Propriétaire',
  MANAGER:      'Gérant',
  RECEPTIONIST: 'Réceptionniste',
  ACCOUNTANT:   'Comptable',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'RECEPTIONIST' };

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);

  // Modal state
  const [modal,   setModal]   = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null); // user object being edited
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    setError('');
    api.get('/users')
      .then((r) => setUsers(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const displayed = search
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErr('');
    setEditing(null);
    setModal('add');
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setFormErr('');
    setEditing(user);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  // ── Submit form ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (modal === 'add' || form.password) payload.password = form.password;

      if (modal === 'add') {
        await api.post('/users', payload);
      } else {
        await api.put(`/users/${editing.id}`, payload);
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer l'utilisateur "${user.name}" ?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Suppression impossible');
    }
  };

  return (
    <AdminLayout title="Utilisateurs">
      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.pageTitle}>Gestion des utilisateurs</h3>
          <p style={s.subtitle}>{users.length} utilisateur(s)</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>+ Ajouter un utilisateur</button>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <input
          style={s.searchInput}
          placeholder="Rechercher par nom, email ou rôle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={s.info}>Chargement...</p>}
        {error   && <p style={s.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={s.info}>Aucun utilisateur trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Nom', 'Email', 'Rôle', 'Créé le', 'Actions'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr key={user.id} style={s.tr}>
                    <td style={s.td}><span style={s.idBadge}>#{user.id}</span></td>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <span style={s.avatar}>{user.name.charAt(0).toUpperCase()}</span>
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td style={s.td}>{user.email}</td>
                    <td style={s.td}>
                      <span style={{ ...s.roleBadge, ...roleColor(user.role) }}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td style={s.td}>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => openEdit(user)} style={s.btnEdit}>✏ Modifier</button>
                        <button onClick={() => handleDelete(user)} style={s.btnDelete}>🗑 Supprimer</button>
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
              {modal === 'add' ? '+ Nouvel utilisateur' : '✏ Modifier l\'utilisateur'}
            </h3>
            <form onSubmit={handleSubmit}>
              {formErr && <p style={s.formErr}>{formErr}</p>}

              <div style={s.field}>
                <label style={s.label}>Nom *</label>
                <input style={s.input} required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex: Jean Dupont" />
              </div>

              <div style={s.field}>
                <label style={s.label}>Email *</label>
                <input style={s.input} type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ex: jean@email.com" />
              </div>

              <div style={s.field}>
                <label style={s.label}>
                  Mot de passe {modal === 'edit' ? '(laisser vide = inchangé)' : '*'}
                </label>
                <input style={s.input} type="password" value={form.password}
                  required={modal === 'add'}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={modal === 'edit' ? 'Laisser vide pour ne pas changer' : 'Min. 6 caractères'} />
              </div>

              <div style={s.field}>
                <label style={s.label}>Rôle *</label>
                <select style={s.input} value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
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

// ── Role badge colors ──────────────────────────────────────────────────────────
function roleColor(role) {
  const map = {
    ADMIN:        { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
    OWNER:        { background: '#ede9fe', color: '#5b21b6', borderColor: '#c4b5fd' },
    MANAGER:      { background: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
    RECEPTIONIST: { background: '#f0fdf4', color: '#166534', borderColor: '#86efac' },
    ACCOUNTANT:   { background: '#fff1f2', color: '#9f1239', borderColor: '#fda4af' },
  };
  return map[role] || {};
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:  { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:   { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn:     { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  searchBar:  { marginBottom: '20px' },
  searchInput:{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  card:       { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap:  { overflowX: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
  th:         { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr:         { borderBottom: '1px solid #f1f5f9' },
  td:         { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge:    { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  nameCell:   { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:     { width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 },
  roleBadge:  { display: 'inline-block', padding: '3px 10px', border: '1px solid transparent', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  actions:    { display: 'flex', gap: '6px' },
  btnEdit:    { padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#0369a1', cursor: 'pointer' },
  btnDelete:  { padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#dc2626', cursor: 'pointer' },
  info:       { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg:   { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },

  // Modal
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:   { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px' },
  field:        { marginBottom: '16px' },
  label:        { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input:        { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  formErr:      { padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
  btnCancel:    { padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
  btnSave:      { padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' },
};

