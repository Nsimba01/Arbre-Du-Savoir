import React from "react";

const GameLoader = ({ src }) => {
  const gameScript = require(`../${src}`);

  return (
    <iframe
      src={gameScript}
      title="jeu"
      className="media-game"
      sandbox="allow-scripts"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default GameLoader;
