import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set, get } from "firebase/database";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import bcrypt from "bcryptjs";
import '../css/button-width-height-global.css';
import '../css/creation.css';

function Creation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pseudo: "",
    password: "",
    email: "",
    nom: "",
    prenom: "",
    sexe: "vide",
    dateNaissance: "",
  });
  const [successMessage, setSuccessMessage] = useState(null);

  // message unique affiché sous le bouton (séquentiel)
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false); // pour la transition fade

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    number: false
  });
  const [pseudoValidation, setPseudoValidation] = useState({
    length: false,
    available: false,
    checking: false
  });
  const [emailValidation, setEmailValidation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPseudoFocused, setIsPseudoFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  // nouveaux états de focus pour les autres champs afin d'attendre la focalisation
  const [isNomFocused, setIsNomFocused] = useState(false);
  const [isPrenomFocused, setIsPrenomFocused] = useState(false);
  const [isSexeFocused, setIsSexeFocused] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);

  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // refs pour debounce pseudo et timers d'erreur séquentielle
  const pseudoTimeoutRef = useRef(null);
  const timersRef = useRef([]); // contiendra IDs de setTimeout / setInterval

  // refs pour les states de focus (permet la lecture depuis les callbacks/timers)
  const isPseudoFocusedRef = useRef(isPseudoFocused);
  const isPasswordFocusedRef = useRef(isPasswordFocused);
  const isEmailFocusedRef = useRef(isEmailFocused);
  const isNomFocusedRef = useRef(isNomFocused);
  const isPrenomFocusedRef = useRef(isPrenomFocused);
  const isSexeFocusedRef = useRef(isSexeFocused);
  const isDateFocusedRef = useRef(isDateFocused);

  // synchronize refs when states change
  useEffect(() => { isPseudoFocusedRef.current = isPseudoFocused; }, [isPseudoFocused]);
  useEffect(() => { isPasswordFocusedRef.current = isPasswordFocused; }, [isPasswordFocused]);
  useEffect(() => { isEmailFocusedRef.current = isEmailFocused; }, [isEmailFocused]);
  useEffect(() => { isNomFocusedRef.current = isNomFocused; }, [isNomFocused]);
  useEffect(() => { isPrenomFocusedRef.current = isPrenomFocused; }, [isPrenomFocused]);
  useEffect(() => { isSexeFocusedRef.current = isSexeFocused; }, [isSexeFocused]);
  useEffect(() => { isDateFocusedRef.current = isDateFocused; }, [isDateFocused]);

  // Validation du mot de passe
  const validatePassword = (password) => ({
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password)
  });

  // Validation email (retourne bool)
  const isEmailValidFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Nettoyage des timers de la séquence d'erreurs + debounce
  const clearAllTimers = useCallback(() => {
    if (pseudoTimeoutRef.current) {
      clearTimeout(pseudoTimeoutRef.current);
      pseudoTimeoutRef.current = null;
    }
    if (timersRef.current && timersRef.current.length) {
      timersRef.current.forEach((t) => {
        try { clearTimeout(t); } catch (e) {}
        try { clearInterval(t); } catch (e) {}
      });
      timersRef.current = [];
    }
  }, []);

  // Validation du pseudo avec debounce propre
  const validatePseudoDebounced = useCallback(async (pseudo) => {
    const p = (pseudo || "").trim();

    if (pseudoTimeoutRef.current) {
      clearTimeout(pseudoTimeoutRef.current);
    }

    if (p.length < 5) {
      setPseudoValidation({ length: false, available: false, checking: false });
      return;
    }

    setPseudoValidation(prev => ({ ...prev, length: true, checking: true }));
    pseudoTimeoutRef.current = setTimeout(async () => {
      try {
        const db = getDatabase();
        const userRef = ref(db, `users/${p}`);
        const snapshot = await get(userRef);
        const available = !snapshot.exists();
        setPseudoValidation({ length: true, available, checking: false });
      } catch (error) {
        console.error("Erreur lors de la vérification du pseudo:", error);
        setPseudoValidation({ length: true, available: false, checking: false });
      }
      pseudoTimeoutRef.current = null;
    }, 500);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Renvoie la liste des messages d'erreur (ordre voulu) -> maintenant objets { key, msg }
  const getInvalidMessages = useCallback(() => {
    const msgs = [];
    const { pseudo, password, nom, prenom, sexe, dateNaissance, email } = formData;

    // Pseudo
    if (!pseudo || pseudo.trim().length < 5 || !pseudoValidation.available || pseudoValidation.checking) {
      msgs.push({ key: "pseudo", msg: "Ton pseudo n'est pas valide" });
    }

    // Mot de passe
    if (!password || !Object.values(passwordValidation).every(Boolean)) {
      msgs.push({ key: "password", msg: "Ton mot de passe n'est pas valide" });
    }

    // Nom
    if (!nom || !nom.trim()) {
      msgs.push({ key: "nom", msg: "Ton nom n'est pas valide" });
    }

    // Prénom
    if (!prenom || !prenom.trim()) {
      msgs.push({ key: "prenom", msg: "Ton prénom n'est pas valide" });
    }

    // Sexe
    if (sexe === "vide") {
      msgs.push({ key: "sexe", msg: "Indique ton sexe" });
    }

    // Date de naissance
    if (!dateNaissance) {
      msgs.push({ key: "dateNaissance", msg: "Indique ta date de naissance" });
    }

    // Email
    if (!email || !emailValidation) {
      msgs.push({ key: "email", msg: "Ton email n'est pas valide" });
    }

    return msgs;
  }, [formData, pseudoValidation, passwordValidation, emailValidation]);

  // helper : retourne true si le champ identifié par "key" est maintenant valide
  const fieldIsValid = useCallback((key) => {
    switch (key) {
      case "pseudo":
        return pseudoValidation.length && pseudoValidation.available && !pseudoValidation.checking;
      case "password":
        return Object.values(passwordValidation).every(Boolean);
      case "nom":
        return formData.nom && formData.nom.trim().length > 0;
      case "prenom":
        return formData.prenom && formData.prenom.trim().length > 0;
      case "sexe":
        return formData.sexe && formData.sexe !== "vide";
      case "dateNaissance":
        return Boolean(formData.dateNaissance);
      case "email":
        return emailValidation;
      default:
        return false;
    }
  }, [pseudoValidation, passwordValidation, formData, emailValidation]);

  // Affiche séquentiellement les messages d'erreur : chaque message persiste
  // jusqu'à ce que le champ associé soit focalisé OU que le champ devienne valide.
  const showSequentialErrors = useCallback(() => {
    clearAllTimers();
    setErrorMessage(null);
    setErrorVisible(false);

    const messages = getInvalidMessages();
    if (!messages.length) return;

    const transitionMs = 400; // durée du fade-in/fade-out (doit matcher errorStyle)
    const pollIntervalMs = 150; // intervalle de vérification focus/validation

    // IIFE async pour exécuter la séquence en série
    (async () => {
      for (let i = 0; i < messages.length; i++) {
        const { key, msg } = messages[i];
        const isLast = i === messages.length - 1;

        // si le formulaire devient valide ou on submit -> arrêter tout
        if (isFormValid || isSubmitting) {
          clearAllTimers();
          return;
        }

        // afficher le message et fade-in
        setErrorMessage(msg);
        // small tick ensure DOM update then show
        const visTimer = setTimeout(() => setErrorVisible(true), 20);
        timersRef.current.push(visTimer);

        // attendre que le champ soit focalisé OU que le champ devienne valide
        await new Promise((resolve) => {
          // si le champ est déjà focalisé / valide -> on résout immédiatement
          const alreadyFocusedOrValid =
            (key === "pseudo" && isPseudoFocusedRef.current) ||
            (key === "password" && isPasswordFocusedRef.current) ||
            (key === "email" && isEmailFocusedRef.current) ||
            (key === "nom" && isNomFocusedRef.current) ||
            (key === "prenom" && isPrenomFocusedRef.current) ||
            (key === "sexe" && isSexeFocusedRef.current) ||
            (key === "dateNaissance" && isDateFocusedRef.current) ||
            fieldIsValid(key);

          if (alreadyFocusedOrValid) {
            resolve();
            return;
          }

          // sinon on installe un intervalle qui checke focus / validité régulièrement
          const intervalId = setInterval(() => {
            if (isFormValid || isSubmitting) {
              clearInterval(intervalId);
              resolve();
              return;
            }

            const focused =
              (key === "pseudo" && isPseudoFocusedRef.current) ||
              (key === "password" && isPasswordFocusedRef.current) ||
              (key === "email" && isEmailFocusedRef.current) ||
              (key === "nom" && isNomFocusedRef.current) ||
              (key === "prenom" && isPrenomFocusedRef.current) ||
              (key === "sexe" && isSexeFocusedRef.current) ||
              (key === "dateNaissance" && isDateFocusedRef.current);

            const valid = fieldIsValid(key);

            if (focused || valid) {
              clearInterval(intervalId);
              resolve();
            }
          }, pollIntervalMs);

          timersRef.current.push(intervalId);
        });

        // si ce n'est pas le dernier message : fade-out puis clear, puis continuer à la suite
        if (!isLast) {
          // fade-out pendant transitionMs
          const hideTimer = setTimeout(() => {
            setErrorVisible(false);
          }, 0); // on commence immédiatement le fade-out
          timersRef.current.push(hideTimer);

          // après la transition on efface le message (prépare le suivant)
          const clearTimer = setTimeout(() => {
            setErrorMessage(null);
          }, transitionMs);
          timersRef.current.push(clearTimer);

          // attendre la fin du fade-out avant continuer la boucle
          await new Promise((res) => {
            const waitTimer = setTimeout(res, transitionMs + 10);
            timersRef.current.push(waitTimer);
          });
        } else {
          // dernier message : on laisse visible tant que le champ n'est pas focalisé/valide
          // (la Promise précédente a déjà attendu jusqu'à ce que le champ soit focalisé/valide)
          // On laisse visible — ne pas programmer d'auto-hide.
          // Mais si on veut s'assurer d'un focus futur masque le message : installer un petit check
          // : si le champ devient focalisé/valide => on garde le message caché (optionnel)
          // Ici on choisit de garder le message visible jusqu'à action utilisateur.
        }

        // si pendant le flux le formulaire est valide / submit en cours, on arrête
        if (isFormValid || isSubmitting) {
          clearAllTimers();
          return;
        }
      }
    })();
  }, [clearAllTimers, getInvalidMessages, isFormValid, isSubmitting, fieldIsValid]);

  // Gestion des changements de champs (annule la séquence d'erreurs)
  const handleChange = (event) => {
    const { name, value } = event.target;

    clearAllTimers();
    setErrorMessage(null);
    setErrorVisible(false);

    if (name === "pseudo") {
      const normalized = value.replace(/\s+/g, " ");
      setFormData((prev) => ({ ...prev, [name]: normalized }));
      validatePseudoDebounced(normalized);
      return;
    }

    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setEmailValidation(isEmailValidFormat(value));
      return;
    }

    if (name === "password") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setPasswordValidation(validatePassword(value));
      return;
    }

    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleChangeSexe = (e) => {
    const { value } = e.target;
    clearAllTimers();
    setErrorMessage(null);
    setErrorVisible(false);
    setFormData((prevState) => ({ ...prevState, sexe: value }));
  };

  const handleNomChange = (e) => {
    const { value } = e.target;
    clearAllTimers();
    setErrorMessage(null);
    setErrorVisible(false);
    setFormData((prevState) => ({ ...prevState, nom: value.trim().toUpperCase() }));
  };

  const handlePrenomChange = (e) => {
    clearAllTimers();
    setErrorMessage(null);
    setErrorVisible(false);
    const value = e.target.value;
    const formatted = value
      .split(/([\s-])/)
      .map((part) => {
        if (part.trim().length > 0 && !/[\s-]/.test(part)) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return part;
      })
      .join('');
    setFormData((prevState) => ({ ...prevState, prenom: formatted }));
  };

  // Validation du formulaire
  useEffect(() => {
    const { nom, prenom, sexe, dateNaissance } = formData;
    const isPseudoValid = pseudoValidation.length && pseudoValidation.available && !pseudoValidation.checking;
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    const isEmailValid = emailValidation;

    const isValid = isPseudoValid &&
                    isPasswordValid &&
                    isEmailValid &&
                    nom.trim().length > 0 &&
                    prenom.trim().length > 0 &&
                    sexe !== "vide" &&
                    dateNaissance;
    setIsFormValid(isValid);
  }, [pseudoValidation, passwordValidation, emailValidation, formData]);

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  // handleSubmit accepte maintenant un appel direct sans event
  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();

    if (!isFormValid || isSubmitting) {
      showSequentialErrors();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorVisible(false);

    try {
      const pseudoTrim = formData.pseudo.trim();
      const db = getDatabase();
      const userRef = ref(db, 'users/' + pseudoTrim);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setErrorMessage("Ce pseudo est déjà pris. Veuillez en choisir un autre.");
        setErrorVisible(true);
        setIsSubmitting(false);
        return;
      }

      // ✅ Hash du mot de passe avec bcrypt (salt rounds = 10)
      const hashedPassword = await bcrypt.hash(formData.password, 10);

      const userData = {
        email: formData.email.trim(),
        nom: formData.nom,
        prenom: formData.prenom,
        sexe: formData.sexe,
        dateNaissance: formData.dateNaissance,
        password: hashedPassword, // ✅ mot de passe hashé, jamais en clair
      };

      await set(userRef, userData);
      setSuccessMessage("Votre compte a été créé avec succès !");
      setErrorMessage(null);
      setErrorVisible(false);
      setTimeout(() => navigate('/connexion'), 1200);
    } catch (error) {
      console.error("Erreur lors de la création du compte :", error);
      setErrorMessage("Une erreur s'est produite. Veuillez réessayer.");
      setErrorVisible(true);
      setIsSubmitting(false);
    }
  };

  // Lors du clic sur le bouton : si invalide -> lancer la séquence, sinon -> soumettre
  const handleButtonClick = (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) {
      showSequentialErrors();
    } else {
      handleSubmit();
    }
  };

  // styles pour le message d'erreur (fade)
  const transitionMs = 400; // doit matcher transitionMs défini dans showSequentialErrors
  const errorStyle = {
    opacity: errorVisible ? 1 : 0,
    transition: `opacity ${transitionMs}ms ease`,
    color: "red",
    fontSize: "15px",
    fontWeight: "normal",
    marginTop: "-9px"
  };

  return (
    <div className="formulaireCreate" id="creation-form">
      <p>Création de mon espace</p>
      <form onSubmit={handleSubmit} noValidate>
        {/* Pseudo */}
        <div className="form-row-creation">
          <label htmlFor="pseudo">Pseudo:</label>
          <div className="input-container-create" style={{ position: 'relative' }}>
            <input
              id="pseudo"
              type="text"
              name="pseudo"
              value={formData.pseudo}
              onChange={handleChange}
              aria-label="Pseudo"
              required
              onFocus={() => { setIsPseudoFocused(true); }}
              onBlur={() => { setIsPseudoFocused(false); }}
              autoComplete="off"
              inputMode="text"
            />
          </div>
        </div>
        {isPseudoFocused && (
          <div className="validation-message" aria-live="polite">
            <span style={{ color: pseudoValidation.length ? "RGB(51,204,51)" : "red" }}>
              Au moins 5 caractères
            </span>
            <br />
            <span style={{ color: pseudoValidation.available ? "RGB(51,204,51)" : pseudoValidation.checking ? "orange" : "red" }}>
              {pseudoValidation.checking ? "Vérification en cours..." : (pseudoValidation.available ? "Pseudo disponible" : "Pseudo indisponible")}
            </span>
          </div>
        )}

        {/* Mot de passe */}
        <div className="form-row-creation">
          <label htmlFor="password">Mot de passe:</label>
          <div className="input-container-create" style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              aria-label="Mot de passe"
              required
              onFocus={() => { setIsPasswordFocused(true); }}
              onBlur={() => { setIsPasswordFocused(false); }}
              style={{
                height: '25px',
                padding: '4px 35px 4px 8px',
                borderRadius: '5px',
                boxSizing: 'border-box',
                fontSize: '15px',
                width: '100%'
              }}
            />
            {/* PICTOGRAMME OEIL : span cliquable (gardé comme demandé) */}
            <span
              onClick={toggleShowPassword}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-39%)',
                cursor: 'pointer',
                color: '#333',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {isPasswordFocused && (
          <div className="validation-message" aria-live="polite">
            <span style={{ color: passwordValidation.length ? "RGB(51,204,51)" : "red" }}>
              Au moins 10 caractères
            </span>
            <br />
            <span style={{ color: passwordValidation.uppercase ? "RGB(51,204,51)" : "red" }}>
              Au moins une majuscule
            </span>
            <br />
            <span style={{ color: passwordValidation.number ? "RGB(51,204,51)" : "red" }}>
              Au moins 1 chiffre
            </span>
          </div>
        )}

        {/* Nom */}
        <div className="form-row-creation">
          <label htmlFor="nom">Nom:</label>
          <div className="input-container-create">
            <input
              id="nom"
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleNomChange}
              aria-label="Nom"
              required
              onFocus={() => setIsNomFocused(true)}
              onBlur={() => setIsNomFocused(false)}
            />
          </div>
        </div>

        {/* Prénom */}
        <div className="form-row-creation">
          <label htmlFor="prenom">Prénom :</label>
          <div className="input-container-create">
            <input
              id="prenom"
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handlePrenomChange}
              aria-label="Prénom"
              required
              onFocus={() => setIsPrenomFocused(true)}
              onBlur={() => setIsPrenomFocused(false)}
            />
          </div>
        </div>

        {/* Sexe */}
        <div className="form-row-creation">
          <label htmlFor="sexe">Sexe:</label>
          <div className="input-container-create">
            <select
              id="sexe"
              name="sexe"
              value={formData.sexe}
              onChange={handleChangeSexe}
              required
              onFocus={() => setIsSexeFocused(true)}
              onBlur={() => setIsSexeFocused(false)}
            >
              <option value="vide">(vide)</option>
              <option value="femme">Fille</option>
              <option value="homme">Garçon</option>
            </select>
          </div>
        </div>

        {/* Date de naissance */}
        <div className="form-row-creation">
          <label htmlFor="dateNaissance">Date de naissance: </label>
          <div className="input-container-create">
            <input
              id="dateNaissance"
              type="date"
              name="dateNaissance"
              value={formData.dateNaissance}
              onChange={(e) => { clearAllTimers(); setErrorMessage(null); setErrorVisible(false); setFormData(prev => ({ ...prev, dateNaissance: e.target.value })); }}
              aria-label="Date de naissance"
              required
              onFocus={() => setIsDateFocused(true)}
              onBlur={() => setIsDateFocused(false)}
            />
          </div>
        </div>

        {/* Mail */}
        <div className="form-row-creation">
          <label htmlFor="email">Mail:</label>
          <div className="input-container-create">
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              aria-label="Mail"
              required
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              style={{ marginBottom: '10px' }}
              autoComplete="email"
            />
          </div>
        </div>
        {isEmailFocused && (
          <div className="validation-message" aria-live="polite">
            <span style={{ color: emailValidation ? "RGB(51,204,51)" : "red" }}>
              Une adresse email valide
            </span>
          </div>
        )}

        {/* Bouton de soumission — non-disabled pour capturer le clic */}
        <div className="form-row-creation">
          <button
            type="button"
            onClick={handleButtonClick}
            id="aligner-button-create"
            aria-disabled={(!isFormValid || isSubmitting).toString()}
            tabIndex={0}
            style={{
              backgroundColor: isFormValid && !isSubmitting ? 'RGB(51,204,51)' : 'rgb(211, 211, 211)',
              cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease',
              border: "1px solid black",
              padding: '6px 12px',
              fontSize: '14px'
            }}
          >
            {isSubmitting ? "Création en cours..." : "Création"}
          </button>
        </div>

        {/* Lien "Déjà un espace ?" */}
        <p
          className="link"
          onClick={() => !isSubmitting && navigate('/connexion')}
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            textDecoration: 'underline',
            color: 'black',
            fontStyle: 'italic',
            fontSize: '13px',
          }}
        >
          Déjà un espace ?
        </p>
      </form>

      {/* Affichage des messages sous le bouton avec transition */}
      <div style={{ minHeight: '22px',fontSize: '15px' }}>
        {errorMessage && (
          <p role="alert" aria-live="assertive" style={errorStyle} className="msg-error-320px">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Message de succès */}
      {successMessage && <p role="status" aria-live="polite" style={{ color: "RGB(51,204,51)" }}>{successMessage}</p>}
    </div>
  );
}

export default Creation;