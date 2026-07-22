import React, { useState, useContext } from "react";
import '../css/login_hover.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { validatePassword, validatePseudo } from './validationUtils';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import bcrypt from 'bcryptjs';
import '../css/button-width-height-global.css';

function LoginHover() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPseudoFocused, setIsPseudoFocused] = useState(false);
  const [pseudoValidation, setPseudoValidation] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
    setSuccessMessage(null);
    if (name === "password") {
      setPasswordValidation(validatePassword(value));
    } else if (name === "username") {
      setPseudoValidation(validatePseudo(value));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!pseudoValidation) {
      setErrorMessage("Ton pseudo n'est pas valide");
      return;
    }

    if (!Object.values(passwordValidation).every(v => v)) {
      setErrorMessage("Ton mot de passe n'est pas valide");
      return;
    }

    try {
      const db = getDatabase();
      const userRef = ref(db, `users/${formData.username}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const passwordMatch = await bcrypt.compare(formData.password, userData.password);

        if (passwordMatch) {
          setSuccessMessage("Vous êtes connecté !");
          setErrorMessage(null);
          login(formData.username); 
          navigate('/home');
        } else {
          setErrorMessage("Ton mot de passe est incorrect");
        }
      } else {
        setErrorMessage("Ton pseudo est incorrect");
      }
    } catch (error) {
      setErrorMessage("Une erreur s'est produite. Veuillez réessayer.");
      console.error("Erreur lors de la connexion:", error);
    }
  };

  const toggleShowPassword = () => setShowPassword(prev => !prev);
  const handleCreateAccount = () => navigate('/creation');
  const isFormValid = pseudoValidation && Object.values(passwordValidation).every(v => v);

  return (
    <div className="form-login">
      <form onSubmit={handleSubmit}>
        <div>
          <p>
            <label style={{ fontSize: '15px', marginBottom: "10px" }}>Pseudo</label>
          </p>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            onFocus={() => setIsPseudoFocused(true)}
            onBlur={() => setIsPseudoFocused(false)}
            aria-invalid={!pseudoValidation}
            style={{ marginTop: "-5px", width: "100%" }}
          />
          {isPseudoFocused && (
            <div>
              <span style={{ color: pseudoValidation ? "RGB(51,204,51)" : "red", fontWeight: "normal", fontSize: '13px' }}>
                Au moins 5 caractères
              </span>
            </div>
          )}
          <br />
          <label style={{ fontSize: '15px', marginTop: "-5px" }}>
            Mot de passe <br />
          </label>
          <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              style={{ width: "100%", paddingRight: "30px" }}
            />
            <span
              onClick={toggleShowPassword}
              style={{ position: "absolute", right: 10, top: "33%", transform: "translateY(-50%)", cursor: "pointer" }}
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <br />
          {isPasswordFocused && (
            <div>
              <span style={{ color: passwordValidation.length ? "RGB(51,204,51)" : "red", fontWeight: "normal", fontSize: '13px' }}>
                Au moins 10 caractères
              </span>
              <br />
              <span style={{ color: passwordValidation.uppercase ? "RGB(51,204,51)" : "red", fontWeight: "normal", fontSize: '13px' }}>
                Au moins une majuscule
              </span>
              <br />
              <span style={{ color: passwordValidation.number ? "RGB(51,204,51)" : "red", fontWeight: "normal", fontSize: '13px' }}>
                Au moins 1 chiffre
              </span>
            </div>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: isFormValid ? 'rgb(146,208,80)' : 'rgb(211,211,211)',
              fontSize: '15px',
              color: 'black',
              width: '100%',
              maxWidth: '220px',
              borderRadius: '7px',
              border: '1px solid black',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              marginTop: '15px'
            }}
          >
            Connexion
          </button>

          <br /><br />
          <p onClick={handleCreateAccount} className="linkHoverForm"
            style={{ cursor: 'pointer', marginBottom: "0px", textDecoration: 'underline' }}>
            Pas encore d'espace ?
          </p>
          <p onClick={() => navigate('/reset_password')} className="linkHoverForm"
            style={{ cursor: 'pointer', marginTop: "0px", marginBottom: "-4px", textDecoration: 'underline' }}>
            Mot de passe oublié ?
          </p>
          {errorMessage && (
            <p style={{ color: "red", fontSize: '15px', fontWeight: "normal", marginBottom: "10px", marginTop: "15px" }}>
              {errorMessage}
            </p>
          )}
        </div>
      </form>
      {successMessage && <p style={{ color: "white" }}>{successMessage}</p>}
    </div>
  );
}

export default LoginHover;