export default function ViewToggle({ viewMode, setViewMode }) {
  return (
    <div className="view-toggle">
      <button onClick={() => setViewMode("table")} className={viewMode==="table"?"toggle-btn active":"toggle-btn"}>Vue Table</button>
      <button onClick={() => setViewMode("cards")} className={viewMode==="cards"?"toggle-btn active":"toggle-btn"}>Vue Cartes</button>
    </div>
  );
}
