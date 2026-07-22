import React, { useState, useContext } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, child } from "firebase/database";
import bcrypt from 'bcryptjs';
import '../css/connexion.css';
import '../css/button-width-height-global.css';
import { AuthContext } from './AuthContext';
import { validatePassword, validatePseudo } from './validationUtils';

function Connexion() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pseudo: "",
    password: ""
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [pseudoValidation, setPseudoValidation] = useState(false);
  const [isPseudoFocused, setIsPseudoFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
    setErrorMessage(null);
    if (name === "password") {
      setPasswordValidation(validatePassword(value));
    } else if (name === "pseudo") {
      setPseudoValidation(validatePseudo(value));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!pseudoValidation) {
      setErrorMessage("Ton pseudo n'est pas valide");
      setSuccessMessage(null);
      return;
    }

    if (!Object.values(passwordValidation).every(value => value)) {
      setErrorMessage("Ton mot de passe n'est pas valide");
      setSuccessMessage(null);
      return;
    }

    try {
      const dbRef = ref(getDatabase());
      const snapshot = await get(child(dbRef, `users/${formData.pseudo}`));

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const passwordMatch = await bcrypt.compare(formData.password, userData.password);

        if (passwordMatch) {
          setSuccessMessage("Vous êtes connecté !");
          setErrorMessage(null);
          login(formData.pseudo); 
          navigate('/home');
        } else {
          setErrorMessage("Ton mot de passe est incorrect");
          setSuccessMessage(null);
        }
      } else {
        setErrorMessage("Ton pseudo est incorrect");
        setSuccessMessage(null);
      }
    } catch (error) {
      setErrorMessage("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
      setSuccessMessage(null);
      console.error("Erreur lors de la connexion:", error);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(prevState => !prevState);
  };

  const isFormValid = pseudoValidation && Object.values(passwordValidation).every(v => v);

  return (
    <div className="formulaire">
      <p>Connexion à mon espace</p>
      <form onSubmit={handleSubmit}>
        <div className="field-1">
          <label htmlFor="pseudo">Pseudo:</label>
          <div className="input-container">
            <input
              type="text"
              id="pseudo"
              name="pseudo"
              value={formData.pseudo}
              onChange={handleChange}
              aria-label="Pseudo"
              aria-invalid={!pseudoValidation}
              aria-describedby="pseudo-validation"
              onFocus={() => setIsPseudoFocused(true)}
              onBlur={() => setIsPseudoFocused(false)}
            />
          </div>
        </div>
        {isPseudoFocused && (
          <div id="pseudo-validation" className="validation-message">
            <span style={{ color: pseudoValidation ? "RGB(51,204,51)" : "red", fontWeight: "normal" }}>
              Au moins 5 caractères
            </span>
          </div>
        )}

        <div className="field-2">
          <label htmlFor="motdepasse">Mot de passe:</label>
          <div className="input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="motdepasse"
              name="password"
              value={formData.password}
              onChange={handleChange}
              aria-label="Mot de passe"
              aria-invalid={!Object.values(passwordValidation).every(Boolean)}
              aria-describedby="password-validation"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <span
              className="toggle-password"
              onClick={toggleShowPassword}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        {isPasswordFocused && (
          <div id="password-validation" className="validation-message">
            <span style={{ color: passwordValidation.length ? "RGB(51,204,51)" : "red", fontWeight: "normal" }}>
              Au moins 10 caractères
            </span>
            <br />
            <span style={{ color: passwordValidation.uppercase ? "RGB(51,204,51)" : "red", fontWeight: "normal" }}>
              Au moins 1 majuscule
            </span>
            <br />
            <span style={{ color: passwordValidation.number ? "RGB(51,204,51)" : "red", fontWeight: "normal" }}>
              Au moins 1 chiffre
            </span>
          </div>
        )}

        <div className="form-row">
          <button
            type="submit"
            className="submit-btn"
            id="button-connexion"
            style={{
              backgroundColor: isFormValid ? 'rgb(146,208,80)' : 'rgb(211, 211, 211)',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
          >
            Connexion
          </button>
        </div>

        <p onClick={() => navigate('/creation')} className="link" id="link_form_top"
          style={{ marginBottom: "0", cursor: 'pointer', fontWeight: "normal" }}>
          Pas encore d'espace ?
        </p>
        <p onClick={() => navigate('/reset_password')} className="link" id="link_form_bottom"
          style={{ marginTop: "0", cursor: 'pointer', fontWeight: "normal" }}>
          Mot de passe oublié ?
        </p>

        {successMessage && <p className="success">{successMessage}</p>}
        {errorMessage   && <p className="error-message">{errorMessage}</p>}
      </form>
    </div>
  );
}

export default Connexion;