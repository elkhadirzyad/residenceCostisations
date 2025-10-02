import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import "./AdminDashboard.css";

import TableView from "./TableView";
import CardsView from "./CardsView";
import ViewToggle from "./ViewToggle";
import YearSelector from "./YearSelector";
import Pagination from "./Pagination";
import CreateAccount from "./CreateAccount";
import Charges from "./Charges";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [residences, setResidences] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState({});
  const [recuUrls, setRecuUrls] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const logoutTimer = useRef(null);
  const inactivityTime = 10 * 60 * 1000; // 10 minutes

  const currentMonthIndex = new Date().getMonth();

  const sanitize = (str) =>
    str.normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/\s+/g, "_")
       .replace(/[^a-zA-Z0-9._-]/g, "");

  const rowsPerPage = 8;
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // ---- AUTO LOGOUT ----
  const resetTimer = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      handleLogout();
      alert("Vous avez été déconnecté pour cause d'inactivité.");
    }, inactivityTime);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Start timer on mount
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  // ---- FETCH USER ----
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // ---- CHANGE PASSWORD ----
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage("Erreur: " + error.message);
    } else {
      const { error: updateError } = await supabase
        .from("utilisateurs")
        .update({ last_password: newPassword })
        .eq("id", user.id);

      if (updateError) {
        setPasswordMessage("Mot de passe changé mais erreur enregistrement !");
      } else {
        setPasswordMessage("✅ Mot de passe changé avec succès !");
        alert("Nouveau mot de passe: " + newPassword);
      }

      setNewPassword("");
    }
  };

  // ---- FETCH DATA ----
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: resData } = await supabase
        .from("residences")
        .select("id, nom")
        .neq("nom", "Appart admin")
        .order("id", { ascending: true });

      setResidences(resData || []);
      await fetchCotisations();
      setLoading(false);
    };
    fetchData();
  }, [selectedYear]);

  const fetchCotisations = async () => {
    const { data } = await supabase
      .from("cotisations")
      .select("*")
      .eq("annee", selectedYear);

    setCotisations(data);

    const urlMap = {};
    data.forEach((cot) => {
      if (cot.recu_url) {
        const { data: urlData } = supabase.storage
          .from("newrecus")
          .getPublicUrl(cot.recu_url);
        urlMap[cot.id] = urlData.publicUrl;
      }
    });
    setRecuUrls(urlMap);
  };

  // ---- LOGOUT ----
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login"; // redirect to login page
  };

  // ---- PAGINATION ----
  const totalPages = Math.ceil(residences.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentResidences = residences.slice(startIndex, startIndex + rowsPerPage);
  const allResidences = residences;

  if (loading) return <div className="admin-container">Chargement...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard - Bonjour {user?.email}</h2>
        <button onClick={handleLogout} className="logout-button">Déconnexion</button>
      </div>

      <div className="controls">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <YearSelector selectedYear={selectedYear} setSelectedYear={setSelectedYear} years={years} />
      </div>

      {viewMode === "table" ? (
        <>
          <TableView
            residences={currentResidences}
            allResidences={allResidences}
            cotisations={cotisations}
            months={months}
            currentMonthIndex={currentMonthIndex}
            recuUrls={recuUrls}
            uploadStatus={uploadStatus}
            selectedYear={selectedYear}
            setUploadStatus={setUploadStatus}
            fetchCotisations={fetchCotisations}
            rowsPerPage={rowsPerPage}
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
        </>
      ) : (
        <CardsView
          residences={residences}
          selectedResidence={selectedResidence}
          setSelectedResidence={setSelectedResidence}
          cotisations={cotisations}
          months={months}
          currentMonthIndex={currentMonthIndex}
          recuUrls={recuUrls}
          uploadStatus={uploadStatus}
          setUploadStatus={setUploadStatus}
          selectedYear={selectedYear}
          fetchCotisations={fetchCotisations}
        />
      )}

      <Charges
        selectedYear={selectedYear}
        months={months}
        sanitize={sanitize}
        cotisations={cotisations}
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
          <button type="submit" className="password-button">Mettre à jour</button>
        </form>
        {passwordMessage && (
          <p className={`password-message ${passwordMessage.startsWith("✅") ? "success" : "error"}`}>
            {passwordMessage}
          </p>
        )}
      </section>
    </div>
  );
}
