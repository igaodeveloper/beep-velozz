/**
 * Video Documentation System
 * Sistema de documentação em vídeo para auditoria e treinamento
 */

import { Session, ScannedPackage } from '@/types/session';
import { Platform } from 'react-native';

export interface VideoRecord {
  id: string;
  sessionId: string;
  packageId?: string;
  type: 'session' | 'package' | 'training' | 'issue';
  uri: string;
  duration: number;
  fileSize: number;
  timestamp: number;
  operatorId: string;
  annotations: VideoAnnotation[];
  thumbnail?: string;
  quality: 'low' | 'medium' | 'high';
  status: 'recording' | 'processing' | 'completed' | 'failed';
}

export interface VideoAnnotation {
  id: string;
  timestamp: number; // em segundos
  type: 'note' | 'issue' | 'highlight' | 'correction';
  text: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  author: string;
  createdAt: number;
}

export interface VideoConfig {
  maxDuration: number; // segundos
  quality: 'low' | 'medium' | 'high';
  compression: boolean;
  autoUpload: boolean;
  enableAudio: boolean;
  enableAnnotations: boolean;
  maxFileSize: number; // bytes
}

class VideoDocumentationManager {
  private config: VideoConfig;
  private recordings: VideoRecord[] = [];
  private isRecording: boolean = false;
  private currentRecording: VideoRecord | null = null;
  private recordingTimer: any = null;

  constructor(config: Partial<VideoConfig> = {}) {
    this.config = {
      maxDuration: 300, // 5 minutos
      quality: 'medium',
      compression: true,
      autoUpload: false,
      enableAudio: true,
      enableAnnotations: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      ...config,
    };
  }

  /**
   * Inicia gravação de vídeo de sessão
   */
  async startSessionRecording(sessionId: string, operatorId: string): Promise<string> {
    if (this.isRecording) {
      throw new Error('Já existe uma gravação em andamento');
    }

    try {
      console.log('🎥 Iniciando gravação de sessão...');
      
      // Simulação de início de gravação
      // Na implementação real:
      // const cameraRef = await this.getCameraRef();
      // const recording = await cameraRef.recordAsync({
      //   maxDuration: this.config.maxDuration,
      //   quality: this.config.quality,
      //   mute: !this.config.enableAudio,
      // });

      const recordingId = `session_${sessionId}_${Date.now()}`;
      const mockUri = `file://videos/${recordingId}.mp4`;

      const recording: VideoRecord = {
        id: recordingId,
        sessionId,
        type: 'session',
        uri: mockUri,
        duration: 0,
        fileSize: 0,
        timestamp: Date.now(),
        operatorId,
        annotations: [],
        quality: this.config.quality,
        status: 'recording',
      };

      this.currentRecording = recording;
      this.isRecording = true;
      this.recordings.push(recording);

      // Inicia timer para atualizar duração
      this.startRecordingTimer();

      console.log('✅ Gravação iniciada:', recordingId);
      return recordingId;

    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      throw error;
    }
  }

  /**
   * Inicia gravação de vídeo para pacote específico
   */
  async startPackageRecording(packageId: string, sessionId: string, operatorId: string): Promise<string> {
    if (this.isRecording) {
      throw new Error('Já existe uma gravação em andamento');
    }

    try {
      console.log('📦 Iniciando gravação de pacote...');

      const recordingId = `package_${packageId}_${Date.now()}`;
      const mockUri = `file://videos/${recordingId}.mp4`;

      const recording: VideoRecord = {
        id: recordingId,
        sessionId,
        packageId,
        type: 'package',
        uri: mockUri,
        duration: 0,
        fileSize: 0,
        timestamp: Date.now(),
        operatorId,
        annotations: [],
        quality: this.config.quality,
        status: 'recording',
      };

      this.currentRecording = recording;
      this.isRecording = true;
      this.recordings.push(recording);

      this.startRecordingTimer();

      console.log('✅ Gravação de pacote iniciada:', recordingId);
      return recordingId;

    } catch (error) {
      console.error('❌ Erro ao iniciar gravação de pacote:', error);
      throw error;
    }
  }

  /**
   * Para a gravação atual
   */
  async stopRecording(): Promise<VideoRecord> {
    if (!this.isRecording || !this.currentRecording) {
      throw new Error('Nenhuma gravação em andamento');
    }

    try {
      console.log('⏹️ Parando gravação...');

      // Para o timer
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      // Simulação de parada de gravação
      // Na implementação real:
      // await cameraRef.stopRecording();

      // Simula processamento do vídeo
      this.currentRecording.status = 'processing';
      
      // Simula compressão se habilitada
      if (this.config.compression) {
        await this.simulateCompression();
      }

      // Finaliza a gravação
      this.currentRecording.status = 'completed';
      this.currentRecording.duration = Math.floor(Math.random() * 120) + 30; // 30-150 segundos
      this.currentRecording.fileSize = Math.floor(Math.random() * 50) + 10; // 10-60MB

      // Gera thumbnail
      this.currentRecording.thumbnail = await this.generateThumbnail(this.currentRecording.uri);

      // Auto upload se habilitado
      if (this.config.autoUpload) {
        await this.uploadVideo(this.currentRecording);
      }

      const completedRecording = { ...this.currentRecording };
      
      this.isRecording = false;
      this.currentRecording = null;

      console.log('✅ Gravação finalizada:', completedRecording.id);
      return completedRecording;

    } catch (error) {
      console.error('❌ Erro ao parar gravação:', error);
      
      if (this.currentRecording) {
        this.currentRecording.status = 'failed';
      }
      
      this.isRecording = false;
      this.currentRecording = null;
      throw error;
    }
  }

  /**
   * Adiciona anotação ao vídeo
   */
  addAnnotation(
    recordingId: string, 
    type: VideoAnnotation['type'], 
    text: string, 
    coordinates?: VideoAnnotation['coordinates'],
    author: string = 'system'
  ): void {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) {
      throw new Error('Gravação não encontrada');
    }

    const annotation: VideoAnnotation = {
      id: `annotation_${Date.now()}`,
      timestamp: recording.duration, // Adiciona no tempo atual
      type,
      text,
      coordinates,
      author,
      createdAt: Date.now(),
    };

    recording.annotations.push(annotation);
    console.log('📝 Anotação adicionada:', annotation.id);
  }

  /**
   * Obtém gravações por sessão
   */
  getRecordingsBySession(sessionId: string): VideoRecord[] {
    return this.recordings.filter(r => r.sessionId === sessionId);
  }

  /**
   * Obtém gravações por operador
   */
  getRecordingsByOperator(operatorId: string): VideoRecord[] {
    return this.recordings.filter(r => r.operatorId === operatorId);
  }

  /**
   * Obtém gravações por tipo
   */
  getRecordingsByType(type: VideoRecord['type']): VideoRecord[] {
    return this.recordings.filter(r => r.type === type);
  }

  /**
   * Busca gravações
   */
  searchRecordings(query: string): VideoRecord[] {
    const lowercaseQuery = query.toLowerCase();
    
    return this.recordings.filter(recording => 
      recording.id.toLowerCase().includes(lowercaseQuery) ||
      recording.sessionId.toLowerCase().includes(lowercaseQuery) ||
      recording.packageId?.toLowerCase().includes(lowercaseQuery) ||
      recording.operatorId.toLowerCase().includes(lowercaseQuery) ||
      recording.annotations.some(annotation => 
        annotation.text.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  /**
   * Exclui gravação
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const index = this.recordings.findIndex(r => r.id === recordingId);
    if (index === -1) {
      throw new Error('Gravação não encontrada');
    }

    const recording = this.recordings[index];

    try {
      // Simula exclusão do arquivo
      console.log('🗑️ Excluindo gravação:', recordingId);
      
      // Na implementação real:
      // await FileSystem.deleteAsync(recording.uri, { idempotent: true });
      
      this.recordings.splice(index, 1);
      console.log('✅ Gravação excluída');

    } catch (error) {
      console.error('❌ Erro ao excluir gravação:', error);
      throw error;
    }
  }

  /**
   * Exporta gravações para análise
   */
  exportRecordings(recordingIds?: string[]): {
    recordings: VideoRecord[];
    metadata: {
      exportDate: string;
      totalRecordings: number;
      totalDuration: number;
      totalSize: number;
    };
  } {
    const recordingsToExport = recordingIds 
      ? this.recordings.filter(r => recordingIds.includes(r.id))
      : [...this.recordings];

    const metadata = {
      exportDate: new Date().toISOString(),
      totalRecordings: recordingsToExport.length,
      totalDuration: recordingsToExport.reduce((sum, r) => sum + r.duration, 0),
      totalSize: recordingsToExport.reduce((sum, r) => sum + r.fileSize, 0),
    };

    return {
      recordings: recordingsToExport,
      metadata,
    };
  }

  /**
   * Obtém estatísticas de gravações
   */
  getRecordingStats(): {
    totalRecordings: number;
    totalDuration: number;
    totalSize: number;
    averageDuration: number;
    recordingsByType: Record<VideoRecord['type'], number>;
    recordingsByQuality: Record<VideoRecord['quality'], number>;
    storageUsage: number;
  } {
    const totalRecordings = this.recordings.length;
    const totalDuration = this.recordings.reduce((sum, r) => sum + r.duration, 0);
    const totalSize = this.recordings.reduce((sum, r) => sum + r.fileSize, 0);
    const averageDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0;

    const recordingsByType = this.recordings.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<VideoRecord['type'], number>);

    const recordingsByQuality = this.recordings.reduce((acc, r) => {
      acc[r.quality] = (acc[r.quality] || 0) + 1;
      return acc;
    }, {} as Record<VideoRecord['quality'], number>);

    const storageUsage = totalSize;
    const maxStorage = this.config.maxFileSize * 100; // Limite simulado

    return {
      totalRecordings,
      totalDuration,
      totalSize,
      averageDuration,
      recordingsByType,
      recordingsByQuality,
      storageUsage,
    };
  }

  /**
   * Verifica status da gravação
   */
  getRecordingStatus(): {
    isRecording: boolean;
    currentRecording?: VideoRecord;
    remainingTime?: number;
  } {
    if (!this.isRecording || !this.currentRecording) {
      return { isRecording: false };
    }

    const remainingTime = Math.max(0, this.config.maxDuration - this.currentRecording.duration);

    return {
      isRecording: true,
      currentRecording: this.currentRecording,
      remainingTime,
    };
  }

  /**
   * Limpa gravações antigas
   */
  async cleanupOldRecordings(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const oldRecordings = this.recordings.filter(r => r.timestamp < cutoffDate);

    for (const recording of oldRecordings) {
      await this.deleteRecording(recording.id);
    }

    console.log(`🧹 Limpadas ${oldRecordings.length} gravações antigas`);
    return oldRecordings.length;
  }

  // Métodos privados

  /**
   * Inicia timer para atualizar duração da gravação
   */
  private startRecordingTimer(): void {
    if (!this.currentRecording) return;

    this.recordingTimer = setInterval(() => {
      if (this.currentRecording) {
        this.currentRecording.duration += 1;
        
        // Verifica se atingiu duração máxima
        if (this.currentRecording.duration >= this.config.maxDuration) {
          console.log('⏰ Duração máxima atingida, parando gravação...');
          this.stopRecording().catch(console.error);
        }
      }
    }, 1000);
  }

  /**
   * Simula compressão de vídeo
   */
  private async simulateCompression(): Promise<void> {
    return new Promise(resolve => {
      console.log('🗜️ Comprimindo vídeo...');
      setTimeout(() => {
        console.log('✅ Vídeo comprimido');
        resolve();
      }, 2000);
    });
  }

  /**
   * Gera thumbnail do vídeo
   */
  private async generateThumbnail(videoUri: string): Promise<string> {
    // Simulação de geração de thumbnail
    // Na implementação real:
    // const thumbnail = await VideoThumbnails.getThumbnailAsync(videoUri, {
    //   time: 1000,
    // });
    // return thumbnail.uri;
    
    return `${videoUri}_thumbnail.jpg`;
  }

  /**
   * Faz upload do vídeo
   */
  private async uploadVideo(recording: VideoRecord): Promise<void> {
    try {
      console.log('☁️ Fazendo upload do vídeo...');
      
      // Simulação de upload
      // Na implementação real:
      // const formData = new FormData();
      // formData.append('video', {
      //   uri: recording.uri,
      //   type: 'video/mp4',
      //   name: `${recording.id}.mp4`,
      // });
      // await fetch('https://api.example.com/upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Upload concluído');

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw error;
    }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<VideoConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): VideoConfig {
    return { ...this.config };
  }

  /**
   * Limpa recursos
   */
  cleanup(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    this.isRecording = false;
    this.currentRecording = null;
  }
}

// Export singleton
export const videoDocumentationManager = new VideoDocumentationManager();
