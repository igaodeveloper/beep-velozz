/**
 * Advanced Pattern Detection Service
 * Detecção automática de padrões em códigos e sequências
 */

import { DetectedPattern } from "@/types/aiPatternRecognition";

export class PatternDetectionService {
  private patterns: Map<string, DetectedPattern> = new Map();
  private readonly MIN_PATTERN_LENGTH = 3;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Analisa uma lista de códigos em busca de padrões
   */
  analyzePatterns(codes: string[]): DetectedPattern[] {
    const detectedPatterns: DetectedPattern[] = [];

    if (codes.length < this.MIN_PATTERN_LENGTH) {
      return detectedPatterns;
    }

    // Detectar padrões sequenciais numéricos
    const sequentialPatterns = this.detectSequentialPatterns(codes);
    detectedPatterns.push(...sequentialPatterns);

    // Detectar padrões de prefixo
    const prefixPatterns = this.detectPrefixPatterns(codes);
    detectedPatterns.push(...prefixPatterns);

    // Detectar padrões de sufixo
    const suffixPatterns = this.detectSuffixPatterns(codes);
    detectedPatterns.push(...suffixPatterns);

    // Detectar padrões alfanuméricos
    const alphanumericPatterns = this.detectAlphanumericPatterns(codes);
    detectedPatterns.push(...alphanumericPatterns);

    // Detectar padrões mistos
    const mixedPatterns = this.detectMixedPatterns(codes);
    detectedPatterns.push(...mixedPatterns);

    // Filtrar por confiança e ordenar
    return detectedPatterns
      .filter((pattern) => pattern.confidence >= this.CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detecta padrões sequenciais (ex: 001, 002, 003)
   */
  private detectSequentialPatterns(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Extrair partes numéricas dos códigos
    const numericParts = codes
      .map((code) => {
        const matches = code.match(/\d+/g);
        return matches ? matches.join("") : "";
      })
      .filter((part) => part.length > 0);

    if (numericParts.length < this.MIN_PATTERN_LENGTH) {
      return patterns;
    }

    // Verificar sequências
    for (let i = 0; i <= numericParts.length - this.MIN_PATTERN_LENGTH; i++) {
      const sequence = numericParts.slice(i, i + this.MIN_PATTERN_LENGTH);
      const differences = this.calculateDifferences(sequence);

      if (this.isConsistentSequence(differences)) {
        const commonDiff = differences[0];
        const confidence = this.calculateSequenceConfidence(
          sequence,
          commonDiff,
        );

        // Prever próximo código
        const lastNumber = parseInt(sequence[sequence.length - 1]);
        const nextNumber = lastNumber + commonDiff;

        patterns.push({
          type: "sequential",
          confidence,
          pattern: `Sequential +${commonDiff}`,
          examples: codes.slice(i, i + this.MIN_PATTERN_LENGTH),
          nextPredicted: this.replaceNumericInCode(
            codes[i + this.MIN_PATTERN_LENGTH - 1],
            nextNumber,
          ),
          metadata: {
            sequenceLength: sequence.length,
            commonDifference: commonDiff,
            detectedAt: Date.now(),
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detecta padrões de prefixo comum
   */
  private detectPrefixPatterns(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const prefixMap = new Map<string, string[]>();

    // Agrupar códigos por prefixo
    for (const code of codes) {
      for (let len = 2; len <= Math.min(6, code.length); len++) {
        const prefix = code.substring(0, len);
        if (!prefixMap.has(prefix)) {
          prefixMap.set(prefix, []);
        }
        prefixMap.get(prefix)!.push(code);
      }
    }

    // Verificar prefixos com múltiplas ocorrências
    for (const [prefix, codeList] of prefixMap.entries()) {
      if (codeList.length >= this.MIN_PATTERN_LENGTH) {
        const confidence = Math.min(codeList.length / codes.length, 1.0);

        patterns.push({
          type: "prefix",
          confidence,
          pattern: `Prefix: ${prefix}`,
          examples: codeList.slice(0, 5),
          metadata: {
            sequenceLength: codeList.length,
            prefix,
            detectedAt: Date.now(),
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detecta padrões de sufixo comum
   */
  private detectSuffixPatterns(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const suffixMap = new Map<string, string[]>();

    // Agrupar códigos por sufixo
    for (const code of codes) {
      for (let len = 2; len <= Math.min(6, code.length); len++) {
        const suffix = code.substring(code.length - len);
        if (!suffixMap.has(suffix)) {
          suffixMap.set(suffix, []);
        }
        suffixMap.get(suffix)!.push(code);
      }
    }

    // Verificar sufixos com múltiplas ocorrências
    for (const [suffix, codeList] of suffixMap.entries()) {
      if (codeList.length >= this.MIN_PATTERN_LENGTH) {
        const confidence = Math.min(codeList.length / codes.length, 1.0);

        patterns.push({
          type: "suffix",
          confidence,
          pattern: `Suffix: ${suffix}`,
          examples: codeList.slice(0, 5),
          metadata: {
            sequenceLength: codeList.length,
            suffix,
            detectedAt: Date.now(),
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detecta padrões alfanuméricos
   */
  private detectAlphanumericPatterns(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Verificar estrutura alfanumérica consistente
    const structures = codes.map((code) => this.analyzeCodeStructure(code));
    const structureCounts = new Map<string, number>();

    for (const structure of structures) {
      structureCounts.set(structure, (structureCounts.get(structure) || 0) + 1);
    }

    for (const [structure, count] of structureCounts.entries()) {
      if (count >= this.MIN_PATTERN_LENGTH) {
        const confidence = count / codes.length;

        patterns.push({
          type: "alphanumeric",
          confidence,
          pattern: `Structure: ${structure}`,
          examples: codes.slice(0, 5),
          metadata: {
            sequenceLength: count,
            detectedAt: Date.now(),
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detecta padrões mistos complexos
   */
  private detectMixedPatterns(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Padrão: letras + números sequenciais (ex: BR001, BR002, BR003)
    const letterNumberPatterns = this.detectLetterNumberSequences(codes);
    patterns.push(...letterNumberPatterns);

    // Padrão: timestamp ou data nos códigos
    const timestampPatterns = this.detectTimestampPatterns(codes);
    patterns.push(...timestampPatterns);

    return patterns;
  }

  /**
   * Detecta sequências de letras + números
   */
  private detectLetterNumberSequences(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const letterPrefixMap = new Map<string, string[]>();

    for (const code of codes) {
      const match = code.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const [, letters, numbers] = match;
        const key = `${letters}_${numbers.length}`;

        if (!letterPrefixMap.has(key)) {
          letterPrefixMap.set(key, []);
        }
        letterPrefixMap.get(key)!.push(code);
      }
    }

    for (const [key, codeList] of letterPrefixMap.entries()) {
      if (codeList.length >= this.MIN_PATTERN_LENGTH) {
        const [letters, numLength] = key.split("_");
        const numericParts = codeList.map((code) => {
          const match = code.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        });

        const differences = this.calculateDifferences(
          numericParts.map((n) => n.toString()),
        );

        if (this.isConsistentSequence(differences)) {
          const confidence = Math.min(codeList.length / codes.length, 1.0);

          patterns.push({
            type: "mixed",
            confidence,
            pattern: `${letters} + sequential numbers (${numLength} digits)`,
            examples: codeList.slice(0, 5),
            metadata: {
              sequenceLength: codeList.length,
              prefix: letters,
              detectedAt: Date.now(),
            },
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detecta padrões de timestamp
   */
  private detectTimestampPatterns(codes: string[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const timestampRegex = /\d{10,13}/; // Unix timestamp

    const timestampCodes = codes.filter((code) => timestampRegex.test(code));

    if (timestampCodes.length >= this.MIN_PATTERN_LENGTH) {
      const confidence = timestampCodes.length / codes.length;

      patterns.push({
        type: "numeric",
        confidence,
        pattern: "Timestamp pattern detected",
        examples: timestampCodes.slice(0, 5),
        metadata: {
          sequenceLength: timestampCodes.length,
          detectedAt: Date.now(),
        },
      });
    }

    return patterns;
  }

  /**
   * Calcula diferenças entre elementos consecutivos
   */
  private calculateDifferences(sequence: string[]): number[] {
    const differences: number[] = [];

    for (let i = 1; i < sequence.length; i++) {
      const current = parseInt(sequence[i]) || 0;
      const previous = parseInt(sequence[i - 1]) || 0;
      differences.push(current - previous);
    }

    return differences;
  }

  /**
   * Verifica se as diferenças são consistentes
   */
  private isConsistentSequence(differences: number[]): boolean {
    if (differences.length === 0) return false;

    const firstDiff = differences[0];
    return differences.every((diff) => Math.abs(diff - firstDiff) <= 1);
  }

  /**
   * Calcula confiança da sequência
   */
  private calculateSequenceConfidence(
    sequence: string[],
    commonDiff: number,
  ): number {
    let confidence = 0.8; // Base confidence

    // Aumentar confiança para sequências mais longas
    confidence += Math.min(sequence.length * 0.05, 0.2);

    // Aumentar confiança para diferenças comuns (1, 10, 100)
    if ([1, 10, 100].includes(Math.abs(commonDiff))) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Analisa estrutura do código
   */
  private analyzeCodeStructure(code: string): string {
    let structure = "";

    for (const char of code) {
      if (/[A-Z]/.test(char)) {
        structure += "L";
      } else if (/[0-9]/.test(char)) {
        structure += "N";
      } else {
        structure += "S";
      }
    }

    return structure;
  }

  /**
   * Substitui parte numérica em um código
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
   * Obtém padrões detectados
   */
  getDetectedPatterns(): DetectedPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Limpa padrões antigos
   */
  clearOldPatterns(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();

    for (const [id, pattern] of this.patterns.entries()) {
      if (now - pattern.metadata.detectedAt > maxAge) {
        this.patterns.delete(id);
      }
    }
  }
}

// Export singleton instance
export const patternDetectionService = new PatternDetectionService();
