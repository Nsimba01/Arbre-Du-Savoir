/* ---------------------------------------------------------
  Permet de gérer la structure des données de la fiche
   --------------------------------------------------------- */

import MediaLoader from "./MediaLoader";
import AudioPlayer from "./AudioPlayer";

export default function Section({ titre, audio, audioTooltip, contenu }) {

  /* ---------------------------------------------------------
     On récupère proprement le texte et les images du JSON
     contenu = { texte: "...", images: [...] }
     --------------------------------------------------------- */
  const texte = contenu?.texte || "";
  const images = contenu?.images || [];

  return (
    <section className="fiche-section">

      {/* -----------------------------------------------------
         HEADER DE LA SECTION : titre + lecteur audio
         ----------------------------------------------------- */}
      <div className="section-header">
        <h2 className="section-title">{titre}</h2>

        {/* Audio facultatif */}
        {audio && (
          <AudioPlayer 
            src={audio}
            tooltip={audioTooltip}   // Affiche l'infobulle
          />
        )}
      </div>

      {/* -----------------------------------------------------
         TEXTE DE LA SECTION
         ----------------------------------------------------- */}
      {texte && (
        <p className="section-text">
          {texte}
        </p>
      )}

      {/* -----------------------------------------------------
         IMAGES DE LA SECTION
         MediaLoader gère le responsive automatiquement
         ----------------------------------------------------- */}
      {images.length > 0 && (
        <div className="section-images">
          <MediaLoader 
            medias={images}   // tableau d'images du JSON
            type="image"      // indique à MediaLoader le type
          />
        </div>
      )}

    </section>
  );
}
