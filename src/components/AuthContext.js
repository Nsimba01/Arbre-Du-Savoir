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
  const [uid, setUid] = useState(
    () => localStorage.getItem('uid') || ''
  );

  const login = (userPseudo, userPhoto = '', userUid = '') => {
    setIsAuthenticated(true);
    setPseudo(userPseudo);
    setPhoto(userPhoto);
    setUid(userUid);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('pseudo', userPseudo);
    localStorage.setItem('photo', userPhoto);
    localStorage.setItem('uid', userUid);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPseudo('');
    setPhoto('');
    setUid('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('pseudo');
    localStorage.removeItem('photo');
    localStorage.removeItem('uid');
    window.location.href = '/home';
  };

  // Met à jour la photo (state + localStorage) sans re-déclencher tout le login
  const updatePhoto = (newPhotoUrl) => {
    setPhoto(newPhotoUrl);
    localStorage.setItem('photo', newPhotoUrl);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, pseudo, photo, uid, login, logout, updatePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};