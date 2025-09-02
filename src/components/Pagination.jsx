export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
  return (
    <div className="pagination">
      <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}>⬅️ Précédent</button>
      <span>Page {currentPage} / {totalPages}</span>
      <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>Suivant ➡️</button>
    </div>
  );
}
