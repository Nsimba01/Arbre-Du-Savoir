/* CHARGE, AFFICHE ET PROTEGE TOUS LES MEDIAS */

import AudioPlayer from "./AudioPlayer";

export default function MediaLoader({ medias = [], type }) {
  return (
    <div className="media-loader">

      {/* Images */}
      {type === "image" &&
        medias.map((src, index) => {
          const img = require(`../${src}`);
          return (
            <img
              key={index}
              src={img}
              alt=""
              className="media-image"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          );
        })}

      {/* Sons */}
      {type === "audio" &&
        medias.map((src, index) => (
          <AudioPlayer key={index} src={src} />
        ))}

      {/* Vidéos */}
      {type === "video" &&
        medias.map((src, index) => {
          const video = require(`../${src}`);
          return (
            <video
              key={index}
              src={video}
              controls
              className="media-video"
              onContextMenu={(e) => e.preventDefault()}
            />
          );
        })}

      {/* Jeux (scripts JS internes) */}
      {type === "game" &&
        medias.map((src, index) => {
          const gameScript = require(`../${src}`);

          return (
            <iframe
              key={index}
              src={gameScript}
              title={`jeu-${index}`}
              className="media-game"
              sandbox="allow-scripts"
              onContextMenu={(e) => e.preventDefault()}
            />
          );
        })}
    </div>
  );
}
