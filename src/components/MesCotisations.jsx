import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Charges from "./Charges";
import "./MesCotisations.css";

export default function MesCotisations({ session }) {
  const [cotisations, setCotisations] = useState([]);
  const [residence, setResidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recuUrls, setRecuUrls] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // ✅ année sélectionnée
   const [user, setUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
   useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);
  
  const handleChangePassword = async (e) => {
  e.preventDefault();

  if (!newPassword || newPassword.length < 6) {
    setPasswordMessage("Le mot de passe doit contenir au moins 6 caractères");
    return;
  }

  // Update Supabase auth password
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    setPasswordMessage("Erreur: " + error.message);
  } else {
    // Save the password in utilisateurs.last_password (in plain text)
    const { data: userData, error: updateError } = await supabase
      .from("utilisateurs")
      .update({ last_password: newPassword })
      .eq("id", user.id);

    if (updateError) {
      setPasswordMessage("Mot de passe changé mais erreur enregistrement !");
    } else {
      setPasswordMessage("✅ Mot de passe changé avec succès !");
      alert("Nouveau mot de passe: " + newPassword); // show the new password
    }

    setNewPassword("");
  }
};

  // ✅ années disponibles (ex: -2, current, +2)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 🔹 Récupérer la résidence du résident
      const { data: profil, error: profilError } = await supabase
        .from("utilisateurs")
        .select("residence_id, residences(nom)")
        .eq("id", session.id)
        .single();

      if (profilError) {
        console.error(profilError);
        setLoading(false);
        return;
      }

      setResidence(profil.residences);

      // 🔹 Récupérer les cotisations liées à sa résidence + année
      const { data: cotData, error: cotError } = await supabase
        .from("cotisations")
        .select("*")
        .eq("residence_id", profil.residence_id)
        .eq("annee", selectedYear); // ✅ filtre année

      if (cotError) {
        console.error(cotError);
      } else {
        setCotisations(cotData || []);

        // ✅ Préparer les URLs des reçus
        const urls = {};
        cotData.forEach((cot) => {
          if (cot.recu_url) {
            const { data: urlData } = supabase.storage
              .from("newrecus")
              .getPublicUrl(cot.recu_url);
            urls[cot.id] = urlData.publicUrl;
          }
        });
        setRecuUrls(urls);
      }

      setLoading(false);
    };

    fetchData();
  }, [session, selectedYear]); // ✅ recharge quand année change

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="cotisations-container">Chargement...</div>;

  return (
    <div className="cotisations-container">
      {/* Header */}
      <div className="cotisations-header">
        <h2 className="cotisations-title">
          Mes cotisations - Résidence KENZA-Appart-{residence?.nom}
        </h2>
        <button onClick={handleLogout} className="logout-button">
          Déconnexion
        </button>
      </div>

      {/* ✅ Sélecteur d’année */}
      <div className="year-selector">
        <label>Année : </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tableau cotisations */}
      <table className="cotisations-table">
        <thead>
          <tr>
            {months.map((m) => (
              <th key={m}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {months.map((m) => {
              const cot = cotisations.find(
                (c) => c.mois === m && c.annee === selectedYear
              );
              if (!cot) return <td key={m} className="status-empty">-</td>;

              return (
                <td key={m}>
                  <span
                    className={`status-badge ${
                      cot.statut === "valide" ? "status-valide" : "status-pending"
                    }`}
                  >
                    {cot.statut} || {cot.total} DH
                  </span>

                  {/* ✅ Boutons reçus */}
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
                    <div> </div>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
	  
<Charges
  selectedYear={selectedYear}
  months={months}
  sanitize={(str) => str.replace(/[^a-z0-9]/gi, "_").toLowerCase()} // petit helper
  cotisations={cotisations}
  readonly={true} // ✅ consultation seulement
/>
	  <section className="change-password-section">
        <h3>Changer mon mot de passe</h3>
        <form onSubmit={handleChangePassword} className="change-password-form">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="password-input"
          />
          <button type="submit" className="password-button">
            Mettre à jour
          </button>
        </form>
        {/* ✅ Display feedback message here */}
      {passwordMessage && (
    <p
      className={`password-message ${
        passwordMessage.startsWith("✅") ? "success" : "error"
      }`}
    >
      {passwordMessage}
    </p>
  )}
      </section>
    </div>
  );
}
