import CotisationCell from "./CotisationCell";

export default function CardsView({
  residences, selectedResidence, setSelectedResidence,
  cotisations, months, recuUrls, uploadStatus, setUploadStatus,
  selectedYear, fetchCotisations
}) {
  return (
    <>
      <div className="select-container">
        <label htmlFor="residence">Choisir une résidence : </label>
        <select
          id="residence"
          value={selectedResidence || ""}
          onChange={(e) => setSelectedResidence(e.target.value)}
        >
          <option value="">-- Sélectionner --</option>
          {residences.map(res => (
            <option key={res.id} value={res.id}>{res.id} - {res.nom}</option>
          ))}
        </select>
      </div>

      {selectedResidence && (
        <div className="months-grid">
          {months.map(m => {
            const cot = cotisations.find(c => c.residence_id === parseInt(selectedResidence) && c.mois === m && c.annee === selectedYear);
            const residence = residences.find(r => r.id === parseInt(selectedResidence));

            return (
              <div key={m} className="month-card">
                <h4 className="month-title">{m} {selectedYear}</h4>
                <table>
                  <tbody>
                    <tr>
                      <CotisationCell
                        residence={residence}
                        mois={m}
                        cotisation={cot}
                        selectedYear={selectedYear}
                        recuUrls={recuUrls}
                        uploadStatus={uploadStatus}
                        setUploadStatus={setUploadStatus}
                        fetchCotisations={fetchCotisations}
                      />
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
