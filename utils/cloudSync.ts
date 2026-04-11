import { Session } from "@/types/session";
import * as SecureStore from "expo-secure-store";

/**
 * Configurações de nuvem
 */
const CLOUD_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || "https://api.beep-velozz.com",
  syncInterval: 5 * 60 * 1000, // 5 minutos
};

/**
 * Fila de sincronização local
 */
const SYNC_QUEUE_KEY = "sync_queue";
const LAST_SYNC_KEY = "last_sync_time";

/**
 * Adiciona uma sessão à fila de sincronização
 */
export async function addToSyncQueue(session: Session): Promise<void> {
  try {
    const queueJSON = await SecureStore.getItemAsync(SYNC_QUEUE_KEY);
    const queue: Session[] = queueJSON ? JSON.parse(queueJSON) : [];
    queue.push(session);
    await SecureStore.setItemAsync(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Erro ao adicionar à fila de sincronização:", error);
  }
}

/**
 * Sincroniza a fila com a nuvem
 */
export async function syncWithCloud(): Promise<{
  success: number;
  failed: number;
  error?: string;
}> {
  try {
    const queueJSON = await SecureStore.getItemAsync(SYNC_QUEUE_KEY);
    const queue: Session[] = queueJSON ? JSON.parse(queueJSON) : [];

    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const session of queue) {
      try {
        const response = await fetch(`${CLOUD_CONFIG.baseURL}/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(session),
        });

        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        console.error("Erro ao sincronizar sessão:", error);
      }
    }

    // Limpar fila se todos foram sincronizados
    if (failedCount === 0) {
      await SecureStore.deleteItemAsync(SYNC_QUEUE_KEY);
      await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString());
    } else {
      // Manter na fila apenas os que falharam
      // (implementação simplificada - em produção seria mais sofisticado)
    }

    return { success: successCount, failed: failedCount };
  } catch (error) {
    return { success: 0, failed: 0, error: String(error) };
  }
}

/**
 * Obtém o status da última sincronização
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const lastSyncJSON = await SecureStore.getItemAsync(LAST_SYNC_KEY);
    return lastSyncJSON ? new Date(lastSyncJSON) : null;
  } catch (error) {
    console.error("Erro ao obter tempo da última sincronização:", error);
    return null;
  }
}

/**
 * Retorna o tamanho da fila de sincronização
 */
export async function getSyncQueueSize(): Promise<number> {
  try {
    const queueJSON = await SecureStore.getItemAsync(SYNC_QUEUE_KEY);
    const queue: Session[] = queueJSON ? JSON.parse(queueJSON) : [];
    return queue.length;
  } catch (error) {
    console.error("Erro ao obter tamanho da fila:", error);
    return 0;
  }
}

/**
 * Inicia sincronização automática periódica
 */
export function startAutoSync(
  onSyncComplete?: (result: { success: number; failed: number }) => void,
) {
  const interval = setInterval(async () => {
    const result = await syncWithCloud();
    if (onSyncComplete) {
      onSyncComplete(result);
    }
  }, CLOUD_CONFIG.syncInterval);

  return () => clearInterval(interval);
}
