import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [residences, setResidences] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState({});
  const [recuUrls, setRecuUrls] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // ✅ year support

  const rowsPerPage = 5;

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Years dropdown: current ± 2 years
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const sanitize = (str) =>
    str.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) console.error(userError);
      setUser(user);

      const { data: resData, error: resError } = await supabase
        .from("residences")
        .select("id, nom");
      if (!resError) setResidences(resData || []);

      await fetchCotisations();
      setLoading(false);
    };
    fetchData();
  }, [selectedYear]); // ✅ refetch when year changes

  const fetchCotisations = async () => {
    const { data, error } = await supabase
      .from("cotisations")
      .select("*")
      .eq("annee", selectedYear); // ✅ filter by year

    if (!error && data) {
      setCotisations(data);

      // precompute URLs
      const urlMap = {};
      data.forEach((cot) => {
        if (cot.recu_url) {
          const { data: urlData } = supabase.storage
            .from("newrecus")
            .getPublicUrl(cot.recu_url);
          urlMap[cot.id] = urlData.publicUrl;
        }
      });
      setRecuUrls(urlMap);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

 const handleCotiser = async (residenceId, mois) => {
  const montant = window.prompt(
    `Saisir le montant de la cotisation (${mois} ${selectedYear}) pour la résidence (${residenceId}) en MAD :`
  );
  if (!montant) return;

  const paiementDate = new Date().toLocaleString("fr-FR");
  const residence = residences.find((r) => r.id === residenceId);

  // 🔹 1. Générer le PDF
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Reçu de Cotisation", 20, 20);

  doc.setFontSize(12);
  doc.text(`Résidence : KENZA`, 20, 40);
  doc.text(`Numéro Appartement : ${residenceId}`, 20, 50);
  doc.text(`Mois : ${mois}`, 20, 60);
  doc.text(`Année : ${selectedYear}`, 20, 70);
  doc.text(`Montant payé : ${montant} MAD`, 20, 80);
  doc.text(`Date de paiement : ${paiementDate}`, 20, 90);

  // 🔹 2. Convertir en Blob
  const pdfBlob = doc.output("blob");

  // 🔹 3. Définir un chemin sécurisé
  const safeMonth = mois.replace(/\s+/g, "_");
  const filePath = `${residenceId}_${safeMonth}_${selectedYear}_${Date.now()}.pdf`;

  // 🔹 4. Uploader dans Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("newrecus")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
    });

  if (uploadError) {
    alert("Erreur upload PDF : " + uploadError.message);
    return;
  }

  // 🔹 5. Insérer la cotisation avec recu_url
  const { error: insertError } = await supabase.from("cotisations").insert([
    {
      residence_id: residenceId,
      mois,
      annee: selectedYear,
      statut: "publiée",
      mode_calcul: "fixe",
      total: parseFloat(montant),
      recu_url: filePath, // ✅ lien direct vers le PDF
    },
  ]);

  if (insertError) {
    alert("Erreur insertion cotisation : " + insertError.message);
    return;
  }

  // 🔹 6. Rafraîchir
  await fetchCotisations();
};
  const handleUploadRecu = async (residenceId, mois, file) => {
    const key = `${residenceId}_${mois}_${selectedYear}`;
    setUploadStatus((prev) => ({
      ...prev,
      [key]: { status: "pending", message: "Upload en cours..." },
    }));

    const safeMonth = sanitize(mois);
    const safeName = sanitize(file.name);
    const filePath = `newrecus/${residenceId}_${safeMonth}_${selectedYear}_${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("newrecus")
      .upload(filePath, file);

    if (uploadError) {
      setUploadStatus((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Échec upload : " + uploadError.message },
      }));
      return;
    }

    const { error: updateError } = await supabase
      .from("cotisations")
      .update({ recu_url: filePath, statut: "publiée" })
      .eq("residence_id", residenceId)
      .eq("mois", mois)
      .eq("annee", selectedYear); // ✅ update for correct year

    if (updateError) {
      setUploadStatus((prev) => ({
        ...prev,
        [key]: { status: "error", message: "Erreur DB : " + updateError.message },
      }));
      return;
    }

    await fetchCotisations();
    setUploadStatus((prev) => ({
      ...prev,
      [key]: { status: "success", message: "Reçu uploadé avec succès ✅" },
    }));
  };

  // Pagination
  const totalPages = Math.ceil(residences.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentResidences = residences.slice(startIndex, startIndex + rowsPerPage);

  // Monthly totals per year
  const monthlyTotals = months.reduce((acc, mois) => {
    acc[mois] = cotisations
      .filter((c) => c.mois === mois && c.annee === selectedYear)
      .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
    return acc;
  }, {});

  if (loading) return <div className="admin-container">Chargement...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">
          Admin Dashboard - Bonjour {user?.email}
        </h2>
		
        <button onClick={handleLogout} className="logout-button">
          Déconnexion
        </button>
      </div>

     

      {/* Toggle views */}
      <div className="view-toggle">
        <button
          onClick={() => setViewMode("table")}
          className={viewMode === "table" ? "toggle-btn active" : "toggle-btn"}
        >
          Vue Table
        </button>
        <button
          onClick={() => setViewMode("cards")}
          className={viewMode === "cards" ? "toggle-btn active" : "toggle-btn"}
        >
          Vue Cartes
        </button>
		 {/* ✅ Year selector */}
      <div className="year-selector">
        <label>Année : </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Résidence</th>
                {months.map((m) => (
                  <th key={m}>
                    {m} {selectedYear}
                    <div className="budget-label">
                      Budget: {monthlyTotals[m]} MAD
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentResidences.map((res) => (
                <tr key={res.id}>
                  <td className="residence-name">{res.nom}</td>
                  {months.map((m) => {
                    const cot = cotisations.find(
                      (c) =>
                        c.residence_id === res.id &&
                        c.mois === m &&
                        c.annee === selectedYear
                    );
                    const statusKey = `${res.id}_${m}_${selectedYear}`;

                    return (
                      <td key={m}>
                        {!cot ? (
                          <button
                            onClick={() => handleCotiser(res.id, m)}
                            className="cotiser-button"
                          >
                            Cotiser
                          </button>
                        ) : (
                          <div className="cotisation-status">
                            <button
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("cotisations")
                                  .delete()
                                  .eq("id", cot.id);
                                if (error) alert("Erreur suppression : " + error.message);
                                else await fetchCotisations();
                              }}
                              className={
                                cot.statut === "Validé"
                                  ? "status-valid"
                                  : "status-pending"
                              }
                            >
                              {cot.statut || "Publié"} ({cot.total} MAD)
                            </button>

                            {cot.recu_url && recuUrls[cot.id] ? (
                              <>
                                <button
                                  onClick={() => window.open(recuUrls[cot.id], "_blank")}
                                  className="view-button"
                                >
                                  Voir reçu
                                </button>
                                <a
                                  href={recuUrls[cot.id]}
                                  download
                                  className="download-button"
                                >
                                  Télécharger
                                </a>
                              </>
                            ) : (
                              <input
                                type="file"
                                onChange={(e) =>
                                  handleUploadRecu(res.id, m, e.target.files[0])
                                }
                                className="file-input"
                              />
                            )}

                            {uploadStatus[statusKey] && (
                              <div
                                className={`upload-message ${
                                  uploadStatus[statusKey].status === "success"
                                    ? "text-green-600"
                                    : uploadStatus[statusKey].status === "error"
                                    ? "text-red-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {uploadStatus[statusKey].message}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              ⬅️ Précédent
            </button>
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Suivant ➡️
            </button>
          </div>
        </>
      )}

      {/* CARDS VIEW */}
      {viewMode === "cards" && (
        <>
          <div className="select-container">
            <label htmlFor="residence">Choisir une résidence : </label>
            <select
              id="residence"
              value={selectedResidence || ""}
              onChange={(e) => setSelectedResidence(e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              {residences.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.id} - {res.nom}
                </option>
              ))}
            </select>
          </div>

          {selectedResidence && (
            <div className="months-grid">
              {months.map((m) => {
                const cot = cotisations.find(
                  (c) =>
                    c.residence_id === parseInt(selectedResidence) &&
                    c.mois === m &&
                    c.annee === selectedYear
                );
                const statusKey = `${selectedResidence}_${m}_${selectedYear}`;

                return (
                  <div key={m} className="month-card">
                    <h4 className="month-title">{m} {selectedYear}</h4>
                    {!cot ? (
                      <button
                        onClick={() =>
                          handleCotiser(parseInt(selectedResidence), m)
                        }
                        className="cotiser-button"
                      >
                        Cotiser
                      </button>
                    ) : (
                      <div className="cotisation-status">
                        <button
                          onClick={async () => {
                            const { error } = await supabase
                              .from("cotisations")
                              .delete()
                              .eq("id", cot.id);
                            if (error) alert("Erreur suppression : " + error.message);
                            else await fetchCotisations();
                          }}
                          className={
                            cot.statut === "Validé"
                              ? "status-valid"
                              : "status-pending"
                          }
                        >
                          {cot.statut || "Publié"} ({cot.total} MAD)
                        </button>

                        {cot.recu_url && recuUrls[cot.id] ? (
                          <>
                            <button
                              onClick={() => window.open(recuUrls[cot.id], "_blank")}
                              className="view-button"
                            >
                              Voir reçu
                            </button>
                            <a
                              href={recuUrls[cot.id]}
                              download
                              className="download-button"
                            >
                              Télécharger
                            </a>
                          </>
                        ) : (
                          <input
                            type="file"
                            onChange={(e) =>
                              handleUploadRecu(
                                parseInt(selectedResidence),
                                m,
                                e.target.files[0]
                              )
                            }
                            className="file-input"
                          />
                        )}

                        {uploadStatus[statusKey] && (
                          <div
                            className={`upload-message ${
                              uploadStatus[statusKey].status === "success"
                                ? "text-green-600"
                                : uploadStatus[statusKey].status === "error"
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {uploadStatus[statusKey].message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
