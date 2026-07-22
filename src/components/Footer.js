import React, { useState } from 'react';
import '../css/footer.css';

function Footer() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFooter = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Bouton pour ouvrir/fermer le footer (visible uniquement sur mobile) */}
      <button 
        className="footer-toggle-btn" 
        onClick={toggleFooter}
        aria-label={isOpen ? "Fermer le footer" : "Ouvrir le footer"}
      >
        {isOpen ? '✕' : 'Infos'}
      </button>

      <footer className={`footer ${isOpen ? 'footer-open' : 'footer-closed'}`}>
        <div className="footer-content">
          <div className="footer-position">
            <div className="title-design">Présentation</div>
            <p>Qui sommes nous ?</p>
            <p>Notre mission</p>
          </div>
          
          <div className="footer-position">
            <div className="title-design">Informations légales</div>
            <p>Conditions générales</p>
            <p>Politique de confidentialité</p>
            <p>Gestion de cookies</p>
          </div>
          
          <div className="footer-position">
            <div className="title-design">Partenaires</div>
            <p>Nos partenaires</p>
            <p>Devenir partenaires</p>
            <p>Nous aider</p>
          </div>
          
          <div className="footer-position">
            <div className="title-design">Aide et contact</div>
            <p>Prise en main</p>
            <p>Contact</p>
          </div>
        </div>
        
        <div className="footer-legal">
          ©2024 arbredusavoir.fr  <br/>(tous droits réservés)
        </div>
      </footer>
    </>
  );
}

export default Footer;