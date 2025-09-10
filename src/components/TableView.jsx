import { useState } from "react";
import CotisationCell from "./CotisationCell";
import "./TableView.css";

export default function TableView({
  residences, allResidences, cotisations, months, recuUrls,
  uploadStatus, setUploadStatus, selectedYear, fetchCotisations, currentMonthIndex
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Calcul total par mois
  const monthlyTotals = months.reduce((acc, mois) => {
    acc[mois] = cotisations
      .filter(c => c.mois === mois && c.annee === selectedYear)
      .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
    return acc;
  }, {});

  // Fermer popup
  const closeDialog = () => setSelectedMonth(null);

  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Résidence</th>
            {months.map((m, index) => (
              <th
                key={m}
                className={index === currentMonthIndex ? "highlight-month" : ""}
                onClick={() => setSelectedMonth(m)}   // 👈 click sur colonne
                style={{ cursor: "pointer" }}
              >
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
              {months.map((m, index) => {
                const cot = cotisations.find(
                  c => c.residence_id === res.id && c.mois === m && c.annee === selectedYear
                );
                return (
                  <CotisationCell
                    key={m}
                    className={index === currentMonthIndex ? "highlight-month" : ""}
                    residence={res}
                    mois={m}
                    cotisation={cot}
                    selectedYear={selectedYear}
                    recuUrls={recuUrls}
                    uploadStatus={uploadStatus}
                    setUploadStatus={setUploadStatus}
                    fetchCotisations={fetchCotisations}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- POPUP --- */}
      {selectedMonth && (
        <dialog open className="popup-dialog">
          <h3>{selectedMonth} {selectedYear}</h3>

          {/* résidences qui ont cotisé */}
          <h4>✅ Résidences qui ont cotisé :</h4>
          <ul className="two-columns">
            {allResidences
              .filter(res =>
                cotisations.some(
                  c => c.residence_id === res.id &&
                       c.mois === selectedMonth &&
                       c.annee === selectedYear
                )
              )
              .map(res => <li key={res.id}>{res.nom}</li>)}
          </ul>

          {/* résidences qui n’ont pas cotisé */}
          <h4>❌ Résidences qui n’ont pas cotisé :</h4>
          <ul className="two-columns">
            {allResidences
              .filter(res =>
                !cotisations.some(
                  c => c.residence_id === res.id &&
                       c.mois === selectedMonth &&
                       c.annee === selectedYear
                )
              )
              .map(res => <li key={res.id}>{res.nom}</li>)}
          </ul>

          <button onClick={closeDialog}>Fermer</button>
        </dialog>
      )}
    </div>
  );
}
