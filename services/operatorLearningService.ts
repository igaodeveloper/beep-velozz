/**
 * Operator Learning Service
 * Aprendizado contínuo baseado no histórico do operador
 */

import { OperatorLearning, ScanLearningEvent } from '@/types/aiPatternRecognition';
import { PackageType } from '@/types/scanner';
import { ScannedPackage } from '@/types/session';

export class OperatorLearningService {
  private operatorProfiles: Map<string, OperatorLearning> = new Map();
  private learningEvents: ScanLearningEvent[] = [];
  private readonly LEARNING_RATE = 0.1;
  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * Registra evento de aprendizado
   */
  registerLearningEvent(event: ScanLearningEvent): void {
    this.learningEvents.push(event);
    
    // Manter histórico limitado
    if (this.learningEvents.length > this.MAX_HISTORY_SIZE) {
      this.learningEvents = this.learningEvents.slice(-this.MAX_HISTORY_SIZE);
    }

    // Atualizar perfil do operador
    this.updateOperatorProfile(event);
  }

  /**
   * Atualiza perfil do operador com base no evento
   */
  private updateOperatorProfile(event: ScanLearningEvent): void {
    let profile = this.operatorProfiles.get(event.operatorId);
    
    if (!profile) {
      profile = this.createOperatorProfile(event.operatorId, 'Unknown Operator');
      this.operatorProfiles.set(event.operatorId, profile);
    }

    // Atualizar padrões de scan
    this.updateScanPatterns(profile, event);
    
    // Atualizar preferências de tipo
    this.updateTypePreferences(profile, event);
    
    // Atualizar padrões de tempo
    this.updateTimePatterns(profile, event);
    
    // Atualizar histórico de acurácia
    this.updateAccuracyHistory(profile, event);
    
    // Atualizar histórico de velocidade
    this.updateSpeedHistory(profile, event);
    
    // Atualizar sequências preferidas
    this.updatePreferredSequences(profile, event);
    
    // Atualizar erros comuns
    this.updateCommonMistakes(profile, event);
    
    profile.lastUpdated = Date.now();
  }

  /**
   * Cria novo perfil de operador
   */
  private createOperatorProfile(operatorId: string, operatorName: string): OperatorLearning {
    return {
      operatorId,
      operatorName,
      scanPatterns: new Map(),
      codePreferences: new Map(),
      timePatterns: {
        morning: [],
        afternoon: [],
        evening: []
      },
      accuracyHistory: [],
      speedHistory: [],
      preferredSequences: [],
      commonMistakes: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Atualiza padrões de scan
   */
  private updateScanPatterns(profile: OperatorLearning, event: ScanLearningEvent): void {
    // Extrair padrão do código
    const pattern = this.extractCodePattern(event.code);
    
    if (pattern) {
      const currentCount = profile.scanPatterns.get(pattern) || 0;
      profile.scanPatterns.set(pattern, currentCount + 1);
    }
  }

  /**
   * Atualiza preferências de tipo
   */
  private updateTypePreferences(profile: OperatorLearning, event: ScanLearningEvent): void {
    profile.codePreferences.set(event.code, event.actualType);
  }

  /**
   * Atualiza padrões de tempo
   */
  private updateTimePatterns(profile: OperatorLearning, event: ScanLearningEvent): void {
    const hour = new Date(event.timestamp).getHours();
    let timeSlot: 'morning' | 'afternoon' | 'evening';
    
    if (hour >= 6 && hour < 12) {
      timeSlot = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeSlot = 'afternoon';
    } else {
      timeSlot = 'evening';
    }
    
    profile.timePatterns[timeSlot].push(event.processingTime);
    
    // Manter apenas últimos 50 registros por time slot
    if (profile.timePatterns[timeSlot].length > 50) {
      profile.timePatterns[timeSlot] = profile.timePatterns[timeSlot].slice(-50);
    }
  }

  /**
   * Atualiza histórico de acurácia
   */
  private updateAccuracyHistory(profile: OperatorLearning, event: ScanLearningEvent): void {
    const accuracy = event.wasCorrect ? 1 : 0;
    profile.accuracyHistory.push(accuracy);
    
    // Manter apenas últimos 100 registros
    if (profile.accuracyHistory.length > 100) {
      profile.accuracyHistory = profile.accuracyHistory.slice(-100);
    }
  }

  /**
   * Atualiza histórico de velocidade
   */
  private updateSpeedHistory(profile: OperatorLearning, event: ScanLearningEvent): void {
    profile.speedHistory.push(event.processingTime);
    
    // Manter apenas últimos 100 registros
    if (profile.speedHistory.length > 100) {
      profile.speedHistory = profile.speedHistory.slice(-100);
    }
  }

  /**
   * Atualiza sequências preferidas
   */
  private updatePreferredSequences(profile: OperatorLearning, event: ScanLearningEvent): void {
    if (event.context.previousCode) {
      const sequence = `${event.context.previousCode}->${event.code}`;
      
      // Verificar se sequência já existe
      const existingIndex = profile.preferredSequences.findIndex(
        seq => seq.includes(sequence)
      );
      
      if (existingIndex >= 0) {
        // Incrementar frequência
        const parts = profile.preferredSequences[existingIndex].split(':');
        const frequency = parseInt(parts[1] || '1') + 1;
        profile.preferredSequences[existingIndex] = `${sequence}:${frequency}`;
      } else {
        // Adicionar nova sequência
        profile.preferredSequences.push(`${sequence}:1`);
      }
      
      // Manter apenas top 20 sequências
      if (profile.preferredSequences.length > 20) {
        profile.preferredSequences.sort((a, b) => {
          const freqA = parseInt(a.split(':')[1] || '0');
          const freqB = parseInt(b.split(':')[1] || '0');
          return freqB - freqA;
        });
        profile.preferredSequences = profile.preferredSequences.slice(0, 20);
      }
    }
  }

  /**
   * Atualiza erros comuns
   */
  private updateCommonMistakes(profile: OperatorLearning, event: ScanLearningEvent): void {
    if (!event.wasCorrect && event.predictedType && event.predictedType !== event.actualType) {
      const pattern = `Predicted ${event.predictedType}, Actual ${event.actualType}`;
      
      // Verificar se erro já existe
      const existingMistake = profile.commonMistakes.find(
        mistake => mistake.pattern === pattern
      );
      
      if (existingMistake) {
        existingMistake.frequency++;
      } else {
        profile.commonMistakes.push({
          pattern,
          correction: `Use ${event.actualType} for codes like ${event.code}`,
          frequency: 1
        });
      }
      
      // Manter apenas top 10 erros
      if (profile.commonMistakes.length > 10) {
        profile.commonMistakes.sort((a, b) => b.frequency - a.frequency);
        profile.commonMistakes = profile.commonMistakes.slice(0, 10);
      }
    }
  }

  /**
   * Extrai padrão do código
   */
  private extractCodePattern(code: string): string {
    // Remover números para encontrar padrão de letras
    const letters = code.replace(/[0-9]/g, '');
    
    // Remover letras para encontrar padrão de números
    const numbers = code.replace(/[A-Z]/g, '');
    
    // Criar padrão estrutural
    let pattern = '';
    let letterCount = 0;
    let numberCount = 0;
    
    for (const char of code) {
      if (/[A-Z]/.test(char)) {
        if (numberCount > 0) {
          pattern += `N${numberCount}`;
          numberCount = 0;
        }
        letterCount++;
      } else if (/[0-9]/.test(char)) {
        if (letterCount > 0) {
          pattern += `L${letterCount}`;
          letterCount = 0;
        }
        numberCount++;
      }
    }
    
    // Adicionar contagens finais
    if (letterCount > 0) pattern += `L${letterCount}`;
    if (numberCount > 0) pattern += `N${numberCount}`;
    
    return pattern || 'UNKNOWN';
  }

  /**
   * Obtém perfil do operador
   */
  getOperatorProfile(operatorId: string): OperatorLearning | null {
    return this.operatorProfiles.get(operatorId) || null;
  }

  /**
   * Prediz tipo de pacote baseado no histórico do operador
   */
  predictPackageType(
    code: string, 
    operatorId: string,
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
  ): { type: PackageType; confidence: number } {
    const profile = this.operatorProfiles.get(operatorId);
    
    if (!profile) {
      return { type: 'avulso', confidence: 0.5 };
    }

    // 1. Verificar preferências diretas
    const directPreference = profile.codePreferences.get(code);
    if (directPreference) {
      return { type: directPreference, confidence: 0.9 };
    }

    // 2. Verificar padrões similares
    const codePattern = this.extractCodePattern(code);
    const patternMatches = Array.from(profile.codePreferences.entries())
      .filter(([prefCode]) => this.extractCodePattern(prefCode) === codePattern);

    if (patternMatches.length > 0) {
      const typeCounts = new Map<PackageType, number>();
      
      for (const [, type] of patternMatches) {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      }
      
      const dominantType = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      const confidence = Math.min(0.8, typeCounts.get(dominantType)! / patternMatches.length);
      
      return { type: dominantType, confidence };
    }

    // 3. Verificar padrões de scan frequentes
    const scanPattern = this.extractCodePattern(code);
    const patternFrequency = profile.scanPatterns.get(scanPattern) || 0;
    
    if (patternFrequency > 5) {
      // Usar tipo mais comum para este padrão
      const patternCodes = Array.from(profile.codePreferences.keys())
        .filter(c => this.extractCodePattern(c) === scanPattern);
      
      if (patternCodes.length > 0) {
        const typeCounts = new Map<PackageType, number>();
        
        for (const prefCode of patternCodes) {
          const type = profile.codePreferences.get(prefCode)!;
          typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }
        
        const dominantType = Array.from(typeCounts.entries())
          .sort((a, b) => b[1] - a[1])[0][0];
        
        const confidence = Math.min(0.7, typeCounts.get(dominantType)! / patternCodes.length);
        
        return { type: dominantType, confidence };
      }
    }

    // 4. Fallback para tipo preferido do operador
    const preferredTypes = this.getPreferredPackageTypes(profile);
    if (preferredTypes.length > 0) {
      return { type: preferredTypes[0], confidence: 0.6 };
    }

    return { type: 'avulso', confidence: 0.5 };
  }

  /**
   * Obtém tipos de pacote preferidos do operador
   */
  private getPreferredPackageTypes(profile: OperatorLearning): PackageType[] {
    const typeCounts = new Map<PackageType, number>();
    
    for (const [, type] of profile.codePreferences) {
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }
    
    return Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);
  }

  /**
   * Obtém métricas de performance do operador
   */
  getOperatorMetrics(operatorId: string): {
    accuracy: number;
    averageSpeed: number;
    totalScans: number;
    preferredTypes: PackageType[];
    errorPatterns: string[];
    accuracyHistory?: number[];
  } | null {
    const profile = this.operatorProfiles.get(operatorId);
    
    if (!profile) {
      return null;
    }

    const accuracy = profile.accuracyHistory.length > 0
      ? profile.accuracyHistory.reduce((sum, acc) => sum + acc, 0) / profile.accuracyHistory.length
      : 0;

    const averageSpeed = profile.speedHistory.length > 0
      ? profile.speedHistory.reduce((sum, speed) => sum + speed, 0) / profile.speedHistory.length
      : 0;

    const totalScans = profile.accuracyHistory.length;

    const preferredTypes = this.getPreferredPackageTypes(profile);

    const errorPatterns = profile.commonMistakes
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map(mistake => mistake.pattern);

    return {
      accuracy,
      averageSpeed,
      totalScans,
      preferredTypes,
      errorPatterns,
      accuracyHistory: profile.accuracyHistory,
    };
  }

  /**
   * Obtém insights do operador
   */
  getOperatorInsights(operatorId: string): string[] {
    const profile = this.operatorProfiles.get(operatorId);
    const insights: string[] = [];
    
    if (!profile) {
      return insights;
    }

    const metrics = this.getOperatorMetrics(operatorId);
    if (!metrics) return insights;

    // Insights de acurácia
    if (metrics.accuracy > 0.95) {
      insights.push('🎯 Excelente precisão na identificação de pacotes');
    } else if (metrics.accuracy > 0.85) {
      insights.push('✅ Boa acurácia, continue assim!');
    } else if (metrics.accuracy < 0.7) {
      insights.push('⚠️ Considere revisar a identificação de tipos');
    }

    // Insights de velocidade
    if (metrics.averageSpeed < 200) {
      insights.push('⚡ Scanner muito rápido e eficiente');
    } else if (metrics.averageSpeed > 1000) {
      insights.push('🐢 Considere otimizar o tempo de scan');
    }

    // Insights de preferências
    if (metrics.preferredTypes.length > 0) {
      const dominantType = metrics.preferredTypes[0];
      const typeNames: Record<PackageType, string> = {
        shopee: 'Shopee',
        mercado_livre: 'Mercado Livre',
        avulso: 'Avulso',
        unknown: 'Avulso'
      };
      insights.push(`📦 Especialista em pacotes ${typeNames[dominantType]}`);
    }

    // Insights de erros
    if (metrics.errorPatterns.length > 0) {
      insights.push('🔍 Padrões de erro identificados para melhoria');
    }

    // Insights de sequências
    if (profile.preferredSequences.length > 5) {
      insights.push('🔄 Operador com bom reconhecimento de padrões sequenciais');
    }

    return insights;
  }

  /**
   * Exporta dados de aprendizado
   */
  exportLearningData(operatorId?: string): any {
    if (operatorId) {
      return {
        profile: this.operatorProfiles.get(operatorId),
        events: this.learningEvents.filter(event => event.operatorId === operatorId)
      };
    }
    
    return {
      profiles: Object.fromEntries(this.operatorProfiles),
      events: this.learningEvents
    };
  }

  /**
   * Importa dados de aprendizado
   */
  importLearningData(data: any): void {
    if (data.profiles) {
      for (const [id, profile] of Object.entries(data.profiles)) {
        this.operatorProfiles.set(id, profile as OperatorLearning);
      }
    }
    
    if (data.events) {
      this.learningEvents.push(...data.events);
    }
  }

  /**
   * Limpa dados antigos
   */
  clearOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    // Limpar eventos antigos
    this.learningEvents = this.learningEvents.filter(
      event => now - event.timestamp < maxAge
    );
    
    // Limpar perfis inativos
    for (const [id, profile] of this.operatorProfiles.entries()) {
      if (now - profile.lastUpdated > maxAge) {
        this.operatorProfiles.delete(id);
      }
    }
  }
}

// Export singleton instance
export const operatorLearningService = new OperatorLearningService();
