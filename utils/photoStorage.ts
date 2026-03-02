import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PHOTOS_DIR = `${FileSystem.Paths.document ?? FileSystem.Paths.cache}/package-photos/`;
const PHOTO_INDEX_KEY = 'photo_index';

/**
 * Inicializa o diretório de fotos
 */
export async function initPhotoStorage(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_DIR, {
        intermediates: true,
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar storage de fotos:', error);
  }
}

/**
 * Salva uma foto de pacote
 */
export async function savePackagePhoto(
  photoUri: string,
  packageCode: string,
  sessionId: string
): Promise<string> {
  try {
    await initPhotoStorage();

    const timestamp = Date.now();
    const fileName = `${sessionId}_${packageCode}_${timestamp}.jpg`;
    const targetPath = `${PHOTOS_DIR}${fileName}`;

    await FileSystem.copyAsync({
      from: photoUri,
      to: targetPath,
    });

    return targetPath;
  } catch (error) {
    console.error('Erro ao salvar foto:', error);
    throw error;
  }
}

/**
 * Lista fotos da sessão
 */
export async function getSessionPhotos(
  sessionId: string
): Promise<
  Array<{
    uri: string;
    packageCode: string;
    timestamp: number;
  }>
> {
  try {
    await initPhotoStorage();

    const files = await FileSystem.readDirectoryAsync(PHOTOS_DIR);

    return files
      .filter((file) => file.startsWith(sessionId))
      .map((file) => {
        const [_, code, timestamp] = file.replace('.jpg', '').split('_');

        return {
          uri: `${PHOTOS_DIR}${file}`,
          packageCode: code,
          timestamp: Number(timestamp),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Erro ao obter fotos da sessão:', error);
    return [];
  }
}

/**
 * Foto específica
 */
export async function getPackagePhoto(
  sessionId: string,
  packageCode: string
): Promise<string | null> {
  try {
    const photos = await getSessionPhotos(sessionId);
    return photos.find((p) => p.packageCode === packageCode)?.uri ?? null;
  } catch (error) {
    console.error('Erro ao obter foto do pacote:', error);
    return null;
  }
}

/**
 * Delete foto
 */
export async function deletePackagePhoto(photoUri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
  }
}

/**
 * Delete todas fotos da sessão
 */
export async function deleteSessionPhotos(
  sessionId: string
): Promise<void> {
  try {
    const photos = await getSessionPhotos(sessionId);

    for (const photo of photos) {
      await deletePackagePhoto(photo.uri);
    }
  } catch (error) {
    console.error('Erro ao deletar fotos da sessão:', error);
  }
}

/**
 * Converte para base64
 */
export async function photoToBase64(
  photoUri: string
): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: 'base64',
    });

    return base64;
  } catch (error) {
    console.error('Erro ao converter foto:', error);
    throw error;
  }
}

/**
 * Tamanho total
 */
export async function getSessionPhotosSize(
  sessionId: string
): Promise<number> {
  try {
    const photos = await getSessionPhotos(sessionId);
    let totalSize = 0;

    for (const photo of photos) {
      const info = await FileSystem.getInfoAsync(photo.uri);
      if (info.exists && info.size) {
        totalSize += info.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Erro ao calcular tamanho:', error);
    return 0;
  }
}

/**
 * Formata bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
    ' ' +
    sizes[i]
  );
}

/**
 * Conta fotos
 */
export async function countSessionPhotos(
  sessionId: string
): Promise<number> {
  try {
    const photos = await getSessionPhotos(sessionId);
    return photos.length;
  } catch (error) {
    console.error('Erro ao contar fotos:', error);
    return 0;
  }
}