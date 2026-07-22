/* CONSTRUIT, AFFICHE ET GERE LE MENU */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await import("../data/menu.json");
        setItems(data.default);   // IMPORTANT
      } catch (err) {
        console.error("Erreur chargement menu :", err);
      }
    }

    loadMenu();
  }, []);

  const handleSelect = (id) => {
    navigate(`/fiche/${id}`);
  };

  
}
