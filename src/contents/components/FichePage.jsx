/* AFFICHE LA PAGE COMPLETE DE LA FICHE */

import { useState } from "react";
import Menu from "../components/Menu";
import FicheRenderer from "../components/FicheRenderer";

export default function FichePage() {
  const [ficheId, setFicheId] = useState("001");

  return (
    <div className="layout">
      <Menu onSelectFiche={setFicheId} />
      <FicheRenderer ficheId={ficheId} />
    </div>
  );
}
