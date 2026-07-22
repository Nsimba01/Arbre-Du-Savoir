// src/App.js
import React from 'react';
import Header from './components/Header.js';
import Fiche from './contents/components/FicheRenderer.jsx';
import './css/App.css';
import { AuthProvider } from './components/AuthContext';
import Footer from './components/Footer.js';


function App() {
  return (
    <AuthProvider>
      <div className="content">
        <Header />
        <Footer />
        
  
      </div>
    </AuthProvider>
  );
}

export default App;

