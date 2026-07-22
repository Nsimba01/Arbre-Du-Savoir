import { getDatabase, ref, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export const generateResetToken = async (pseudo) => {
  const db = getDatabase();
  const token = uuidv4(); // Génère un token unique
  const expiration = Date.now() + 3600000; // 1 heure de validité

  const tokenData = {
    token,
    expiration,
    pseudo
  };

  await set(ref(db, `reset_tokens/${token}`), tokenData);
  await set(ref(db, `users/${pseudo}/token`), token);

  return token;
};
