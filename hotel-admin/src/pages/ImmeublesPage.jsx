import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: '', address: '', city: '', country: '', numberOfFloors: '', description: '',
};

export default function ImmeublesPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);

  // Modal
  const [modal,   setModal]   = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  // Floors modal
  const [floorModal,    setFloorModal]    = useState(null); // null | building object
  const [floors,        setFloors]        = useState([]);
  const [floorsLoading, setFloorsLoading] = useState(false);
  const [floorForm,     setFloorForm]     = useState({ floorNumber: '', label: '' });
  const [floorSaving,   setFloorSaving]   = useState(false);
  const [floorErr,      setFloorErr]      = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBuildings = () => {
    setLoading(true);
    setError('');
    api.get('/buildings')
      .then((r) => setBuildings(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBuildings(); }, []);

  const displayed = search
    ? buildings.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.city  || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.country || '').toLowerCase().includes(search.toLowerCase())
      )
    : buildings;

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

  const openEdit = (b) => {
    setForm({
      name:           b.name           || '',
      address:        b.address        || '',
      city:           b.city           || '',
      country:        b.country        || '',
      numberOfFloors: b.numberOfFloors !== null ? String(b.numberOfFloors) : '',
      description:    b.description    || '',
    });
    setFormErr('');
    setEditing(b);
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
        name:           form.name.trim(),
        address:        form.address.trim()     || null,
        city:           form.city.trim()        || null,
        country:        form.country.trim()     || null,
        numberOfFloors: form.numberOfFloors !== '' ? Number(form.numberOfFloors) : null,
        description:    form.description.trim() || null,
      };
      if (modal === 'add') {
        await api.post('/buildings', payload);
      } else {
        await api.put(`/buildings/${editing.id}`, payload);
      }
      closeModal();
      fetchBuildings();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (b) => {
    if (!window.confirm(`Supprimer l'immeuble "${b.name}" ?`)) return;
    try {
      await api.delete(`/buildings/${b.id}`);
      fetchBuildings();
    } catch (e) {
      alert(e.response?.data?.message || 'Suppression impossible');
    }
  };

  // ── Floors ─────────────────────────────────────────────────────────────────
  const fetchFloors = (buildingId) => {
    setFloorsLoading(true);
    setFloorErr('');
    api.get(`/floors/building/${buildingId}`)
      .then((r) => setFloors(r.data.data))
      .catch((e) => setFloorErr(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setFloorsLoading(false));
  };

  const openFloorModal = (b) => {
    setFloorModal(b);
    setFloors([]);
    setFloorForm({ floorNumber: '', label: '' });
    setFloorErr('');
    fetchFloors(b.id);
  };

  const closeFloorModal = () => { setFloorModal(null); setFloors([]); setFloorErr(''); };

  const handleFloorChange = (e) => setFloorForm({ ...floorForm, [e.target.name]: e.target.value });

  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    setFloorErr('');
    setFloorSaving(true);
    try {
      await api.post('/floors', {
        buildingId:  floorModal.id,
        floorNumber: Number(floorForm.floorNumber),
        label:       floorForm.label.trim(),
      });
      setFloorForm({ floorNumber: '', label: '' });
      fetchFloors(floorModal.id);
    } catch (err) {
      setFloorErr(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setFloorSaving(false);
    }
  };

  const handleFloorDelete = async (floor) => {
    if (!window.confirm(`Supprimer le niveau "${floor.label}" ?`)) return;
    try {
      await api.delete(`/floors/${floor.id}`);
      fetchFloors(floorModal.id);
    } catch (e) {
      alert(e.response?.data?.message || 'Suppression impossible');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Immeubles">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.pageTitle}>Gestion des immeubles</h3>
          <p style={s.subtitle}>{buildings.length} immeuble(s)</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>+ Ajouter un immeuble</button>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <input
          style={s.searchInput}
          placeholder="Rechercher par nom, ville ou pays..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={s.info}>Chargement...</p>}
        {error   && <p style={s.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={s.info}>Aucun immeuble trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Nom', 'Adresse', 'Ville', 'Pays', 'Étages', 'Actions'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => (
                  <tr key={b.id} style={s.tr}>
                    <td style={s.td}><span style={s.idBadge}>#{b.id}</span></td>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <span style={s.avatar}>🏢</span>
                        <strong>{b.name}</strong>
                      </div>
                    </td>
                    <td style={s.td}>{b.address || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>{b.city    || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>{b.country || <span style={s.empty}>—</span>}</td>
                    <td style={s.td}>
                      {b.numberOfFloors !== null
                        ? <span style={s.floorBadge}>{b.numberOfFloors} étage(s)</span>
                        : <span style={s.empty}>—</span>}
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => openFloorModal(b)} style={s.btnFloors}>🏗 Niveaux</button>
                        <button onClick={() => openEdit(b)} style={s.btnEdit}>✏ Modifier</button>
                        <button onClick={() => handleDelete(b)} style={s.btnDelete}>🗑 Supprimer</button>
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
              {modal === 'add' ? '+ Nouvel immeuble' : "✏ Modifier l'immeuble"}
            </h3>

            <form onSubmit={handleSubmit}>
              {formErr && <p style={s.formErr}>{formErr}</p>}

              {/* Nom */}
              <div style={s.field}>
                <label style={s.label}>Nom *</label>
                <input style={s.input} name="name" required
                  value={form.name} onChange={handleChange}
                  placeholder="ex: Immeuble Central" />
              </div>

              {/* Adresse / Ville */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Adresse</label>
                  <input style={s.input} name="address"
                    value={form.address} onChange={handleChange}
                    placeholder="ex: 12 rue de la Paix" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Ville</label>
                  <input style={s.input} name="city"
                    value={form.city} onChange={handleChange}
                    placeholder="ex: Abidjan" />
                </div>
              </div>

              {/* Pays / Étages */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Pays</label>
                  <input style={s.input} name="country"
                    value={form.country} onChange={handleChange}
                    placeholder="ex: Côte d'Ivoire" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Nombre d'étages</label>
                  <input style={s.input} name="numberOfFloors" type="number" min="0"
                    value={form.numberOfFloors} onChange={handleChange}
                    placeholder="ex: 5" />
                </div>
              </div>

              {/* Description */}
              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, resize: 'vertical' }}
                  name="description" rows={3}
                  value={form.description} onChange={handleChange}
                  placeholder="Description optionnelle..." />
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
      {/* Floors Modal */}
      {floorModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={s.modalTitle}>🏗 Niveaux — {floorModal.name}</h3>
              <button onClick={closeFloorModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>✕</button>
            </div>

            {/* Add floor inline form */}
            <form onSubmit={handleFloorSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: '0 0 120px' }}>
                <label style={s.label}>N° étage *</label>
                <input style={s.input} name="floorNumber" type="number"
                  value={floorForm.floorNumber} onChange={handleFloorChange}
                  placeholder="0" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Label *</label>
                <input style={s.input} name="label"
                  value={floorForm.label} onChange={handleFloorChange}
                  placeholder="ex : RDC, R+1, R+2…" required />
              </div>
              <button type="submit" disabled={floorSaving} style={{ ...s.btnSave, padding: '9px 16px', flexShrink: 0 }}>
                {floorSaving ? '...' : '+ Ajouter'}
              </button>
            </form>

            {floorErr && <p style={s.formErr}>{floorErr}</p>}

            {/* Floors list */}
            {floorsLoading && <p style={s.info}>Chargement...</p>}
            {!floorsLoading && floors.length === 0 && (
              <p style={s.info}>Aucun niveau enregistré pour cet immeuble.</p>
            )}
            {!floorsLoading && floors.length > 0 && (
              <div style={s.tableWrap}>
                <table style={{ ...s.table, minWidth: '320px' }}>
                  <thead>
                    <tr>
                      {['N° étage', 'Label', 'Action'].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {floors.map((f) => (
                      <tr key={f.id} style={s.tr}>
                        <td style={s.td}><span style={s.floorBadge}>{f.floorNumber}</span></td>
                        <td style={s.td}><strong>{f.label}</strong></td>
                        <td style={s.td}>
                          <button onClick={() => handleFloorDelete(f)} style={s.btnDelete}>🗑 Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={closeFloorModal} style={s.btnCancel}>Fermer</button>
            </div>
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
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '740px' },
  th:          { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge:     { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  nameCell:    { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:      { fontSize: '20px', flexShrink: 0 },
  floorBadge:  { display: 'inline-block', padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  empty:       { color: '#cbd5e1' },
  actions:     { display: 'flex', gap: '6px' },
  btnFloors:   { padding: '5px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#15803d', cursor: 'pointer' },
  btnEdit:     { padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#0369a1', cursor: 'pointer' },
  btnDelete:   { padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#dc2626', cursor: 'pointer' },
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


