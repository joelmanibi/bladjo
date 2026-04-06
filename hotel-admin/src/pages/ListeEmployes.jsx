import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const POSITION_FILTERS = ['Réceptionniste', 'Femme de ménage', 'Gérant', 'Assistant'];

export default function ListeEmployes() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('');

  const fetchEmployees = () => {
    setLoading(true);
    setError('');
    api.get('/employees')
      .then((r) => setEmployees(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);

  // All distinct positions from loaded data (for dynamic filter chips)
  const allPositions = useMemo(() => {
    const set = new Set(employees.map((e) => e.position));
    return Array.from(set).sort();
  }, [employees]);

  const displayed = filter
    ? employees.filter((e) => e.position === filter)
    : employees;

  const handleDelete = async (emp) => {
    if (!window.confirm(`Supprimer l'employé "${emp.name}" ?`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      fetchEmployees();
    } catch (e) {
      alert(e.response?.data?.message || 'Suppression impossible');
    }
  };

  return (
    <AdminLayout title="Employés">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.pageTitle}>Gestion des employés</h3>
          <p style={styles.subtitle}>{employees.length} employé(s)</p>
        </div>
        <button onClick={() => navigate('/employees/new')} style={styles.addBtn}>
          + Ajouter un employé
        </button>
      </div>

      {/* Position filter chips */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setFilter('')}
          style={{ ...styles.filterBtn, ...(filter === '' ? styles.filterBtnActive : {}) }}
        >
          Tous
        </button>
        {allPositions.map((pos) => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            style={{ ...styles.filterBtn, ...(filter === pos ? styles.filterBtnActive : {}) }}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.card}>
        {loading && <p style={styles.info}>Chargement...</p>}
        {error   && <p style={styles.errorMsg}>{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p style={styles.info}>Aucun employé trouvé.</p>
        )}
        {!loading && displayed.length > 0 && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['#', 'Nom', 'Téléphone', 'Poste', 'Salaire', 'Actions'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((emp) => (
                  <tr key={emp.id} style={styles.tr}>
                    <td style={styles.td}><span style={styles.idBadge}>#{emp.id}</span></td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <span style={styles.avatar}>{emp.name.charAt(0).toUpperCase()}</span>
                        <strong>{emp.name}</strong>
                      </div>
                    </td>
                    <td style={styles.td}>{emp.phone}</td>
                    <td style={styles.td}>
                      <span style={styles.posBadge}>{emp.position}</span>
                    </td>
                    <td style={styles.td}>
                      <strong>{Number(emp.salary).toLocaleString('fr-FR')} FCFA</strong>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          onClick={() => navigate(`/employees/${emp.id}/edit`)}
                          style={styles.btnEdit}
                        >
                          ✏ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          style={styles.btnDelete}
                        >
                          🗑 Supprimer
                        </button>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle:   { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' },
  subtitle:    { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn: {
    padding: '10px 20px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  filterBar:       { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn:       { padding: '6px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer' },
  filterBtnActive: { background: '#2563eb', borderColor: '#2563eb', color: '#fff' },
  card:      { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: '640px' },
  th: {
    padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
    background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
  },
  tr:      { borderBottom: '1px solid #f1f5f9' },
  td:      { padding: '12px 16px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
  idBadge: { display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: '#dbeafe', color: '#1e40af',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', flexShrink: 0,
  },
  posBadge: {
    display: 'inline-block', padding: '3px 10px', background: '#f0fdf4',
    color: '#166534', border: '1px solid #86efac',
    borderRadius: '20px', fontSize: '12px', fontWeight: '600',
  },
  actions:   { display: 'flex', gap: '6px' },
  btnEdit: {
    padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd',
    borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#0369a1', cursor: 'pointer',
  },
  btnDelete: {
    padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#dc2626', cursor: 'pointer',
  },
  info:     { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
  errorMsg: { padding: '16px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', margin: '16px', fontSize: '14px' },
};

