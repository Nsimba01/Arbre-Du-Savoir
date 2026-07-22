import React, { useEffect, useState, useContext } from 'react';
import { getDatabase, ref, get, update, set, remove } from 'firebase/database';
import { AuthContext } from './AuthContext';
import bcrypt from 'bcryptjs';
import emailjs from 'emailjs-com';
import btn_on_connexion from '../medias/connexion_on.png';
import { HiPencil } from 'react-icons/hi';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../css/ProfileModal.css';

function ProfileModal({ onClose }) {
  const { pseudo: pseudoContext, login } = useContext(AuthContext);
  const pseudo = pseudoContext || localStorage.getItem('pseudo') || '';

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFields, setOpenFields] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [newFieldFocused, setNewFieldFocused] = useState(null);
  const [passwordValidation, setPasswordValidation] = useState({ length: false, uppercase: false, number: false });
  const [pseudoValidation, setPseudoValidation] = useState({ length: false, available: false, checking: false });
  const [emailValidation, setEmailValidation] = useState(false);
  const pseudoTimeoutRef = React.useRef(null);

  useEffect(() => {
    if (!pseudo) { setLoading(false); return; }
    const fetchUser = async () => {
      try {
        const db = getDatabase();
        const snapshot = await get(ref(db, `users/${pseudo}`));
        if (snapshot.exists()) setUserData(snapshot.val());
      } catch (err) {
        console.error('Erreur chargement profil :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pseudo]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleField = (fieldKey) => {
    setOpenFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
    if (openFields[fieldKey]) {
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[fieldKey];
        return updated;
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setConfirmPassword('');
      setConfirmPasswordFocused(false);
      setNewFieldFocused(null);
      setPasswordValidation({ length: false, uppercase: false, number: false });
      setPseudoValidation({ length: false, available: false, checking: false });
      setEmailValidation(false);
    }
  };

  const handleCancel = () => {
    setOpenFields({});
    setPendingChanges({});
    setSaveMessage('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setConfirmPassword('');
    setConfirmPasswordFocused(false);
    setNewFieldFocused(null);
    setPasswordValidation({ length: false, uppercase: false, number: false });
    setPseudoValidation({ length: false, available: false, checking: false });
    setEmailValidation(false);
  };

  const fieldLabels = {
    nom: 'Nom',
    prenom: 'Prénom',
    email: 'Mail',
    sexe: 'Sexe',
    dateNaissance: 'Date de naissance',
    password: 'Mot de passe',
    pseudo: 'Pseudo',
  };

  const sendProfileUpdateEmail = async (targetEmail, targetPseudo, changedFields) => {
    try {
      const modifiedList = changedFields.map(field => `- ${fieldLabels[field] || field}`).join('\n');
      const templateParams = {
        to_email: targetEmail,
        pseudo: targetPseudo,
        modified_list: modifiedList,
      };

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE || 'service_z2vqh5i',
        process.env.REACT_APP_EMAILJS_PROFILE_TEMPLATE || 'template_1jmiuso',
        templateParams,
        process.env.REACT_APP_EMAILJS_USER || 'k9E-hi9Gv6XCXnZWM'
      );
    } catch (err) {
      console.error('Erreur envoi email modification profil :', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const db = getDatabase();
      const updates = {};
      const changedFields = [];

      if (pendingChanges['nom']) { updates['nom'] = pendingChanges['nom']; changedFields.push('nom'); }
      if (pendingChanges['prenom']) { updates['prenom'] = pendingChanges['prenom']; changedFields.push('prenom'); }
      if (pendingChanges['email']) { updates['email'] = pendingChanges['email']; changedFields.push('email'); }
      if (pendingChanges['sexe']) { updates['sexe'] = pendingChanges['sexe']; changedFields.push('sexe'); }
      if (pendingChanges['dateNaissance']) { updates['dateNaissance'] = pendingChanges['dateNaissance']; changedFields.push('dateNaissance'); }

      if (pendingChanges['password']) {
        const hashedPassword = await bcrypt.hash(pendingChanges['password'], 10);
        updates['password'] = hashedPassword;
        changedFields.push('password');
      }

      // Logique email : Déterminer où envoyer
      const oldEmail = userData?.email;
      const newEmail = pendingChanges['email'];
      const isEmailChanging = newEmail && newEmail !== oldEmail;

      const notifyEmails = async (targetPseudo) => {
        const promises = [];
        if (isEmailChanging) {
          if (oldEmail) promises.push(sendProfileUpdateEmail(oldEmail, targetPseudo, changedFields));
          if (newEmail) promises.push(sendProfileUpdateEmail(newEmail, targetPseudo, changedFields));
        } else if (oldEmail) {
          promises.push(sendProfileUpdateEmail(oldEmail, targetPseudo, changedFields));
        }
        await Promise.all(promises);
      };

      // --- Changement de pseudo ---
      if (pendingChanges['pseudo']) {
        const newPseudo = pendingChanges['pseudo'];
        const snapshot = await get(ref(db, `users/${newPseudo}`));
        if (snapshot.exists()) {
          setSaveMessage('Ce pseudo est déjà pris !');
          setIsSaving(false);
          return;
        }

        const currentData = { ...userData, ...updates };
        await set(ref(db, `users/${newPseudo}`), currentData);
        await remove(ref(db, `users/${pseudo}`));
        login(newPseudo);
        changedFields.push('pseudo');

        await notifyEmails(newPseudo);
        handleCancel();
        setSaveMessage('La mise à jour de ton profil a bien été effectuée');
        setIsSaving(false);
        return;
      }

      // --- Autres champs sans changement de pseudo ---
      await update(ref(db, `users/${pseudo}`), updates);
      setUserData(prev => ({ ...prev, ...updates }));
      
      await notifyEmails(pseudo);

      handleCancel();
      setSaveMessage('La mise à jour de ton profil a bien été effectuée');

    } catch (err) {
      console.error('Erreur enregistrement :', err);
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const validateNewValue = (fieldKey, value) => {
    if (fieldKey === 'password') {
      setPasswordValidation({
        length: value.length >= 10,
        uppercase: /[A-Z]/.test(value),
        number: /[0-9]/.test(value),
      });
    }
    if (fieldKey === 'pseudo') {
      const p = value.trim();
      if (p.length < 5) {
        setPseudoValidation({ length: false, available: false, checking: false });
        return;
      }
      setPseudoValidation(prev => ({ ...prev, length: true, checking: true }));
      if (pseudoTimeoutRef.current) clearTimeout(pseudoTimeoutRef.current);
      pseudoTimeoutRef.current = setTimeout(async () => {
        try {
          const db = getDatabase();
          const snapshot = await get(ref(db, `users/${p}`));
          setPseudoValidation({ length: true, available: !snapshot.exists(), checking: false });
        } catch {
          setPseudoValidation({ length: true, available: false, checking: false });
        }
      }, 500);
    }
    if (fieldKey === 'email') {
      setEmailValidation(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    }
  };

  const handlePendingChange = (fieldKey, value) => {
    let formattedValue = value;
    if (fieldKey === 'nom') formattedValue = value.trim().toUpperCase();
    if (fieldKey === 'prenom') {
      formattedValue = value.split(/([\s-])/).map((part) => {
        if (part.trim().length > 0 && !/[\s-]/.test(part)) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return part;
      }).join('');
    }
    setPendingChanges(prev => ({ ...prev, [fieldKey]: formattedValue }));
    validateNewValue(fieldKey, formattedValue);
  };

  const renderValidationMessage = (fieldKey) => {
    if (newFieldFocused !== fieldKey) return null;
  

    if (fieldKey === 'password') {
          const pwdEmpty = (pendingChanges['password'] || '').length === 0;
          const dot = (color) => <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginRight: '6px' }} />;
          const lengthColor   = passwordValidation.length    ? 'RGB(51,204,51)' : pwdEmpty ? 'black' : 'red';
          const upperColor    = passwordValidation.uppercase ? 'RGB(51,204,51)' : pwdEmpty ? 'black' : 'red';
          const numberColor   = passwordValidation.number    ? 'RGB(51,204,51)' : pwdEmpty ? 'black' : 'red';
          return (
            <div className="validation-message" aria-live="polite">
              <span style={{ color: lengthColor }}>{dot(lengthColor)}Au moins 10 caractères</span><br />
              <span style={{ color: upperColor }}>{dot(upperColor)}Au moins 1 majuscule</span><br />
              <span style={{ color: numberColor }}>{dot(numberColor)}Au moins 1 chiffre</span>
            </div>
          );
        }
   if (fieldKey === 'pseudo') {
  const dot = (color) => <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginRight: '6px' }} />;
  const pseudoEmpty    = (pendingChanges['pseudo'] || '').length === 0;
  const lengthColor    = pseudoValidation.length    ? 'RGB(51,204,51)' : pseudoEmpty ? 'black' : 'red';
  const availableColor = pseudoValidation.available ? 'RGB(51,204,51)' : pseudoEmpty ? 'black' : 'red';
  return (
    <div className="validation-message" aria-live="polite">
      <span style={{ color: lengthColor }}>{dot(lengthColor)}Au moins 5 caractères</span><br />

            <span style={{ color: availableColor }}>
                  {dot(availableColor)}
                  {pseudoValidation.checking ? 'Vérification en cours...' : 'Pseudo disponible'}
            </span>

    </div>
  );
}
if (fieldKey === 'email') {
  const dot = (color) => <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginRight: '6px' }} />;
  const emailEmpty = (pendingChanges['email'] || '').length === 0;
  const emailColor = emailValidation ? 'RGB(51,204,51)' : emailEmpty ? 'black' : 'red';
  return (
    <div className="validation-message" aria-live="polite">
      <span style={{ color: emailColor }}>{dot(emailColor)}Une adresse mail</span>
    </div>
  );
}
    return null;
  };

  const passwordsMatch = confirmPassword === (pendingChanges['password'] || '');
  const age = userData?.dateNaissance ? Math.floor((new Date() - new Date(userData.dateNaissance)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const fields = [
    { label: 'Pseudo', value: pseudo || '—', fieldKey: 'pseudo', masked: false, type: 'text' },
    { label: 'Mot de passe', value: '••••••••••', fieldKey: 'password', masked: true, type: 'password' },
    { label: 'Nom', value: userData?.nom || '—', fieldKey: 'nom', type: 'text' },
    { label: 'Prénom', value: userData?.prenom || '—', fieldKey: 'prenom', type: 'text' },
    { label: 'Sexe', value: !userData?.sexe ? '—' : userData.sexe === 'homme' ? (age !== null && age >= 18 ? 'Homme' : 'Garçon') : (age !== null && age >= 18 ? 'Femme' : 'Fille'), fieldKey: 'sexe', type: 'select' },
    { label: 'Date de naissance', value: userData?.dateNaissance ? new Date(userData.dateNaissance).toLocaleDateString('fr-FR') : '—', fieldKey: 'dateNaissance', type: 'date' },
    { label: 'Mail', value: userData?.email || '—', fieldKey: 'email', type: 'email' },
  ];

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="profile-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Profil utilisateur">
      <div className="profile-modal">
        <button className="profile-close-btn" onClick={onClose} aria-label="Fermer" title="Fermer">✕</button>
        {loading ? (
          <p className="profile-loading">Chargement...</p>
        ) : (
          <>
            <div className="profile-header">
              <span className="profile-pseudo-title">{pseudo || '—'}</span>
             
             {saveMessage && (
                  <p style={{ color: saveMessage.startsWith('La mise à jour') ? 'RGB(51,204,51)' : 'red', margin: '8px 0 0', fontSize: '0.85rem', textAlign: 'center' }}>
                    {saveMessage}
                    <span
                      onClick={() => setSaveMessage('')}
                      style={{
                        marginLeft: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: saveMessage.startsWith('La mise à jour') ? 'RGB(51,204,51)' : 'red',
                      }}

                       title="Masquer le message d'information"
                    >
                      ✕
              </span>
  </p>
)}


            </div>
            <div className="profile-divider" />
            <div className="profile-body">
              <div className="profile-avatar">
                <img src={btn_on_connexion} alt="Profil connecté" className="profile-avatar-img" onContextMenu={e => e.preventDefault()} />
                <HiPencil size={14} color="black" style={{ display: 'block', margin: '6px auto 0' }} />
              </div>
              <div className="profile-info">
                {fields.map(({ label, value, fieldKey, masked, type }) => (
                  <div key={label} className="profile-field-block">
                    <div className="profile-row">
                      <span className="profile-label">{label}</span>
                      <span className={`profile-value ${masked ? 'profile-value--masked' : ''}`}>{value}</span>
                      {fieldKey && (
                        <span className="profile-edit-icon" onClick={() => toggleField(fieldKey)} title={`Modifier ${label}`}>
                          <HiPencil size={14} />
                        </span>
                      )}
                    </div>
                    {fieldKey && openFields[fieldKey] && (
                      <div className="profile-edit-block">
                        <div className="profile-edit-row">
                          <span className="profile-edit-label">Actuel </span>
                          <div style={{ position: 'relative', flex: 1 }}>

                          <input type={masked ? (showCurrentPassword ? 'text' : 'password') : 'text'} value={value === '—' ? '' : value} disabled title={label} className="profile-edit-input profile-edit-input--disabled" style={{ width: '100%', paddingRight: masked ? '32px' : '8px', boxSizing: 'border-box' }} />                           
                           {masked && (
                              <span onClick={() => setShowCurrentPassword(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px' }}>
                                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="profile-edit-row">
                          <span className="profile-edit-label">Nouveau </span>
                          <div style={{ position: 'relative', flex: 1 }}>
                            {type === 'select' ? (
                              <select className="profile-edit-input" value={pendingChanges[fieldKey] || ''} onChange={e => handlePendingChange(fieldKey, e.target.value)} title={label} style={{ width: '100%', boxSizing: 'border-box' }}>
                                <option value=""> </option>
                                <option value="homme">{age !== null && age >= 18 ? 'Homme' : 'Garçon'}</option>
                                <option value="femme">{age !== null && age >= 18 ? 'Femme' : 'Fille'}</option>
                              </select>
                            ) : (

                              <input type={masked ? (showNewPassword ? 'text' : 'password') : (type || 'text')} className="profile-edit-input" placeholder={['Pseudo', 'Prénom', 'Mail', 'Mot de passe', 'Nom'].includes(label) ? '' : `Nouveau ${label.toLowerCase()}`} value={pendingChanges[fieldKey] || ''} onChange={e => handlePendingChange(fieldKey, e.target.value)} onFocus={() => setNewFieldFocused(fieldKey)} onBlur={() => setNewFieldFocused(null)} title={label} style={{ width: '100%', paddingRight: masked ? '32px' : '8px', boxSizing: 'border-box' }} />

                           
                           )}
                            {masked && (
                              <span onClick={() => setShowNewPassword(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px' }}>
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                              </span>
                            )}
                          </div>
                        </div>
                        {renderValidationMessage(fieldKey)}
                        {fieldKey === 'password' && (
                          <>
                            <div className="profile-edit-row">
                              <span className="profile-edit-label">Confirmation </span>
                              <div style={{ position: 'relative', flex: 1 }}>

                                <input type={showConfirmPassword ? 'text' : 'password'} className="profile-edit-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onFocus={() => setConfirmPasswordFocused(true)} onBlur={() => setConfirmPasswordFocused(false)} title="Confirmation du mot de passe" style={{ width: '100%', paddingRight: '32px', boxSizing: 'border-box' }} />                                
                                <span onClick={() => setShowConfirmPassword(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '15px' }}>
                                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                              </div>
                            </div>

                              {confirmPasswordFocused && (
                                <div className="validation-message" aria-live="polite">
                                  <span style={{ color: confirmPassword.length === 0 ? 'black' : passwordsMatch ? 'RGB(51,204,51)' : 'red' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: confirmPassword.length === 0 ? 'black' : passwordsMatch ? 'RGB(51,204,51)' : 'red', marginRight: '6px' }} />
                                    {passwordsMatch && confirmPassword.length > 0 ? 'Les mots de passe correspondent' : 'Identique au nouveau mot de passe'}
                                  </span>
                                </div>
                              )}

                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {hasPendingChanges && (
              <div className="profile-actions">
                <button className="profile-btn-cancel" onClick={handleCancel} disabled={isSaving}>Annuler</button>
                <button className="profile-btn-save" onClick={handleSave} disabled={isSaving || (pendingChanges['password'] && !passwordsMatch) || (pendingChanges['pseudo'] && !pseudoValidation.available)}>
                  {isSaving ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;