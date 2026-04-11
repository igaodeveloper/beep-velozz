/**
 * Smart Suggestions Service
 * Gera sugestões inteligentes baseadas em padrões e histórico
 */

import { SmartSuggestion, DetectedPattern } from "@/types/aiPatternRecognition";
import { PackageType } from "@/types/scanner";
import { ScannedPackage } from "@/types/session";
import { patternDetectionService } from "./patternDetectionService";

export class SmartSuggestionsService {
  private readonly MAX_SUGGESTIONS = 5;
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private suggestionHistory: Map<string, SmartSuggestion[]> = new Map();

  /**
   * Gera sugestões inteligentes para o próximo código
   */
  generateSmartSuggestions(
    recentPackages: ScannedPackage[],
    operatorId?: string,
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (recentPackages.length === 0) {
      return suggestions;
    }

    const recentCodes = recentPackages.map((pkg) => pkg.code);
    const recentTypes = recentPackages.map((pkg) => pkg.type);

    // 1. Sugestões baseadas em padrões sequenciais
    const sequentialSuggestions = this.generateSequentialSuggestions(
      recentCodes,
      recentTypes,
    );
    suggestions.push(...sequentialSuggestions);

    // 2. Sugestões baseadas em padrões detectados
    const patternSuggestions = this.generatePatternBasedSuggestions(
      recentCodes,
      recentTypes,
    );
    suggestions.push(...patternSuggestions);

    // 3. Sugestões baseadas em histórico do operador
    if (operatorId) {
      const operatorSuggestions = this.generateOperatorBasedSuggestions(
        recentCodes,
        operatorId,
      );
      suggestions.push(...operatorSuggestions);
    }

    // 4. Sugestões baseadas em similaridade
    const similaritySuggestions = this.generateSimilaritySuggestions(
      recentCodes,
      recentTypes,
    );
    suggestions.push(...similaritySuggestions);

    // 5. Sugestões baseadas em contexto da sessão
    const contextSuggestions =
      this.generateContextualSuggestions(recentPackages);
    suggestions.push(...contextSuggestions);

    // Ordenar por confiança e prioridade
    return this.rankAndFilterSuggestions(suggestions);
  }

  /**
   * Gera sugestões sequenciais
   */
  private generateSequentialSuggestions(
    codes: string[],
    types: PackageType[],
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (codes.length < 2) return suggestions;

    // Verificar sequência numérica
    const lastTwoCodes = codes.slice(-2);
    const numericParts = lastTwoCodes.map((code) => {
      const matches = code.match(/\d+/g);
      return matches ? parseInt(matches[matches.length - 1]) : null;
    });

    if (numericParts[0] !== null && numericParts[1] !== null) {
      const diff = numericParts[1] - numericParts[0];

      // Verificar se é uma diferença comum
      if (Math.abs(diff) <= 100 && diff !== 0) {
        const nextNumber = numericParts[1] + diff;
        const nextCode = this.replaceNumericInCode(lastTwoCodes[1], nextNumber);

        suggestions.push({
          id: `seq_${Date.now()}`,
          code: nextCode,
          type: types[types.length - 1],
          confidence: 0.85,
          reason: `Sequência detectada: +${diff}`,
          source: "sequential",
          priority: "high",
          metadata: {
            predictedSuccess: 0.9,
            patternId: `sequence_${diff}`,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Gera sugestões baseadas em padrões detectados
   */
  private generatePatternBasedSuggestions(
    codes: string[],
    types: PackageType[],
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Detectar padrões nos códigos recentes
    const patterns = patternDetectionService.analyzePatterns(codes);

    for (const pattern of patterns) {
      if (pattern.nextPredicted) {
        const predictedType = this.predictPackageType(
          pattern.nextPredicted,
          types,
        );

        suggestions.push({
          id: `pattern_${Date.now()}_${pattern.type}`,
          code: pattern.nextPredicted,
          type: predictedType,
          confidence: pattern.confidence * 0.9,
          reason: `Padrão ${pattern.type}: ${pattern.pattern}`,
          source: "pattern",
          priority: pattern.confidence > 0.8 ? "high" : "medium",
          metadata: {
            patternId: `pattern_${pattern.type}`,
            predictedSuccess: pattern.confidence,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Gera sugestões baseadas no histórico do operador
   */
  private generateOperatorBasedSuggestions(
    codes: string[],
    operatorId: string,
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const operatorHistory = this.suggestionHistory.get(operatorId) || [];

    // Encontrar padrões frequentes do operador
    const frequentPatterns = this.findFrequentOperatorPatterns(operatorHistory);

    for (const pattern of frequentPatterns) {
      if (this.isPatternApplicable(pattern, codes)) {
        const nextCode = this.generateCodeFromPattern(pattern, codes);

        suggestions.push({
          id: `operator_${Date.now()}_${pattern.id}`,
          code: nextCode,
          type: pattern.type,
          confidence: pattern.confidence * 0.8,
          reason: `Padrão frequente do operador: ${pattern.description}`,
          source: "operator_habit",
          priority: "medium",
          metadata: {
            operatorAccuracy: pattern.accuracy,
            historicalMatches: pattern.frequency,
            predictedSuccess: pattern.confidence,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Gera sugestões baseadas em similaridade
   */
  private generateSimilaritySuggestions(
    codes: string[],
    types: PackageType[],
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (codes.length < 3) return suggestions;

    // Encontrar códigos similares no histórico
    const lastCode = codes[codes.length - 1];
    const similarCodes = this.findSimilarCodes(lastCode, codes.slice(0, -1));

    for (const similarCode of similarCodes) {
      const index = codes.indexOf(similarCode);

      if (index < codes.length - 2) {
        const nextInSequence = codes[index + 1];

        suggestions.push({
          id: `similarity_${Date.now()}`,
          code: nextInSequence,
          type: types[index + 1],
          confidence: 0.7,
          reason: `Similar a ${similarCode} encontrado anteriormente`,
          source: "history",
          priority: "medium",
          metadata: {
            historicalMatches: 1,
            predictedSuccess: 0.6,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Gera sugestões contextuais baseadas na sessão
   */
  private generateContextualSuggestions(
    packages: ScannedPackage[],
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Analisar distribuição de tipos
    const typeCount = this.countPackageTypes(packages);
    const dominantType = this.findDominantType(typeCount);

    // Se há um tipo dominante, sugerir códigos desse tipo
    if (dominantType && typeCount[dominantType] >= 3) {
      const lastCode = packages[packages.length - 1].code;
      const suggestedCode = this.generateCodeForType(dominantType, lastCode);

      suggestions.push({
        id: `context_${Date.now()}`,
        code: suggestedCode,
        type: dominantType,
        confidence: 0.6,
        reason: `Tipo predominante na sessão: ${dominantType}`,
        source: "ml_model",
        priority: "low",
        metadata: {
          predictedSuccess: 0.5,
        },
      });
    }

    return suggestions;
  }

  /**
   * Ordena e filtra sugestões
   */
  private rankAndFilterSuggestions(
    suggestions: SmartSuggestion[],
  ): SmartSuggestion[] {
    // Remover duplicados
    const uniqueSuggestions = new Map<string, SmartSuggestion>();

    for (const suggestion of suggestions) {
      const existing = uniqueSuggestions.get(suggestion.code);

      if (!existing || suggestion.confidence > existing.confidence) {
        uniqueSuggestions.set(suggestion.code, suggestion);
      }
    }

    // Ordenar por confiança e prioridade
    const sorted = Array.from(uniqueSuggestions.values()).sort((a, b) => {
      // Primeiro por prioridade
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // Depois por confiança
      return b.confidence - a.confidence;
    });

    // Filtrar por confiança e limitar quantidade
    return sorted
      .filter((s) => s.confidence >= this.CONFIDENCE_THRESHOLD)
      .slice(0, this.MAX_SUGGESTIONS);
  }

  /**
   * Encontra padrões frequentes do operador
   */
  private findFrequentOperatorPatterns(history: SmartSuggestion[]): any[] {
    // Implementação simplificada - em produção usaria ML real
    return [];
  }

  /**
   * Verifica se padrão é aplicável
   */
  private isPatternApplicable(pattern: any, codes: string[]): boolean {
    return true; // Implementação simplificada
  }

  /**
   * Gera código baseado em padrão
   */
  private generateCodeFromPattern(pattern: any, codes: string[]): string {
    return codes[codes.length - 1]; // Implementação simplificada
  }

  /**
   * Encontra códigos similares
   */
  private findSimilarCodes(target: string, candidates: string[]): string[] {
    const similar: string[] = [];
    const threshold = 0.7; // 70% de similaridade

    for (const candidate of candidates) {
      const similarity = this.calculateSimilarity(target, candidate);
      if (similarity >= threshold) {
        similar.push(candidate);
      }
    }

    return similar;
  }

  /**
   * Calcula similaridade entre strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Distância de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Prediz tipo de pacote baseado no código
   */
  private predictPackageType(
    code: string,
    recentTypes: PackageType[],
  ): PackageType {
    // Usar tipo mais recente como padrão
    return recentTypes[recentTypes.length - 1] || "avulso";
  }

  /**
   * Substitui parte numérica no código
   */
  private replaceNumericInCode(code: string, newNumber: number): string {
    const match = code.match(/(\d+)/);
    if (match) {
      const numLength = match[1].length;
      const paddedNumber = newNumber.toString().padStart(numLength, "0");
      return code.replace(match[0], paddedNumber);
    }
    return code;
  }

  /**
   * Conta tipos de pacotes
   */
  private countPackageTypes(
    packages: ScannedPackage[],
  ): Record<PackageType, number> {
    const counts: Record<PackageType, number> = {
      shopee: 0,
      mercado_livre: 0,
      avulso: 0,
      unknown: 0,
    };

    for (const pkg of packages) {
      counts[pkg.type]++;
    }

    return counts;
  }

  /**
   * Encontra tipo dominante
   */
  private findDominantType(
    counts: Record<PackageType, number>,
  ): PackageType | null {
    let maxCount = 0;
    let dominantType: PackageType | null = null;

    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type as PackageType;
      }
    }

    return dominantType;
  }

  /**
   * Gera código para tipo específico
   */
  private generateCodeForType(
    type: PackageType,
    referenceCode: string,
  ): string {
    const now = Date.now();

    switch (type) {
      case "shopee":
        return `BR${Math.floor(Math.random() * 1000000000)}`;
      case "mercado_livre":
        return `20000${Math.floor(Math.random() * 1000000)}`;
      case "avulso":
        return `LM${Math.floor(Math.random() * 100000)}`;
      default:
        return `UNK${now}`;
    }
  }

  /**
   * Registra feedback do operador
   */
  registerSuggestionFeedback(suggestionId: string, wasUsed: boolean): void {
    // Implementar feedback para aprendizado
  }

  /**
   * Limpa histórico antigo
   */
  clearOldHistory(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    // Implementar limpeza de histórico
  }
}

// Export singleton instance
export const smartSuggestionsService = new SmartSuggestionsService();
