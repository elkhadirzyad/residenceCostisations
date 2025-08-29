import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import MesCotisations from "./components/MesCotisations";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Récupérer la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écouter les changements (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si pas connecté → Auth
 // if (!session) {
    return <Auth />;
  //}

  // Si connecté → Page principale
  //return <MesCotisations />;
}

export default App;
