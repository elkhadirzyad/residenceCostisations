import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./CreateAccount.css";

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
      const { data, error } = await supabase
        .from("residences")
        .select("id, nom");
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
      options: { emailRedirectTo: null },
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
    <div className="create-container">
      <div className="create-card">
        <form onSubmit={handleSignup} className="create-form">
          <input
            type="text"
            placeholder="Nom complet"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            className="create-input"
          />
          <input
            type="tel"
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="create-input"
          />
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="create-input"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="create-input"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="create-select"
          >
            <option value="locataire">Locataire</option>
            <option value="proprietaire">Propriétaire</option>
          </select>
          <select
            value={residenceId}
            onChange={(e) => setResidenceId(e.target.value)}
            required
            className="create-select"
          >
            <option value="">-- Sélectionner une résidence --</option>
            {residences.map((res) => (
              <option key={res.id} value={res.id}>
                {res.id} - {res.nom}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading} className="create-button">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
