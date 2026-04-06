import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { getAuth } from '../utils/auth';

const IMG_BASE_URL = 'http://localhost:3000/uploads/halls';

export default function ListeSalles() {
  const navigate = useNavigate();
  const { role } = getAuth();
  const canEdit = role !== 'RECEPTION';

  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHalls = async () => {
      setLoading(true);
      setError('');
      try {
        const query = search.trim() ? `?name=${encodeURIComponent(search.trim())}` : '';
        const res = await api.get(`/halls${query}`);
        setHalls(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchHalls();
  }, [search]);

  const handleDelete = async (hall) => {
    if (!window.confirm(`Supprimer la salle « ${hall.name} » ?`)) return;
    try {
      await api.delete(`/halls/${hall.id}`);
      setHalls((prev) => prev.filter((item) => item.id !== hall.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout title="Salles de réception">
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Gestion des salles de réception</h3>
          <p style={styles.subtitle}>{halls.length} salle(s) trouvée(s)</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/halls/new')} style={styles.addBtn}>
            + Ajouter une salle
          </button>
        )}
      </div>

      <div style={styles.searchBar}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une salle par nom..."
          style={styles.searchInput}
        />
      </div>

      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && halls.length === 0 && (
          <p style={styles.info}>Aucune salle trouvée.</p>
        )}

        {!loading && !error && halls.length > 0 && (
          <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Nom', 'Capacité', 'Prix / jour', 'Photos', 'Description', 'Actions'].map((label) => (
                  <th key={label} style={styles.th}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {halls.map((hall) => (
                <tr key={hall.id} style={styles.tr}>
                  <td style={styles.td}><strong>{hall.name}</strong></td>
                  <td style={styles.td}>{hall.capacity} pers.</td>
                  <td style={styles.td}>{Number(hall.pricePerDay).toFixed(2)} FCFA</td>
                  <td style={styles.td}>
                    {Array.isArray(hall.images) && hall.images.length > 0 ? (
                      <div style={styles.photoCell}>
                        <img src={`${IMG_BASE_URL}/${hall.images[0]}`} alt={hall.name} style={styles.photoThumb} />
                        <span style={styles.photoCount}>{hall.images.length}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={styles.td}>{hall.description || '—'}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button onClick={() => navigate(`/halls/${hall.id}`)} style={styles.btnView}>
                        Détails
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => navigate(`/halls/${hall.id}/edit`)} style={styles.btnEdit}>
                            Modifier
                          </button>
                          <button onClick={() => handleDelete(hall)} style={styles.btnDel}>
                            Supprimer
                          </button>
                        </>
                      )}
                      {!canEdit && <span style={styles.readonlyText}>Lecture seule</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  searchBar: { marginBottom: '20px' },
  searchInput: { width: '100%', maxWidth: '420px', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1e293b', background: '#fff' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'top' },
  actions: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  photoCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  photoThumb: { width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  photoCount: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', height: '24px', padding: '0 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '999px', fontSize: '12px', fontWeight: '700', color: '#2563eb' },
  btnView: { padding: '5px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer' },
  btnEdit: { padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' },
  btnDel: { padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#dc2626', cursor: 'pointer' },
  readonlyText: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
  info: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
};