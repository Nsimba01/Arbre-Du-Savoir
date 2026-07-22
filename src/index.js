
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeApp } from "firebase/app";

import 'firebase/auth'; // Importez le module d'authentification Firebase



const firebaseConfig = {
  apiKey: "AIzaSyAp3Dnc8N0Ud4A9XOLYoGakcAXl_q1m6rg",
  authDomain: "cours-pour-petits.firebaseapp.com",
  databaseURL: "https://cours-pour-petits-default-rtdb.firebaseio.com",
  projectId: "cours-pour-petits",
  storageBucket: "cours-pour-petits.appspot.com",
  messagingSenderId: "925799572042",
  appId: "1:925799572042:web:81fe103cf6ee2ee89ffcb3",
  measurementId: "G-E6ZN0KY9YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

