/* GERE LA LECTURE AUDIO D'UNE FICHE */

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Charge le fichier audio depuis /src/contents
  useEffect(() => {
    try {
      const audioFile = require(`../${src}`);
      audioRef.current = new Audio(audioFile);
    } catch (err) {
      console.error(`Audio introuvable: ${src}`, err);
      audioRef.current = null;
      setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [src]);

  const playAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setIsPlaying(true);

    audioRef.current.onended = () => {
      setIsPlaying(false);
    };
  };

  const pauseAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return (
    <span className="audio-player">

      {/* Icône dynamique */}
      {!isPlaying && (
        <span
          className="audio-icon"
          onClick={playAudio}
        >
          🔊
        </span>
      )}

      {isPlaying && (
        <>
          <span
            className="audio-pause"
            onClick={pauseAudio}
          >
            ⏸️
          </span>

          <span
            className="audio-stop"
            onClick={stopAudio}
            style={{ color: "red" }}
          >
            🔇
          </span>
        </>
      )}
    </span>
  );
}
