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

  const login = (userPseudo) => {
    setIsAuthenticated(true);
    setPseudo(userPseudo);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('pseudo', userPseudo); 
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPseudo('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('pseudo');
    window.location.href = '/home';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, pseudo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};