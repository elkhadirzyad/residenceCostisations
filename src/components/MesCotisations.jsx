import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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
    window.location.reload(); // 👈 recharge la page pour retourner sur l'écran de login
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="p-6">
      {/* Header avec bouton signout */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          Mes cotisations - Résidence {residence?.nom}
        </h2>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Déconnexion
        </button>
      </div>

      {/* Tableau cotisations */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            {months.map((m) => (
              <th key={m} className="p-2 border">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            {months.map((m) => {
              const cot = cotisations.find((c) => c.mois === m);
              return (
                <td key={m} className="p-2 border">
                  {!cot ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        cot.statut === "valide"
                          ? "bg-green-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {cot.statut}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
