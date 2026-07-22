import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, update } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import bcrypt from 'bcryptjs';
import emailjs from 'emailjs-com'; // ← AJOUT : Import EmailJS
import '../css/resetPwdReady.css';
import { validatePassword } from './validationUtils';

function ResetPwdReady() {
  const [message, setMessage] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showInvalidMessage, setShowInvalidMessage] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
  });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    const emailFromUrl = query.get('email');
    setEmail(emailFromUrl);

    if (token) {
      const db = getDatabase();
      const tokenRef = ref(db, `reset_tokens/${token}`);
      get(tokenRef)
        .then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const now = Date.now();

            if (now < data.expiration) {
              setIsValidToken(true);
              setMessage('Le lien est valide.\nTu peux à présent réinitialiser ton mot de passe.');
              if (data.pseudo) {
                setPseudo(data.pseudo);
              } else {
                setMessage('Pseudo introuvable dans les données du lien.');
              }
            } else {
              setIsValidToken(false);
              setMessage('Ce lien a expiré.');
            }
          } else {
            setIsValidToken(false);
            setMessage('Le lien est invalide.');
          }
        })
        .catch(error => {
          setMessage("Une erreur s'est produite.");
          console.error("Erreur lors de la vérification du jeton :", error);
        });
    } else {
      setMessage('Aucun jeton fourni.');
    }
  }, [location]);

  // ← AJOUT : Fonction pour envoyer l'email de confirmation
  const sendConfirmationEmail = async (userEmail, userPseudo) => {
    try {
      const templateParams = {
        to_email: userEmail,
        pseudo: userPseudo,
      };

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE || 'service_z2vqh5i',
        process.env.REACT_APP_EMAILJS_CONFIRMATION_TEMPLATE || 'template_kaooezo',
        templateParams,
        process.env.REACT_APP_EMAILJS_USER || 'k9E-hi9Gv6XCXnZWM'
      );

      console.log('Email de confirmation envoyé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      // On ne bloque pas le processus si l'email échoue
    }
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setNewPassword(value);
    setPasswordValidation(validatePassword(value));
    setShowInvalidMessage(false);

    if (confirmPassword) {
      setConfirmPasswordValidation(validatePassword(confirmPassword));
      if (confirmPassword !== value) {
       
      } else {
        setError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const { value } = e.target;
    setConfirmPassword(value);
    setConfirmPasswordValidation(validatePassword(value));
    setShowInvalidMessage(false);
    
    if (value !== newPassword) {
   
    } else {
      setError('');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return;
    }
    if (
      !Object.values(passwordValidation).every(Boolean) ||
      !Object.values(confirmPasswordValidation).every(Boolean)
    ) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }
    try {
      const db = getDatabase();
      const userRef = ref(db, `users/${pseudo}`);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Mise à jour du mot de passe
      await update(userRef, { password: hashedPassword });
      
      setIsPasswordReset(true);
      setConfirmationEmail(email);
      setError('');
      
      // ← AJOUT : Envoi de l'email de confirmation après mise à jour réussie
      await sendConfirmationEmail(email, pseudo);
      
    } catch (error) {
      setMessage("Une erreur s'est produite lors de la réinitialisation du mot de passe.");
      console.error('Erreur de réinitialisation :', error);
    }
  };

  const handleButtonClick = (e) => {
    if (!isFormValid) {
      e.preventDefault();
      setShowInvalidMessage(true);
    } else {
      handlePasswordReset(e);
    }
  };

  const isFormValid =
    newPassword === confirmPassword &&
    Object.values(passwordValidation).every(Boolean) &&
    Object.values(confirmPasswordValidation).every(Boolean);

  const labelStyle = { display: 'inline-block', width: '120px', fontSize: '15px' };
 
  // Vérification si les mots de passe sont identiques
  const isPasswordMatch = confirmPassword === newPassword && confirmPassword !== '';
  
  // Vérification si c'est un message de succès
  const isSuccessMessage = message.includes('Le lien est valide') || 
                           message.includes('modifié avec succès');
 
  return (
    <div className="reset-pwd-ready">

      {isValidToken && (
        <div className="password-reset-form">
          <h4>Réinitialisation du mot de passe</h4>
          
          {/* Message de succès après réinitialisation */}
          {isPasswordReset && (
            <div>
              <p style={{ 
                color: 'RGB(51,204,51)',
                marginBottom: '5px',
                fontWeight: 'normal',
                fontSize: '15px'
              }}>
                Ton mot de passe a été modifié avec succès.
              </p>
              <p style={{ 
                color: 'RGB(51,204,51)',
                marginBottom: '25px',
                fontWeight: 'normal',
                fontSize: '15px'
              }}>
                Un mail de confirmation a été envoyé à ton adresse « {email} ».
              </p>
            </div>
          )}
          
          {/* Formulaire visible uniquement si pas encore réinitialisé */}
          {!isPasswordReset && (
            <form>
              {message && (
                <div>
                  <p style={isSuccessMessage ? { 
                    color: 'RGB(51,204,51)',
                    marginBottom: '25px',
                    fontWeight: 'normal',
                    fontSize: '15px',
                    whiteSpace: 'pre-line'
                  } : {}}>
                    {message}
                  </p>
                  {message.includes('Le lien est valide') && (
                    <div className="user-info">
                      <p>
                        <span style={labelStyle}>Pseudo :</span>
                        <strong  className="pseudo_email">{pseudo}</strong>
                      </p>

                      <p>
                        <span style={labelStyle}>Mail :</span>
                        <strong className="pseudo_email">{email}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
              <br />
              <label>
                <p style={{ fontSize: '15px' }}> Nouveau mot de passe  </p>

                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={handlePasswordChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      marginTop: '-5px',
                    }}
                    className="eye-icon"
                  />
                </div>
              </label>
              {isPasswordFocused && (
                <div id="password-validation">
                  <span style={{ color: passwordValidation.length ? "RGB(51,204,51)" : "red", fontStyle: 'normal', fontSize: '13px' }}>
                    Au moins 10 caractères
                  </span><br />
                  <span style={{ color: passwordValidation.uppercase ? "RGB(51,204,51)" : "red", fontStyle: 'normal', fontSize: '13px' }}>
                    Au moins 1 majuscule
                  </span><br />
                  <span style={{ color: passwordValidation.number ? "RGB(51,204,51)" : "red", fontStyle: 'normal', fontSize: '13px' }}>
                    Au moins un chiffre
                  </span>
                </div>
              )}
              <label>
                <p style={{ fontSize: '15px' }}> Confirmation du nouveau mot de passe </p>

                <div className="password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    required
                  />
                  <FontAwesomeIcon
                    icon={showConfirmPassword ? faEyeSlash : faEye}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      marginTop: '-5px',
                    }}
                    className="eye-icon"
                  />
                </div>
              </label>
              {isConfirmPasswordFocused && (
                <div id="confirm-password-validation">
                     
                  <span style={{ 
                    color: isPasswordMatch && Object.values(confirmPasswordValidation).every(Boolean) ? "RGB(51,204,51)" : "red",
                    fontStyle: 'normal',
                    fontSize: '13px',
                    fontWeight: 'normal'
                  }}>
                    Identique au nouveau mot de passe
                  </span>
                </div>
              )}
             
              {error && <p className="error">{error}</p>}
              <button
                type="button"
                className="submit-btn"
                onClick={handleButtonClick}
                style={{
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  marginBottom: '15px',
                  backgroundColor: isFormValid ? 'RGB(146,208,80)' : 'RGB(211,211,211)',
                  marginTop: '20px'
                }}
              >
                Valider
              </button>

              {showInvalidMessage && (
                <p style={{ color: 'red', fontWeight: 'normal', fontStyle: 'italic', fontSize: '15px' }}>
                  Ton nouveau mot de passe est invalide ou les 2 saisies ne sont pas identiques
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default ResetPwdReady;