/**
 * Pagination — composant réutilisable
 *
 * Props :
 *   page        {number}   page courante (1-based)
 *   totalPages  {number}   nombre total de pages
 *   total       {number}   nombre total d'éléments
 *   pageSize    {number}   éléments par page
 *   onChange    {fn}       (newPage) => void
 */
export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Build page numbers with ellipsis
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)             pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div style={s.wrap}>
      <span style={s.info}>
        Affichage <strong>{from}–{to}</strong> sur <strong>{total}</strong>
      </span>
      <div style={s.controls}>
        <button
          style={{ ...s.btn, ...(page === 1 ? s.btnDisabled : {}) }}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          ‹ Préc.
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} style={s.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              style={{ ...s.btn, ...(p === page ? s.btnActive : {}) }}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          style={{ ...s.btn, ...(page === totalPages ? s.btnDisabled : {}) }}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          Suiv. ›
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap', gap: '10px' },
  info:       { fontSize: '13px', color: '#64748b' },
  controls:   { display: 'flex', alignItems: 'center', gap: '4px' },
  btn:        { padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '500', cursor: 'pointer', minWidth: '36px', textAlign: 'center' },
  btnActive:  { background: '#2563eb', color: '#fff', borderColor: '#2563eb', fontWeight: '700' },
  btnDisabled:{ opacity: 0.4, cursor: 'not-allowed' },
  ellipsis:   { padding: '5px 4px', color: '#94a3b8', fontSize: '13px' },
};

