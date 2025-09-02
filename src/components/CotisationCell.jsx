import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import { sanitize } from "./sanitize";

export default function CotisationCell({
  residence,
  mois,
  cotisation,
  selectedYear,
  recuUrls,
  uploadStatus,
  setUploadStatus,
  fetchCotisations,
}) {

  const handleCotiser = async () => {
    const montant = window.prompt(`Saisir le montant de la cotisation (${mois} ${selectedYear}) pour la résidence (${residence.id}) en MAD :`);
    if (!montant) return;

    const paiementDate = new Date().toLocaleString("fr-FR");

    // 1️⃣ Générer PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reçu de Cotisation", 20, 20);
    doc.setFontSize(12);
    doc.text(`Résidence : ${residence.nom}`, 20, 40);
    doc.text(`Numéro Appartement : ${residence.id}`, 20, 50);
    doc.text(`Mois : ${mois}`, 20, 60);
    doc.text(`Année : ${selectedYear}`, 20, 70);
    doc.text(`Montant payé : ${montant} MAD`, 20, 80);
    doc.text(`Date de paiement : ${paiementDate}`, 20, 90);

    const pdfBlob = doc.output("blob");

    const safeMonth = sanitize(mois);
    const filePath = `${residence.id}_${safeMonth}_${selectedYear}_${Date.now()}.pdf`;

    // 2️⃣ Upload PDF
    const { error: uploadError } = await supabase.storage.from("newrecus").upload(filePath, pdfBlob, {
      contentType: "application/pdf",
    });
    if (uploadError) return alert("Erreur upload PDF : " + uploadError.message);

    // 3️⃣ Inserer cotisation
    const { error: insertError } = await supabase.from("cotisations").insert([{
      residence_id: residence.id,
      mois,
      annee: selectedYear,
      statut: "publiée",
      mode_calcul: "fixe",
      total: parseFloat(montant),
      recu_url: filePath,
    }]);
    if (insertError) return alert("Erreur insertion cotisation : " + insertError.message);

    await fetchCotisations();
  };

  const handleUploadRecu = async (file) => {
    const key = `${residence.id}_${mois}_${selectedYear}`;
    setUploadStatus(prev => ({ ...prev, [key]: { status: "pending", message: "Upload en cours..." }}));

    const safeMonth = sanitize(mois);
    const safeName = sanitize(file.name);
    const filePath = `newrecus/${residence.id}_${safeMonth}_${selectedYear}_${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage.from("newrecus").upload(filePath, file);
    if (uploadError) return setUploadStatus(prev => ({ ...prev, [key]: { status: "error", message: "Échec upload : " + uploadError.message }}));

    const { error: updateError } = await supabase.from("cotisations").update({ recu_url: filePath, statut: "publiée" })
      .eq("residence_id", residence.id).eq("mois", mois).eq("annee", selectedYear);
    if (updateError) return setUploadStatus(prev => ({ ...prev, [key]: { status: "error", message: "Erreur DB : " + updateError.message }}));

    await fetchCotisations();
    setUploadStatus(prev => ({ ...prev, [key]: { status: "success", message: "Reçu uploadé ✅" }}));
  };

  const statusKey = `${residence.id}_${mois}_${selectedYear}`;

  return (
    <td>
      {!cotisation ? (
        <button onClick={handleCotiser} className="cotiser-button">Cotiser</button>
      ) : (
        <div className="cotisation-status">
          <button
            onClick={async () => {
              const { error } = await supabase.from("cotisations").delete().eq("id", cotisation.id);
              if (error) alert("Erreur suppression : " + error.message);
              else await fetchCotisations();
            }}
            className={cotisation.statut === "Validé" ? "status-valid" : "status-pending"}
          >
            {cotisation.statut || "Publié"} ({cotisation.total} MAD)
          </button>

          {cotisation.recu_url && recuUrls[cotisation.id] ? (
            <>
              <button onClick={() => window.open(recuUrls[cotisation.id], "_blank")} className="view-button">Voir reçu</button>
              <a href={recuUrls[cotisation.id]} download className="download-button">Télécharger</a>
            </>
          ) : (
            <input type="file" onChange={(e) => handleUploadRecu(e.target.files[0])} className="file-input" />
          )}

          {uploadStatus[statusKey] && (
            <div className={`upload-message ${
              uploadStatus[statusKey].status === "success" ? "text-green-600" :
              uploadStatus[statusKey].status === "error" ? "text-red-600" : "text-gray-500"
            }`}>
              {uploadStatus[statusKey].message}
            </div>
          )}
        </div>
      )}
    </td>
  );
}
