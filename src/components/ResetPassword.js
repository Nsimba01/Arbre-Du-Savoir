// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import emailjs from 'emailjs-com';
import '../css/connexion.css';
import { generateResetToken } from './tokenUtils';

function ResetPassword() {
  // --- états
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pseudos, setPseudos] = useState([]);
  const [selectedPseudo, setSelectedPseudo] = useState(localStorage.getItem('pseudo') || '');
  const [step, setStep] = useState('email'); // 'email' ou 'pseudo'
  const [isButtonDisabled, setIsButtonDisabled] = useState(!(localStorage.getItem('email') || '').includes('@'));
  const [buttonText, setButtonText] = useState('Vérifier');
  const [emailExists, setEmailExists] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // --- nouveau état pour message "Ton mail n'est pas valide" ou "Indique ton pseudo"
  const [invalidClickMsg, setInvalidClickMsg] = useState('');

  // message persistant désiré
  const NO_ACCOUNT_MSG = "Aucun compte n'est associé à ce mail";

  // helper qui protège le message persistant (NO_ACCOUNT_MSG) contre écrasement par d'autres erreurs,
  // mais permet de le vider (msg === '') quand on veut.
  const setErrorSafe = (msg) => {
    if (errorMessage === NO_ACCOUNT_MSG && msg !== '' && msg !== NO_ACCOUNT_MSG) {
      return;
    }
    setErrorMessage(msg);
  };

  useEffect(() => {
    setButtonText(step === 'pseudo' ? 'Valider' : 'Vérifier');
  }, [step]);

  useEffect(() => {
    setIsButtonDisabled(!email.includes('@'));
  }, [email]);

  // Vérifie si l'email existe (facultatif, pour UX)
  const checkEmailExists = async (candidateEmail) => {
    try {
      const db = getDatabase();
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      let exists = false;

      if (snapshot && snapshot.exists()) {
        snapshot.forEach((userSnapshot) => {
          const userData = userSnapshot.val();
          if (userData && userData.email === candidateEmail) {
            exists = true;
          }
        });
      }

      setEmailExists(exists);
    } catch (err) {
      console.error('Erreur checkEmailExists:', err);
      setEmailExists(false);
    }
  };

  // Nouvelle fonction : Envoie un email de confirmation après réinitialisation réussie
  const sendConfirmationEmail = async (userEmail, userName, userPseudo) => {
    try {
      const templateParams = {
        to_name: userName || 'Utilisateur',
        to_email: userEmail,
        pseudo: userPseudo,
        confirmation_message: 'Votre mot de passe a été réinitialisé avec succès.',
      };

      const userId = process.env.REACT_APP_EMAILJS_USER;

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE || 'service_z2vqh5i',
        process.env.REACT_APP_EMAILJS_CONFIRMATION_TEMPLATE || 'template_confirmation', // Nouveau template pour confirmation
        templateParams,
        userId || 'k9E-hi9Gv6XCXnZWM'
      );

      console.log('Email de confirmation envoyé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      // On ne bloque pas le processus si l'email de confirmation échoue
    }
  };

  // Envoie l'email de réinitialisation et écrit le token en DB pour vérification côté serveur/endpoint
  const sendResetEmail = async (pseudo) => {
    if (isSending) return;
    setIsSending(true);

    try {
      const db = getDatabase();
      const userRef = ref(db, `users/${pseudo}`);
      const snapshot = await get(userRef);

      if (!snapshot || !snapshot.exists()) {
        setErrorSafe('Pseudo non trouvé.');
        setSuccessMessage('');
        setIsSending(false);
        return;
      }

      const userData = snapshot.val();

      // génère token (fonction fournie séparément)
      const token = await generateResetToken(pseudo);
      if (!token) {
        setErrorSafe('Impossible de générer le token de réinitialisation.');
        setSuccessMessage('');
        setIsSending(false);
        return;
      }

      // Stocke une entrée passwordResets/<tokenKey> pour vérification côté serveur.
      // Note : pour la production, préférer stocker un hash du token.
      const tokenKey = encodeURIComponent(token);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      try {
        await set(ref(db, `passwordResets/${tokenKey}`), {
          pseudo,
          email,
          createdAt: Date.now(),
          expiresAt,
        });
      } catch (dbErr) {
        console.error('Erreur écriture token DB :', dbErr);
        // on continue l'envoi de l'email malgré l'erreur d'écriture
      }

      const resetLink = `${window.location.origin}/reset-pwd-process?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

      const templateParams = {
        to_name: userData.name || 'Utilisateur',
        to_email: email,
        reset_link: resetLink,
        pseudo,
      };

      const userId = process.env.REACT_APP_EMAILJS_USER;
      if (!userId) {
        console.warn('EmailJS user id absent : set REACT_APP_EMAILJS_USER dans .env si possible');
      }

      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE || 'service_z2vqh5i',
          process.env.REACT_APP_EMAILJS_TEMPLATE || 'template_48nncre',
          templateParams,
          userId || 'k9E-hi9Gv6XCXnZWM'
        );

        setSuccessMessage(
          `Un lien de réinitialisation a été envoyé à « ${email} ».\n Ce lien sera valable 10 minutes.`
        );
        // vider l'erreur (y compris NO_ACCOUNT_MSG) uniquement en cas de succès
        setErrorSafe('');
        setEmailSent(true);
        // vider le message "Ton mail n'est pas valide" / "Indique ton pseudo" si présent (en cas de succès)
        setInvalidClickMsg('');

        // *** NOUVEAU : Envoyer l'email de confirmation après le succès ***
        await sendConfirmationEmail(email, userData.name, pseudo);

      } catch (mailError) {
        console.error('Erreur EmailJS:', mailError);
        setErrorSafe(`Erreur lors de l'envoi de l'email : ${mailError?.text || mailError?.message || 'inconnue'}`);
        setSuccessMessage('');
        setIsSending(false);
        return;
      }

      // Nettoyage d'état après succès
      setEmail('');
      localStorage.removeItem('email');
      setSelectedPseudo('');
      localStorage.removeItem('pseudo');
      setPseudos([]);
      setStep('email');
      setIsButtonDisabled(true);
      setEmailExists(false);
    } catch (error) {
      console.error('Erreur sendResetEmail:', error);
      setErrorSafe("Erreur lors de l'envoi de l'email.");
      setSuccessMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSending) return;

    if (step === 'email') {
      if (!email.includes('@')) {
        setErrorSafe('Veuillez entrer un email valide.');
        setSuccessMessage('');
        return;
      }

      try {
        const db = getDatabase();
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        const associatedPseudos = [];

        if (snapshot && snapshot.exists()) {
          snapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val();
            // On suppose que userSnapshot.key correspond au pseudo
            if (userData && userData.email === email) {
              associatedPseudos.push(userSnapshot.key);
            }
          });
        }

        if (associatedPseudos.length === 0) {
          // affiche le message persistant — il restera affiché jusqu'à modification du champ email ou succès
          setErrorSafe(NO_ACCOUNT_MSG);
          setSuccessMessage('');
          return;
        } else if (associatedPseudos.length === 1) {
          setSelectedPseudo(associatedPseudos[0]);
          await sendResetEmail(associatedPseudos[0]);
        } else {
          // multiple pseudos -> on affiche le sélecteur pseudo
          // NOTE: on NE vide PAS NO_ACCOUNT_MSG ici — il est conservé en état,
          // mais il **NE SERA PAS AFFICHÉ** pendant l'étape 'pseudo' (voir rendu).
          setPseudos(associatedPseudos);
          setStep('pseudo');
        }
      } catch (err) {
        console.error('handleSubmit (email) error:', err);
        setErrorSafe("Erreur lors de la vérification de l'email.");
        setSuccessMessage('');
      }
    } else if (step === 'pseudo') {
      if (!selectedPseudo) {
        setErrorSafe('Veuillez sélectionner un pseudo.');
        setSuccessMessage('');
        return;
      }
      await sendResetEmail(selectedPseudo);
    }
  };

  // Handler de l'overlay : capte le clic quand le bouton est réellement disabled
  const handleOverlayClick = (e) => {
    e.preventDefault();
    // si envoie en cours, on ignore
    if (isSending) return;
    
    // on affiche le message approprié selon l'étape
    if (step === 'pseudo' && !selectedPseudo) {
      setInvalidClickMsg("Indique ton pseudo");
    } else if (step === 'email' && isButtonDisabled) {
      setInvalidClickMsg("Ton mail n'est pas valide");
    }
  };

  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);

    // => Ici on vide explicitement le message persistant (NO_ACCOUNT_MSG) dès que l'utilisateur modifie le champ email
    if (errorMessage) {
      setErrorSafe('');
    }

    // effacer le message "Ton mail n'est pas valide" dès que l'utilisateur modifie le champ
    if (invalidClickMsg) setInvalidClickMsg('');

    setIsButtonDisabled(!inputEmail.includes('@'));
    if (inputEmail.includes('@')) {
      checkEmailExists(inputEmail);
    } else {
      setEmailExists(false);
    }
  };

  const handlePseudoChange = (e) => {
    setSelectedPseudo(e.target.value);

    // On NE vide PAS NO_ACCOUNT_MSG ici (il doit rester jusqu'à modification du champ email ou succès)
    if (errorMessage && errorMessage !== NO_ACCOUNT_MSG) {
      setErrorSafe('');
    }

    // si on change le pseudo, on efface aussi le message spécifique (au cas où il était affiché)
    if (invalidClickMsg) setInvalidClickMsg('');
  };

  // conserver l'ancien comportement d'auto-effacement pour les autres messages (sauf NO_ACCOUNT_MSG)
  useEffect(() => {
    if (!errorMessage) return;
    if (errorMessage === NO_ACCOUNT_MSG) return; // on garde ce message jusqu'à modification du champ email ou succès
    const timer = setTimeout(() => setErrorSafe(''), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // Condition indiquant que le bouton est réellement disabled (selon l'étape)
  const buttonActuallyDisabled = isSending || (step === 'pseudo' ? !selectedPseudo : isButtonDisabled);

  return (
    <div className="formulaire-reset-pwd">
      <h2 style={{fontSize:'20px'}}>Réinitialisation du mot de passe</h2>

      {!emailSent ? (
        <>
          <br />
          {step === 'pseudo' && (
            <p id="info-message-id">
              Plusieurs comptes ont été identifiés. <br />Choisis ton pseudo puis clique sur  « Valider ».
            </p>
          )}

          <form onSubmit={handleSubmit} className="reset-pwd-form reset-pwd-form--reset centered-form" noValidate>
            <br />
            {step === 'email' && (
              <label className="centered-label inline-label">
                <span className="label-text">Mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  aria-required="true"
                  id="mail_process_reset_pwd"
                  title="Veuillez saisir une adresse e-mail valide"
                />
              </label>
            )}
            
            {step === 'pseudo' && (
              <label className="centered-label label-inline">
                <span>Pseudo</span>
                <select
                  className="select-pseudo centered-input"
                  value={selectedPseudo}
                  onChange={handlePseudoChange}
                  required
                  aria-required="true"
                >
                  <option value=""> </option>
                  {pseudos.map((pseudo) => (
                    <option key={pseudo} value={pseudo}>
                      {pseudo}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* wrapper relatif : on place l'overlay par-dessus le bouton quand il est réellement disabled */}
            <div className="btn-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
              <button
                type="submit"
                id="aligner-button"
                disabled={buttonActuallyDisabled}
                aria-disabled={buttonActuallyDisabled}
                className={buttonActuallyDisabled ? 'btn--looks-disabled' : ''}
              >
                {isSending ? 'Envoi...' : buttonText}
              </button>

              {/* Overlay visible uniquement quand le bouton est réellement disabled (capture le clic) */}
              {buttonActuallyDisabled && (
                <div
                  className="btn-overlay"
                  onClick={handleOverlayClick}
                  role="button"
                  aria-label="Bouton désactivé - afficher message d'erreur"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    cursor: 'not-allowed',
                    background: 'transparent',
                  }}
                />
              )}
            </div>
          </form>

          {/* ---------- ZONE RÉSERVÉE POUR LES MESSAGES ----------
              On réserve un espace fixe pour les messages afin d'éviter le déplacement du layout
          */}
          <div className="messages-space" aria-live="polite" style={{ minHeight: '3rem' }}>
            <p
              className="message-error invalid-click-msg"
              style={{ 
               
               
              
                color: 'rgb(238, 0, 0)',
                marginLeft: "1.5px",
                display: invalidClickMsg ? 'block' : 'none' 
              }}
            >
              {invalidClickMsg || '\u00A0'} 
            </p>

            {/* Message d'erreur général (on ne montre pas NO_ACCOUNT_MSG pendant l'étape 'pseudo') */}
            {!(errorMessage === NO_ACCOUNT_MSG && step === 'pseudo') && (
              <p className="message-error" style={{ visibility: errorMessage ? 'visible' : 'hidden' }}>
                {errorMessage || '\u00A0'}
              </p>
            )}
          </div>
        </>
      ) : (
        <div>
          <p className="message-success" style={{ whiteSpace: 'pre-line' }}> <br /> {successMessage}</p>
        </div>
      )}
    </div>
  );
}

export default ResetPassword;