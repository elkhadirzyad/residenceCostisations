import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import "./AdminDashboard.css";

import TableView from "./TableView";
import CardsView from "./CardsView";
import ViewToggle from "./ViewToggle";
import YearSelector from "./YearSelector";
import Pagination from "./Pagination";
import CreateAccount from "./CreateAccount";

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
  
  const sanitize = (str) =>
  str.normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/\s+/g, "_")
     .replace(/[^a-zA-Z0-9._-]/g, "");

  const rowsPerPage = 5;
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // ---- FETCH DATA ----
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: resData } = await supabase.from("residences").select("id, nom");
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
  const handleLogout = async () => await supabase.auth.signOut();

  // ---- Pagination ----
  const totalPages = Math.ceil(residences.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentResidences = residences.slice(startIndex, startIndex + rowsPerPage);

  if (loading) return <div className="admin-container">Chargement...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard - Bonjour {user?.email}</h2>

        <button onClick={handleLogout} className="logout-button">Déconnexion</button>
      </div>
      <YearSelector selectedYear={selectedYear} setSelectedYear={setSelectedYear} years={years} />
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      
      {viewMode === "table" ? (
        <>
          <TableView
            residences={currentResidences}
            cotisations={cotisations}
            months={months}
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
          recuUrls={recuUrls}
          uploadStatus={uploadStatus}
          setUploadStatus={setUploadStatus}
          selectedYear={selectedYear}
          fetchCotisations={fetchCotisations}
        />
      )
	  }

    </div>
  );
}
