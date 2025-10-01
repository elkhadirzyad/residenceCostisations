import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Charges.css";

export default function Charges({ selectedYear, months, sanitize,cotisations,readonly = false }) {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({}); // ✅ messages par chargeId
  
  // Example moisData array
const moisData = [
  { moisIndex: 1, moisNom: "Janvier" },
  { moisIndex: 2, moisNom: "Février" },
  { moisIndex: 3, moisNom: "Mars" },
  { moisIndex: 4, moisNom: "Avril" },
  { moisIndex: 5, moisNom: "Mai" },
  { moisIndex: 6, moisNom: "Juin" },
  { moisIndex: 7, moisNom: "Juillet" },
  { moisIndex: 8, moisNom: "Août" },
  { moisIndex: 9, moisNom: "Septembre" },
  { moisIndex: 10, moisNom: "Octobre" },
  { moisIndex: 11, moisNom: "Novembre" },
  { moisIndex: 12, moisNom: "Décembre" },
];

// ---- TOTAL COTISATIONS PAR MOIS ----
const getCotisationsParMois = (moisNom) => {
  return cotisations
    .filter(c => c.annee === selectedYear && c.mois?.trim().toLowerCase() === moisNom.trim().toLowerCase())
    .reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
};

// ---- TOTAL CHARGES PAR MOIS ----
const getTotalParMois = (moisIndex) => {
  return charges
    .filter(c => c.mois === moisIndex)
    .reduce((sum, c) => sum + parseFloat(c.montant || 0), 0);
};




// ---- BUDGET GLOBAL ----
const getBudgetGlobal = (moisIndex, moisNom) => {
  const totalCotisations = getCotisationsParMois(moisNom);
  const totalCharges = getTotalParMois(moisIndex);
  console.log(moisNom);
  console.log(totalCotisations);
  console.log(totalCharges);
  return totalCotisations - totalCharges;
};

// ---- BUDGET GLOBAL CUMULATIF ----
const getBudgetGlobalCumul = (moisIndex) => {
  const totalCotisations = moisData
    .filter(({ moisIndex: idx }) => idx <= moisIndex)
    .reduce((sum, { moisNom }) => sum + getCotisationsParMois(moisNom), 0);

  const totalCharges = moisData
    .filter(({ moisIndex: idx }) => idx <= moisIndex)
    .reduce((sum, { moisIndex: idx }) => sum + getTotalParMois(idx), 0);

  return totalCotisations - totalCharges;
};

// ---- TOTAL ANNUEL ----
const totalCotisationsAnnee = months.reduce(
  (sum, m) => sum + getCotisationsParMois(m),
  0
);

const totalChargesAnnee = moisData.reduce(
  (sum, { moisIndex }) => sum + getTotalParMois(moisIndex),
  0
);

const budgetGlobalAnnee = totalCotisationsAnnee - totalChargesAnnee;

const currentMonth = new Date().getMonth() + 1;

// On garde seulement janvier → mois courant
const displayedMonthsData = moisData
  .filter(({ moisIndex }) => moisIndex <= currentMonth)
  .sort((a, b) => b.moisIndex - a.moisIndex); // ordre décroissant


  
  // ---- FETCH ----
  const fetchCharges = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("charges")
      .select("*")
      .eq("annee", selectedYear)
      .order("mois", { ascending: true });

    if (!error) setCharges(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCharges();
  }, [selectedYear]);

  // ---- UPLOAD JUSTIFICATIF ----
  const handleUploadJustif = async (file, chargeId) => {
    if (!file) return;

    const fileName = `${chargeId}_${sanitize(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("charges_justifs")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      setUploadMessage((prev) => ({
        ...prev,
        [chargeId]: "❌ Erreur lors de l'upload",
      }));
      return;
    }

    const { data: urlData } = supabase.storage
      .from("charges_justifs")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("charges")
      .update({ justificatif_url: urlData.publicUrl })
      .eq("id", chargeId);

    if (updateError) {
      setUploadMessage((prev) => ({
        ...prev,
        [chargeId]: "❌ Erreur lors de l'enregistrement",
      }));
    } else {
      setUploadMessage((prev) => ({
        ...prev,
        [chargeId]: "✅ Justificatif uploadé avec succès",
      }));
      fetchCharges();
    }

    // Effacer le message après 3s
    setTimeout(() => {
      setUploadMessage((prev) => {
        const copy = { ...prev };
        delete copy[chargeId];
        return copy;
      });
    }, 3000);
  };

  // ---- SUPPRIMER UNE CHARGE ----
  const handleDeleteCharge = async (chargeId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette charge ?")) return;

    const { error } = await supabase
      .from("charges")
      .delete()
      .eq("id", chargeId);

    if (error) {
      alert("❌ Erreur lors de la suppression : " + error.message);
    } else {
      fetchCharges(); // refresh la liste
    }
  };
  
  // ---- AJOUT CHARGE ----
 const handleAddCharge = async (e, moisIndex) => {
  e.preventDefault();
  const form = e.target;

  const { error } = await supabase.from("charges").insert([
    {
      mois: moisIndex,             // <- numéro du mois
      annee: selectedYear,
      type: form.type.value,
      montant: parseFloat(form.montant.value) || 0,
    },
  ]);

  if (error) {
    console.error("Erreur ajout charge :", error.message);
  } else {
    form.reset();
    fetchCharges();
  }
};



  if (loading) return <p>Chargement des charges...</p>;

  return (
    <section className="charges-section">
      <h3>Charges {selectedYear}</h3>
	   <div className="charges-summary">
    <p>
      💰 Total cotisations {selectedYear} : <strong>{totalCotisationsAnnee} DH</strong>
    </p>
    <p>
      🧾 Total charges {selectedYear} : <strong>{totalChargesAnnee} DH</strong>
    </p>
    <p>
      📊 Budget global {selectedYear} :{" "}
      <strong className={budgetGlobalAnnee < 0 ? "negative" : "positive"}>
        {budgetGlobalAnnee} DH
      </strong>
    </p>
  </div>
      <div className="charges-grid">
        {displayedMonthsData.map(({ moisIndex, moisNom }) => {
          const chargesMois = charges.filter(c => c.mois === moisIndex);
          const totalCharges = getTotalParMois(moisIndex);
          const budgetGlobal = getBudgetGlobal(moisIndex, moisNom);
          const budgetGlobalCumul = getBudgetGlobalCumul(moisIndex);
          return (
           <div
  className={`charge-card ${moisIndex === currentMonth ? "current-month" : ""}`}
  key={moisNom}
>
  <h4>{moisNom}</h4>
  <p className="charge-total">
    Total Charges : <strong>{totalCharges} DH</strong>
  </p>
  <p className="budget-global">
    Budget global (en cumulant) :{" "}
    <strong className={budgetGlobalCumul < 0 ? "negative" : "positive"}>
      {budgetGlobalCumul} DH
    </strong>
  </p>
   <p className="budget-global">
    Budget global mensuel :{" "}
    <strong className={budgetGlobal < 0 ? "negative" : "positive"}>
      {budgetGlobal} DH
    </strong>
  </p>

              {/* ✅ On affiche le formulaire seulement si pas readonly */}
              {!readonly && (
                <form onSubmit={(e) => handleAddCharge(e, moisIndex)} className="charges-form">
                  <input
  type="text"
  name="type"
  placeholder="Type de charge"
  required
/>
                  <input
                    type="number"
                    step="0.01"
                    name="montant"
                    placeholder="Montant (DH)"
                    required
                  />
                  <button type="submit">+</button>
                </form>
              )}

              {/* Liste des charges */}
              <ul className="charge-list">
                {chargesMois.length > 0 ? (
                  chargesMois.map((c) => (
                    <li key={c.id}>
                      <span>{c.type} : {c.montant} DH</span>
                      <div className="charge-actions">
                        {c.justificatif_url ? (
                          <a href={c.justificatif_url} target="_blank" rel="noreferrer">Voir</a>
                        ) : (
                          !readonly && <input type="file" onChange={(e) => handleUploadJustif(e.target.files[0], c.id)} />
                        )}
                        {!readonly && (
                          <button className="delete-btn" onClick={() => handleDeleteCharge(c.id)}>🗑</button>
                        )}
                      </div>
                      {uploadMessage[c.id] && (
                        <span className={`upload-msg ${uploadMessage[c.id].startsWith("✅") ? "success" : "error"}`}>
                          {uploadMessage[c.id]}
                        </span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="no-charge">Aucune charge</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}