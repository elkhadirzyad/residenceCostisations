export default function YearSelector({ selectedYear, setSelectedYear, years }) {
  return (
    <div className="year-selector">
      <label>Année : </label>
      <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
