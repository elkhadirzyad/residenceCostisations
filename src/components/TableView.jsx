import CotisationCell from "./CotisationCell";

export default function TableView({
  residences, cotisations, months, recuUrls,
  uploadStatus, setUploadStatus, selectedYear, fetchCotisations
}) {

  // Calcul total par mois
  const monthlyTotals = months.reduce((acc, mois) => {
    acc[mois] = cotisations
      .filter(c => c.mois === mois && c.annee === selectedYear)
      .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
    return acc;
  }, {});

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Résidence</th>
          {months.map(m => (
            <th key={m}>
              {m} {selectedYear}
              <div className="budget-label">Budget: {monthlyTotals[m]} MAD</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {residences.map(res => (
          <tr key={res.id}>
            <td className="residence-name">{res.nom}</td>
            {months.map(m => {
              const cot = cotisations.find(c => c.residence_id === res.id && c.mois === m && c.annee === selectedYear);
              return <CotisationCell
                key={m}
                residence={res}
                mois={m}
                cotisation={cot}
                selectedYear={selectedYear}
                recuUrls={recuUrls}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                fetchCotisations={fetchCotisations}
              />;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
