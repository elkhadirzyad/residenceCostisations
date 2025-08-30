import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [residences, setResidences] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) console.error(userError);
      setUser(user);

      const { data: resData, error: resError } = await supabase
        .from("residences")
        .select("id, nom");
      if (resError) console.error(resError);
      else setResidences(resData || []);

      const { data: cotData, error: cotError } = await supabase
        .from("cotisations")
        .select("*");
      if (cotError) console.error(cotError);
      else setCotisations(cotData || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchCotisations = async () => {
    const { data, error } = await supabase.from("cotisations").select("*");
    if (!error) setCotisations(data || []);
  };

  const handleCotiser = async (residenceId, mois) => {
    const montant = window.prompt(
      `Saisir le montant de la cotisation (${mois}) pour la residence (${residenceId}) en MAD :`
    );
    if (!montant) return;

    const { error } = await supabase.from("cotisations").insert([
      {
        residence_id: residenceId,
        mois,
        statut: "publiée",
        mode_calcul: "fixe",
        total: parseFloat(montant),
      },
    ]);

    if (error) alert("Erreur cotisation : " + error.message);
    else await fetchCotisations();
  };

  const handleUploadRecu = async (residenceId, mois, file) => {
    const filePath = `recus/${residenceId}_${mois}_${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("recus")
      .upload(filePath, file);

    if (uploadError) {
      alert("Erreur upload reçu : " + uploadError.message);
      return;
    }

    await supabase
      .from("cotisations")
      .update({ recu_url: filePath, statut: "Validé" })
      .eq("residence_id", residenceId)
      .eq("mois", mois);

    await fetchCotisations();
  };

  const monthlyTotals = months.reduce((acc, mois) => {
    acc[mois] = cotisations
      .filter((c) => c.mois === mois)
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

      <table className="admin-table">
        <thead>
          <tr>
            <th>Résidence</th>
            {months.map((m) => (
              <th key={m}>
                {m}
                <div style={{ fontSize: "0.75rem", color: "#4b5563" }}>
                  Budget: {monthlyTotals[m]} MAD
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {residences.map((res) => (
            <tr key={res.id}>
              <td style={{ fontWeight: "bold" }}>{res.nom}</td>
              {months.map((m) => {
                const cot = cotisations.find(
                  (c) => c.residence_id === res.id && c.mois === m
                );

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
                          className={`${
                            cot.statut === "Validé"
                              ? "status-valid"
                              : "status-pending"
                          }`}
                        >
                          {cot.statut || "Publié"} ({cot.total} MAD)
                        </button>
                        <input
                          type="file"
                          onChange={(e) =>
                            handleUploadRecu(res.id, m, e.target.files[0])
                          }
                          className="file-input"
                        />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
