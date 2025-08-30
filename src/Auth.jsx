import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import MesCotisations from "./components/MesCotisations";
import AdminDashboard from "./components/AdminDashboard"; // dashboard global pour admin
import CreateAccount from "./components/CreateAccount";
import "./authForm.css";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [session, setSession] = useState(null);

  // check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) checkUserRole(data.session.user);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkUserRole(session.user);
      else setSession(null);
    });

    return () => subscription?.subscription.unsubscribe();
  }, []);

  // Récupérer le rôle depuis la table utilisateurs
  const checkUserRole = async (user) => {
    setLoading(true);
    const { data: profil, error: profilError } = await supabase
      .from("utilisateurs")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profilError) {
      console.error("Erreur récupération rôle:", profilError.message);
      setSession(user); // fallback si erreur
    } else {
      setSession({ ...user, role: profil.role });
    }
    setLoading(false);
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    const user = authData.user;
    await checkUserRole(user);
    setLoading(false);
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  //Redirection selon rôle
  if (session) {
    return session.role == "admin" ? <AdminDashboard /> : <MesCotisations session={session}/>;
  }

  return (
   <div
className="auth-container"
>
  <div
   className="auth-card"
  >
    <h2
      className="auth-title"
    >
      {isSignup ? "Créer un compte" : "Connexion"}
    </h2>

    {isSignup ? (
      <CreateAccount />
    ) : (
      <form
        onSubmit={handleLogin}
         className="auth-form"
      >
        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
         className="auth-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="auth-button"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    )}

    <div className="auth-footer">
      {isSignup ? (
        <p>
          Déjà un compte ?{" "}
          <button
            onClick={() => setIsSignup(false)}
            className="auth-footer"
          >
            Se connecter
          </button>
        </p>
      ) : (
        <p>
          Pas encore de compte ?{" "}
          <button
            onClick={() => setIsSignup(true)}
          >
            S’inscrire
          </button>
        </p>
      )}
    </div>
  </div>
</div>

  );
}
