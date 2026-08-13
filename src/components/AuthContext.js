import React, { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('isAuthenticated') === 'true'
  );
  const [pseudo, setPseudo] = useState(
    () => localStorage.getItem('pseudo') || ''
  );
  const [photo, setPhoto] = useState(
    () => localStorage.getItem('photo') || ''
  );

  const login = (userPseudo, userPhoto = '') => {
    setIsAuthenticated(true);
    setPseudo(userPseudo);
    setPhoto(userPhoto);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('pseudo', userPseudo);
    localStorage.setItem('photo', userPhoto);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPseudo('');
    setPhoto('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('pseudo');
    localStorage.removeItem('photo');
    window.location.href = '/home';
  };

  // Met à jour la photo (state + localStorage) sans re-déclencher tout le login
  const updatePhoto = (newPhotoUrl) => {
    setPhoto(newPhotoUrl);
    localStorage.setItem('photo', newPhotoUrl);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, pseudo, photo, login, logout, updatePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};