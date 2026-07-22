import React, { useContext, useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom';

import { FaPowerOff } from "react-icons/fa";

import MainContent   from './MainContent';
import Connexion     from './Connexion';
import LoginHover    from './LoginHover';
import Creation      from './Creation';
import ResetPassword from './ResetPassword';
import ResetPwdReady from './ResetPwdReady';
import ProfileModal  from './ProfileModal';
import FichePage     from '../contents/components/FichePage';
import { AuthContext } from './AuthContext';

import logos             from '../medias/logo.png';
import btn_off_connexion from '../medias/connexion_off.png';
import btn_on_connexion  from '../medias/connexion_on.png';

const LARGE_SCREEN_BREAKPOINT = 1009;

function Header() {
  const { isAuthenticated, logout } = useContext(AuthContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHovered,      setIsHovered]      = useState(false);
  const [isZoomOut,      setIsZoomOut]      = useState(false);
  const [isLargeScreen,  setIsLargeScreen]  = useState(
    () => window.innerWidth >= LARGE_SCREEN_BREAKPOINT
  );
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const scale = window.visualViewport?.scale ?? window.devicePixelRatio;
      setIsZoomOut(scale < 1);
      setIsLargeScreen(window.innerWidth >= LARGE_SCREEN_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isLargeScreen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown')) setIsDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLargeScreen]);

  const toggleDropdown = (e) => {
    if (!isLargeScreen) {
      e.preventDefault();
      e.stopPropagation();
      setIsDropdownOpen(prev => !prev);
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsHovered(false);
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
    setIsDropdownOpen(false);
    setIsHovered(false);
  };

  const showDropdown = isLargeScreen ? isHovered : isDropdownOpen;

  return (
    <Router>

      <div className="row">

        {/* LOGO */}
        <div className="col">
          <Link to="/home" className="header-logo-link">
            <img
              src={logos}
              className="bloc_titre_logo"
              alt="logo"
              onContextMenu={e => e.preventDefault()}
            />
          </Link>
        </div>

        {/* TITRE */}
        <div className="col" id="button2">
          <h1 className="titre">Arbre du Savoir</h1>
        </div>

        {/* BOUTON CONNEXION */}
        <div className="col" style={{ position: 'relative' }}>
          <div
            className="dropdown"
            onMouseEnter={() => isLargeScreen && setIsHovered(true)}
            onMouseLeave={() => isLargeScreen && setIsHovered(false)}
          >
            {isAuthenticated ? (
              <div
                className="button_espace"
                onClick={toggleDropdown}
                style={{ cursor: 'pointer' }}
              >
                <img
                  className="bloc_titre_boutonespace_image"
                  src={btn_on_connexion}
                  alt="bouton-space"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <Link to="/connexion">
                <div className="button_espace">
                  <img
                    className="bloc_titre_boutonespace_image"
                    src={btn_off_connexion}
                    alt="bouton-space"
                    style={{ width: '100%', height: '100%' }}
                    onContextMenu={e => e.preventDefault()}
                  />
                </div>
              </Link>
            )}

            {/* DROPDOWN */}
            {showDropdown && (
              <div className={`dropdown-content-wrapper${isAuthenticated ? ' dropdown-content-wrapper--auth' : ''}`}>
                {isAuthenticated ? (
                  <div className="dropdown-content-deconnexion">

                    {/* Bouton Mon profil */}
                    <button
                      onClick={handleOpenProfile}
                      style={{
                        display:      'block',
                        width:        '100%',
                        marginBottom: '8px',
                        borderRadius: '7px',
                        padding:      '5px 10px',
                        cursor:       'pointer',
                        textAlign:    'center',
                        fontSize:     '14px',
                        height:   'auto',      // ← s'adapte au contenu
                        overflow: 'visible'
                        
                      }}
                      id="MonProfilButton"
                      title='Afficher mon profil'
                    >
                      Mon profil
                    </button>

                    {/* Bouton Déconnexion */}
                 <button
                          onClick={handleLogout}
                          style={{ 
                            borderRadius: '7px', 
                           
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',  // optionnel, pour centrer aussi horizontalement
                          }}
                          title="Déconnexion"
                        >
                          <FaPowerOff
                            size={16}
                            color="#161616"
                            style={{ cursor: "pointer" }}
                          />
                </button>

                  </div>
                ) : (
                  <LoginHover />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROUTES */}
      <Routes>
        <Route path="/home"              element={<MainContent />}   />
        <Route path="/connexion"         element={<Connexion />}     />
        <Route path="/creation"          element={<Creation />}      />
        <Route path="/reset_password"    element={<ResetPassword />} />
        <Route path="/reset-pwd-process" element={<ResetPwdReady />} />
        <Route path="/fiche/001"         element={<FichePage />}     />
        <Route path="/"                  element={<Navigate to="/home" />} />
      </Routes>

      {/* MODALE PROFIL */}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

    </Router>
  );
}

export default Header;