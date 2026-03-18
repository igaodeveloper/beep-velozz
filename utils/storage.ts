import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/types/session';

const SESSIONS_KEY = 'logmanager_sessions';

export async function saveSessions(sessions: Session[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function loadSessions(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    const sessions = JSON.parse(raw) as Session[];
    // Remover sessões duplicadas (manter a mais recente de cada ID)
    const uniqueSessions = sessions.filter((session, index, arr) => 
      arr.findIndex(s => s.id === session.id) === index
    );
    // Se removeu duplicatas, salvar novamente
    if (uniqueSessions.length !== sessions.length) {
      await saveSessions(uniqueSessions);
      console.log(`Removidas ${sessions.length - uniqueSessions.length} sessões duplicadas`);
    }
    return uniqueSessions;
  } catch {
    return [];
  }
}

export async function addSession(session: Session): Promise<void> {
  const existing = await loadSessions();
  // Verificar se já existe sessão com mesmo ID para evitar duplicação
  const hasDuplicate = existing.some(s => s.id === session.id);
  if (hasDuplicate) {
    console.warn('Sessão duplicada ignorada:', session.id);
    return;
  }
  const updated = [session, ...existing];
  await saveSessions(updated);
}
