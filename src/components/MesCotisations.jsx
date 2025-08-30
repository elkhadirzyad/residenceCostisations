import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./MesCotisations.css";

export default function MesCotisations({ session }) {
  const [cotisations, setCotisations] = useState([]);
  const [residence, setResidence] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Récupérer la résidence du résident
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

      // Récupérer les cotisations liées à sa résidence
      const { data: cotData, error: cotError } = await supabase
        .from("cotisations")
        .select("*")
        .eq("residence_id", profil.residence_id);

      if (cotError) console.error(cotError);
      else setCotisations(cotData || []);

      setLoading(false);
    };

    fetchData();
  }, [session]);

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
          Mes cotisations - Résidence {residence?.nom}
        </h2>
        <button onClick={handleLogout} className="logout-button">
          Déconnexion
        </button>
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
              const cot = cotisations.find((c) => c.mois === m);
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
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
