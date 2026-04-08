import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/types/session';

const SESSIONS_KEY = 'logmanager_sessions';

export async function saveSessions(sessions: Session[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
    throw new Error('Unable to save session data. Please check storage permissions.');
  }
}

export async function loadSessions(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export async function addSession(session: Session): Promise<void> {
  try {
    const existing = await loadSessions();
    const updated = [session, ...existing];
    await saveSessions(updated);
  } catch (error) {
    console.error('Failed to add session:', error);
    throw error;
  }
}
