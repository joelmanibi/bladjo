import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';

const PAGE_SIZE    = 10;
const IMG_BASE_URL = 'http://localhost:3000/uploads/apartments';
const MAX_IMAGES   = 5;

const EMPTY_FORM = {
  buildingId: '', floorId: '', code: '', rooms: '', bathrooms: '',
  area: '', rentAmount: '', status: 'AVAILABLE',
};

const STATUS_LABELS = { AVAILABLE: 'LIBRE', OCCUPIED: 'OCCUPÉ' };
const STATUS_COLORS = {
  AVAILABLE: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  OCCUPIED:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
};

export default function AppartementsPage() {
  const [apartments,    setApartments]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);

  // Modal
  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  // Image management (edit/add modal)
  const [keepImages, setKeepImages] = useState([]); // existing filenames to keep
  const [newFiles,   setNewFiles]   = useState([]); // newly selected File objects
  const fileInputRef = useRef(null);

  // Gallery modal
  const [gallery, setGallery] = useState({ apt: null, index: 0 });

  // Select data
  const [buildings,     setBuildings]     = useState([]);
  const [floors,        setFloors]        = useState([]);
  const [floorsLoading, setFloorsLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchApartments = () => {
    setLoading(true);
    setError('');
    api.get('/apartments')
      .then((r) => setApartments(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  const fetchBuildings = () => {
    api.get('/buildings').then((r) => setBuildings(r.data.data)).catch(() => {});
  };

  const fetchFloors = (buildingId) => {
    if (!buildingId) { setFloors([]); return; }
    setFloorsLoading(true);
    api.get(`/floors/building/${buildingId}`)
      .then((r) => setFloors(r.data.data))
      .catch(() => setFloors([]))
      .finally(() => setFloorsLoading(false));
  };

  useEffect(() => { fetchApartments(); fetchBuildings(); }, []);

  const displayed = search
    ? apartments.filter((a) =>
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        (a.building?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.floor?.label   || '').toLowerCase().includes(search.toLowerCase())
      )
    : apartments;

  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErr('');
    setFloors([]);
    setEditing(null);
    setKeepImages([]);
    setNewFiles([]);
    setModal('add');
  };

  const openEdit = (apt) => {
    setForm({
      buildingId: apt.buildingId !== null ? String(apt.buildingId) : '',
      floorId:    apt.floorId    !== null ? String(apt.floorId)    : '',
      code:       apt.code       || '',
      rooms:      apt.rooms      !== null ? String(apt.rooms)      : '',
      bathrooms:  apt.bathrooms  !== null ? String(apt.bathrooms)  : '',
      area:       apt.area       !== null ? String(apt.area)       : '',
      rentAmount: apt.rentAmount !== null ? String(apt.rentAmount) : '',
      status:     apt.status     || 'AVAILABLE',
    });
    setFormErr('');
    setKeepImages(Array.isArray(apt.images) ? apt.images : []);
    setNewFiles([]);
    if (apt.buildingId) fetchFloors(apt.buildingId);
    else setFloors([]);
    setEditing(apt);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null); setEditing(null); setFloors([]);
    setKeepImages([]); setNewFiles([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'buildingId') {
      setForm({ ...form, buildingId: value, floorId: '' });
      fetchFloors(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const total    = keepImages.length + newFiles.length + selected.length;
    if (total > MAX_IMAGES) {
      setFormErr(`Maximum ${MAX_IMAGES} images autorisées (${keepImages.length + newFiles.length} déjà sélectionnées)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFormErr('');
    setNewFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeKeepImage  = (filename) => setKeepImages((prev) => prev.filter((f) => f !== filename));
  const removeNewFile    = (index)    => setNewFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Submit (FormData) ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('code',       form.code.trim().toUpperCase());
      fd.append('buildingId', form.buildingId);
      fd.append('floorId',    form.floorId);
      fd.append('rooms',      form.rooms);
      fd.append('bathrooms',  form.bathrooms);
      fd.append('area',       form.area);
      fd.append('rentAmount', form.rentAmount);
      fd.append('status',     form.status);
      fd.append('keepImages', JSON.stringify(keepImages));
      newFiles.forEach((file) => fd.append('images', file));

      if (modal === 'add') {
        await api.post('/apartments', fd);
      } else {
        await api.put(`/apartments/${editing.id}`, fd);
      }
      closeModal();
      fetchApartments();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Appartements">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.pageTitle}>Gestion des appartements</h3>
          <p style={s.subtitle}>{apartments.length} appartement(s)</p>
        </div>
        <button onClick={openAdd} style={s.addBtn}>+ Ajouter un appartement</button>
      </div>

      {/* Search */}
      <div style={s.searchBar}>
        <input style={s.searchInput}
          placeholder="Rechercher par code, immeuble ou niveau..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading && <p style={s.info}>Chargement...</p>}
        {error   && <p style={s.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={s.info}>Aucun appartement trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Code', 'Immeuble', 'Niveau', 'Pièces', 'Douches', 'Surface', 'Loyer/mois', 'Statut', 'Actions'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => {
                  const sc = STATUS_COLORS[a.status] || STATUS_COLORS.AVAILABLE;
                  return (
                    <tr key={a.id} style={s.tr}>
                      <td style={s.td}><span style={s.idBadge}>#{a.id}</span></td>
                      <td style={s.td}>
                        <div style={s.codeCell}>
                          <span style={s.avatar}>🚪</span>
                          <strong>{a.code}</strong>
                        </div>
                      </td>
                      <td style={s.td}>{a.building?.name || <span style={s.empty}>—</span>}</td>
                      <td style={s.td}>{a.floor?.label   || <span style={s.empty}>—</span>}</td>
                      <td style={s.td}>{a.rooms     !== null ? a.rooms     : <span style={s.empty}>—</span>}</td>
                      <td style={s.td}>{a.bathrooms !== null ? a.bathrooms : <span style={s.empty}>—</span>}</td>
                      <td style={s.td}>{a.area      !== null ? `${a.area} m²` : <span style={s.empty}>—</span>}</td>
                      <td style={s.td}>
                        {a.rentAmount !== null
                          ? `${Number(a.rentAmount).toLocaleString('fr-FR')} F`
                          : <span style={s.empty}>—</span>}
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.statusBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          {Array.isArray(a.images) && a.images.length > 0 && (
                            <button
                              onClick={() => setGallery({ apt: a, index: 0 })}
                              style={s.btnPhoto}>
                              📷 {a.images.length}
                            </button>
                          )}
                          <button onClick={() => openEdit(a)} style={s.btnEdit}>✏ Modifier</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              {modal === 'add' ? '+ Nouvel appartement' : "✏ Modifier l'appartement"}
            </h3>
            <form onSubmit={handleSubmit}>
              {formErr && <p style={s.formErr}>{formErr}</p>}

              {/* Immeuble / Niveau */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Immeuble</label>
                  <select style={s.input} name="buildingId" value={form.buildingId} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div style={s.col}>
                  <label style={s.label}>Niveau</label>
                  <select style={s.input} name="floorId" value={form.floorId} onChange={handleChange}
                    disabled={!form.buildingId || floorsLoading}>
                    <option value="">— Sélectionner —</option>
                    {floors.map((f) => <option key={f.id} value={f.id}>{f.label} (N°{f.floorNumber})</option>)}
                  </select>
                </div>
              </div>

              {/* Code / Statut */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Code *</label>
                  <input style={s.input} name="code" required
                    value={form.code} onChange={handleChange} placeholder="ex : AP1" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Statut</label>
                  <select style={s.input} name="status" value={form.status} onChange={handleChange}>
                    <option value="AVAILABLE">LIBRE</option>
                    <option value="OCCUPIED">OCCUPÉ</option>
                  </select>
                </div>
              </div>

              {/* Pièces / Douches */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Nombre de pièces</label>
                  <input style={s.input} name="rooms" type="number" min="1"
                    value={form.rooms} onChange={handleChange} placeholder="ex : 3" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Nombre de douches</label>
                  <input style={s.input} name="bathrooms" type="number" min="0"
                    value={form.bathrooms} onChange={handleChange} placeholder="ex : 2" />
                </div>
              </div>

              {/* Surface / Loyer */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Surface (m²)</label>
                  <input style={s.input} name="area" type="number" min="0" step="0.01"
                    value={form.area} onChange={handleChange} placeholder="ex : 65" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Loyer mensuel (F CFA) *</label>
                  <input style={s.input} name="rentAmount" type="number" min="0" required
                    value={form.rentAmount} onChange={handleChange} placeholder="ex : 150000" />
                </div>
              </div>

              {/* ── Images ─────────────────────────────────────────────── */}
              <div style={{ marginBottom: '16px' }}>
                <label style={s.label}>
                  Photos ({keepImages.length + newFiles.length}/{MAX_IMAGES})
                </label>

                {/* Thumbnails: existing images to keep */}
                {keepImages.length > 0 && (
                  <div style={s.thumbRow}>
                    {keepImages.map((fn) => (
                      <div key={fn} style={s.thumbWrap}>
                        <img src={`${IMG_BASE_URL}/${fn}`} alt={fn} style={s.thumb} />
                        <button type="button" style={s.thumbDel} onClick={() => removeKeepImage(fn)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Thumbnails: new files (preview) */}
                {newFiles.length > 0 && (
                  <div style={s.thumbRow}>
                    {newFiles.map((file, i) => (
                      <div key={i} style={s.thumbWrap}>
                        <img src={URL.createObjectURL(file)} alt={file.name} style={s.thumb} />
                        <button type="button" style={s.thumbDel} onClick={() => removeNewFile(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File picker — only shown when below limit */}
                {keepImages.length + newFiles.length < MAX_IMAGES && (
                  <label style={s.uploadLabel}>
                    + Ajouter des photos
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                )}
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

      {/* ── Gallery Modal ──────────────────────────────────────────────────── */}
      {gallery.apt && (
        <div style={s.overlay} onClick={() => setGallery({ apt: null, index: 0 })}>
          <div style={s.galleryBox} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={s.galleryHeader}>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>
                🚪 {gallery.apt.code} — Photo {gallery.index + 1} / {gallery.apt.images.length}
              </span>
              <button style={s.galleryClose} onClick={() => setGallery({ apt: null, index: 0 })}>✕</button>
            </div>

            {/* Main image */}
            <div style={s.galleryImgWrap}>
              {gallery.index > 0 && (
                <button style={{ ...s.galleryArrow, left: '12px' }}
                  onClick={() => setGallery((g) => ({ ...g, index: g.index - 1 }))}>‹</button>
              )}
              <img
                src={`${IMG_BASE_URL}/${gallery.apt.images[gallery.index]}`}
                alt={`photo-${gallery.index}`}
                style={s.galleryImg}
              />
              {gallery.index < gallery.apt.images.length - 1 && (
                <button style={{ ...s.galleryArrow, right: '12px' }}
                  onClick={() => setGallery((g) => ({ ...g, index: g.index + 1 }))}>›</button>
              )}
            </div>

            {/* Dot indicators */}
            <div style={s.galleryDots}>
              {gallery.apt.images.map((_, i) => (
                <span
                  key={i}
                  style={{ ...s.dot, background: i === gallery.index ? '#2563eb' : '#cbd5e1' }}
                  onClick={() => setGallery((g) => ({ ...g, index: i }))}
                />
              ))}
            </div>

            {/* Strip of thumbnails */}
            <div style={s.galleryStrip}>
              {gallery.apt.images.map((fn, i) => (
                <img
                  key={fn}
                  src={`${IMG_BASE_URL}/${fn}`}
                  alt={fn}
                  style={{
                    ...s.stripThumb,
                    border: i === gallery.index ? '2px solid #2563eb' : '2px solid transparent',
                  }}
                  onClick={() => setGallery((g) => ({ ...g, index: i }))}
                />
              ))}
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
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th:          { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge:     { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  codeCell:    { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:      { fontSize: '18px', flexShrink: 0 },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  empty:       { color: '#cbd5e1' },
  actions:     { display: 'flex', gap: '6px' },
  btnEdit:     { padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#0369a1', cursor: 'pointer' },
  btnPhoto:    { padding: '5px 10px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#7c3aed', cursor: 'pointer' },
  // Image upload
  thumbRow:    { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' },
  thumbWrap:   { position: 'relative', width: '72px', height: '72px' },
  thumb:       { width: '72px', height: '72px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' },
  thumbDel:    { position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  uploadLabel: { display: 'inline-block', padding: '7px 14px', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer', marginTop: '4px' },
  // Gallery modal
  galleryBox:     { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '700px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' },
  galleryHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
  galleryClose:   { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  galleryImgWrap: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', minHeight: '300px' },
  galleryImg:     { maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' },
  galleryArrow:   { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '32px', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  galleryDots:    { display: 'flex', justifyContent: 'center', gap: '6px', padding: '10px 0' },
  dot:            { width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' },
  galleryStrip:   { display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto', borderTop: '1px solid #e2e8f0' },
  stripThumb:     { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 },
  info:        { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg:    { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
  // Modal
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:   { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px' },
  row:          { display: 'flex', gap: '16px', marginBottom: '16px' },
  col:          { flex: 1 },
  label:        { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input:        { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  formErr:      { padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
  btnCancel:    { padding: '9px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer' },
  btnSave:      { padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer' },
};


