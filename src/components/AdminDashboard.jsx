import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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

  // Cotisation avec popup natif
  const handleCotiser = async (residenceId, mois) => {
    const montant = window.prompt(`Saisir le montant de la cotisation (${mois}) pour la residence (${residenceId}) en MAD :`);
    if (!montant) return; // Annulé ou vide

    const { error } = await supabase.from("cotisations").insert([
      {
        residence_id: residenceId,
        mois,
        statut: "publiée", // ⚠️ adapter selon CHECK dans ta DB
        mode_calcul: "fixe",
        total: parseFloat(montant),
      },
    ]);

    if (error) {
      alert("Erreur cotisation : " + error.message);
    } else {
      await fetchCotisations();
    }
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
      .update({ recu_url: filePath, statut: "Validé" }) // ⚠️ adapter selon CHECK
      .eq("residence_id", residenceId)
      .eq("mois", mois);

    await fetchCotisations();
  };

  // 🔹 Calcul du budget total par mois
  const monthlyTotals = months.reduce((acc, mois) => {
    acc[mois] = cotisations
      .filter((c) => c.mois === mois)
      .reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
    return acc;
  }, {});

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Admin Dashboard - Bonjour {user?.email}
        </h2>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Déconnexion
        </button>
      </div>

      {/* Tableau */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Résidence</th>
            {months.map((m) => (
              <th key={m} className="p-2 border">
                {m}
                <div className="text-xs text-gray-600">
                  Budget: {monthlyTotals[m]} MAD
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {residences.map((res) => (
            <tr key={res.id} className="border-t text-center">
              <td className="p-2 font-bold">{res.nom}</td>
              {months.map((m) => {
                const cot = cotisations.find(
                  (c) => c.residence_id === res.id && c.mois === m
                );

                return (
                  <td key={m} className="p-2">
                    {!cot ? (
                      <button
                        onClick={() => handleCotiser(res.id, m)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Cotiser
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {/* Bouton suppression / statut */}
                        <button
                          onClick={async () => {
                            const { error } = await supabase
                              .from("cotisations")
                              .delete()
                              .eq("id", cot.id);

                            if (error) {
                              alert("Erreur suppression : " + error.message);
                            } else {
                              await fetchCotisations();
                            }
                          }}
                          className={`px-2 py-1 rounded text-white ${
                            cot.statut === "Validé" ? "bg-green-600" : "bg-yellow-500"
                          }`}
                        >
                          {cot.statut || "Publié"} ({cot.total} MAD)
                        </button>

                        {/* Upload reçu */}
                        <input
                          type="file"
                          onChange={(e) =>
                            handleUploadRecu(res.id, m, e.target.files[0])
                          }
                          className="text-xs"
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
