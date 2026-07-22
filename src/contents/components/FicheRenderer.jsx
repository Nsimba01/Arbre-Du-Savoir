/* AFFICHE LE CONTENU DE LA FICHE */

import { useEffect, useState } from "react";
import Section from "../components/Section";
import MediaLoader from "../components/MediaLoader";

export default function FicheRenderer({ ficheId }) {
  const [fiche, setFiche] = useState(null);
  const [error, setError] = useState(null);

  const ficheLoaders = {
    "001": () =>
      import(
        "../fiches/06 - Numérique et informatique/001 - Découverte/fiche_06-001-001/fiche_06-001-001.json"
      ),
  };

  useEffect(() => {
    async function loadFiche() {
      setError(null);
      setFiche(null);

      const loadById = ficheLoaders[ficheId];
      if (!loadById) {
        setError("Fiche introuvable.");
        return;
      }

      try {
        const data = await loadById();
        setFiche(data.default ?? data);
      } catch (err) {
        console.error("Erreur chargement fiche :", err);
        setError("Impossible de charger cette fiche.");
      }
    }

    loadFiche();
  }, [ficheId]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!fiche) {
    return <div className="loading">Chargement…</div>;
  }

  return (
    <main className="fiche-container">
      <h1 className="fiche-title">{fiche.titre}</h1>

      {/* Affichage dynamique des sections */}
      {fiche.sections &&
        fiche.sections.map((section, index) => (
          <Section
            key={index}
            titre={section.titre}
            texte={section.texte}
            audio={section.audio}
            images={section.images}
            jeux={section.jeux}
          />
        ))}

      {/* Médias globaux éventuels */}
      {fiche.medias && (
        <div className="fiche-medias">
          <MediaLoader medias={fiche.medias} />
        </div>
      )}
    </main>
  );
}
