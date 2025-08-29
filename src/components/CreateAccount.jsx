import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function CreateAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [residenceId, setResidenceId] = useState("");
  const [role, setRole] = useState("locataire");
  const [loading, setLoading] = useState(false);
  const [residences, setResidences] = useState([]);

  useEffect(() => {
    const fetchResidences = async () => {
      const { data, error } = await supabase.from("residences").select("id, nom");
      if (error) {
        console.error("Erreur chargement résidences:", error.message);
      } else {
        setResidences(data);
      }
    };
    fetchResidences();
  }, []);

  const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);

  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: null, // <- disables the confirmation email
    },
  });

  if (signupError) {
    alert(signupError.message);
    setLoading(false);
    return;
  }

  const user = signupData.user;

    if (user) {
      const { error: insertError } = await supabase.from("utilisateurs").insert([
        {
          id: user.id,
          residence_id: residenceId ? Number(residenceId) : null,
          nom,
          email,
          telephone,
          role,
        },
      ]);

      if (insertError) {
        console.error("Insert profile error:", insertError.message);
        alert("Compte créé mais problème d’enregistrement du profil !");
      } else {
        alert("Compte créé avec succès. Vérifie ton email pour confirmer !");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white shadow-lg rounded-xl w-full max-w-md">
        <form onSubmit={handleSignup} className="grid gap-4 w-full">
          <input
            className="border p-2 rounded w-full"
            type="text"
            placeholder="Nom complet"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <input
            className="border p-2 rounded w-full"
            type="tel"
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
          <input
            className="border p-2 rounded w-full"
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border p-2 rounded w-full"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            className="border p-2 rounded w-full"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="locataire">Locataire</option>
            <option value="proprietaire">Propriétaire</option>
          </select>

          <select
            className="border p-2 rounded w-full"
            value={residenceId}
            onChange={(e) => setResidenceId(e.target.value)}
            required
          >
            <option value="">-- Sélectionner une résidence --</option>
            {residences.map((res) => (
              <option key={res.id} value={res.id}>
                {res.id} - {res.nom}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
