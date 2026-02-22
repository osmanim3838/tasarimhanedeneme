import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@tasarimhane_session';

/**
 * Session shape:
 *  { role: 'user' | 'owner' | 'employee', data: { ... } }
 *
 *  - user:     data = user object (id, firstName, lastName, phone)
 *  - owner:    data = salon object (id, name, owner, ...)
 *  - employee: data = employee object (id, name, surname, phone, ...)
 */

export async function saveSession(role, data) {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ role, data }));
  } catch (e) {
    console.error('Session save error:', e);
  }
}

export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
    return null;
  } catch (e) {
    console.error('Session read error:', e);
    return null;
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Session clear error:', e);
  }
}
