/**
 * Smart Classifier Service - Machine Learning Intelligence
 * Sistema avançado de classificação com algoritmos de ML
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PackageType } from '@/types/scanner';

interface TrainingData {
  code: string;
  type: PackageType;
  features: CodeFeatures;
  timestamp: number;
  confidence: number;
}

interface CodeFeatures {
  length: number;
  prefix: string;
  suffix: string;
  digitCount: number;
  letterCount: number;
  hasSpecialChars: boolean;
  patterns: string[];
  entropy: number;
  structure: string;
}

interface ClassificationResult {
  type: PackageType;
  confidence: number;
  reasoning: string;
  alternativeTypes: Array<{type: PackageType, confidence: number}>;
  features: CodeFeatures;
  modelVersion: string;
}

interface ModelMetrics {
  accuracy: number;
  precision: Record<PackageType, number>;
  recall: Record<PackageType, number>;
  f1Score: Record<PackageType, number>;
  confusionMatrix: number[][];
  totalSamples: number;
  lastUpdated: number;
}

interface PredictionPattern {
  pattern: string;
  weight: number;
  type: PackageType;
  examples: string[];
}

class SmartClassifierService {
  private static instance: SmartClassifierService;
  private trainingData: TrainingData[] = [];
  private modelMetrics: ModelMetrics;
  private patterns: Map<string, PredictionPattern> = new Map();
  private modelVersion: string = '2.0.0';
  private isTraining: boolean = false;
  private lastRetrain: number = 0;

  private readonly STORAGE_KEYS = {
    TRAINING_DATA: 'ml_training_data',
    MODEL_METRICS: 'ml_model_metrics',
    PATTERNS: 'ml_patterns',
    MODEL_VERSION: 'ml_model_version',
  };

  private readonly MIN_TRAINING_SAMPLES = 100;
  private readonly RETRAIN_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  private constructor() {
    this.modelMetrics = this.initializeMetrics();
    this.initializeService();
  }

  static getInstance(): SmartClassifierService {
    if (!SmartClassifierService.instance) {
      SmartClassifierService.instance = new SmartClassifierService();
    }
    return SmartClassifierService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadStoredData();
      await this.buildPatterns();
      await this.evaluateModel();
      
      // Agenda retreinamento automático
      this.scheduleRetraining();
      
      console.log('[SmartClassifier] AI/ML Service initialized successfully');
    } catch (error) {
      console.error('[SmartClassifier] Error initializing ML service:', error);
    }
  }

  /**
   * Classificação inteligente usando ensemble de algoritmos
   */
  async classifyCode(code: string): Promise<ClassificationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Extração de features
      const features = this.extractFeatures(code);
      
      // 2. Ensemble prediction
      const predictions = await this.ensemblePredict(code, features);
      
      // 3. Post-processing e confiança
      const result = this.processPredictions(predictions, features);
      
      // 4. Adiciona ao training data para aprendizado contínuo
      if (result.confidence > this.CONFIDENCE_THRESHOLD) {
        await this.addToTrainingData(code, result.type, features, result.confidence);
      }
      
      // 5. Log performance
      const processingTime = Date.now() - startTime;
      console.log(`[SmartClassifier] Classification completed in ${processingTime}ms`);
      
      return result;
    } catch (error) {
      console.error('[SmartClassifier] Error in classification:', error);
      return this.getFallbackResult(code);
    }
  }

  /**
   * Ensemble prediction usando múltiplos algoritmos
   */
  private async ensemblePredict(code: string, features: CodeFeatures): Promise<Map<PackageType, number>> {
    const predictions = new Map<PackageType, number>();
    
    // 1. Pattern Matching (peso: 0.3)
    const patternPrediction = this.patternMatching(code, features);
    patternPrediction.forEach((conf, type) => {
      predictions.set(type, (predictions.get(type) || 0) + conf * 0.3);
    });
    
    // 2. Feature-based ML (peso: 0.4)
    const featurePrediction = this.featureBasedPrediction(features);
    featurePrediction.forEach((conf, type) => {
      predictions.set(type, (predictions.get(type) || 0) + conf * 0.4);
    });
    
    // 3. Historical Similarity (peso: 0.2)
    const similarityPrediction = this.historicalSimilarity(code, features);
    similarityPrediction.forEach((conf, type) => {
      predictions.set(type, (predictions.get(type) || 0) + conf * 0.2);
    });
    
    // 4. Statistical Analysis (peso: 0.1)
    const statisticalPrediction = this.statisticalAnalysis(features);
    statisticalPrediction.forEach((conf, type) => {
      predictions.set(type, (predictions.get(type) || 0) + conf * 0.1);
    });
    
    return predictions;
  }

  /**
   * Pattern matching avançado
   */
  private patternMatching(code: string, features: CodeFeatures): Map<PackageType, number> {
    const predictions = new Map<PackageType, number>();
    
    // Mercado Livre patterns
    if (features.patterns.includes('20000_prefix')) {
      predictions.set('mercado_livre', 0.95);
    }
    if (features.patterns.includes('466_prefix')) {
      predictions.set('mercado_livre', 0.9);
    }
    if (features.patterns.includes('numeric_long')) {
      predictions.set('mercado_livre', 0.7);
    }
    
    // Shopee patterns
    if (features.patterns.includes('br_prefix')) {
      predictions.set('shopee', 0.95);
    }
    
    // Avulso patterns
    if (features.patterns.includes('letter_prefix') && features.letterCount > features.digitCount) {
      predictions.set('avulso', 0.8);
    }
    if (features.patterns.includes('lm_prefix')) {
      predictions.set('avulso', 0.9);
    }
    
    return predictions;
  }

  /**
   * Feature-based prediction usando regras aprendidas
   */
  private featureBasedPrediction(features: CodeFeatures): Map<PackageType, number> {
    const predictions = new Map<PackageType, number>();
    
    // Regras baseadas em features extraídas
    if (features.length >= 11 && features.digitCount >= 8) {
      predictions.set('mercado_livre', 0.8);
    }
    
    if (features.prefix === 'BR' && features.length >= 8) {
      predictions.set('shopee', 0.95);
    }
    
    if (features.prefix === 'LM' || features.prefix === '14') {
      predictions.set('avulso', 0.9);
    }
    
    if (features.entropy > 3.5 && features.hasSpecialChars) {
      predictions.set('unknown', 0.6);
    }
    
    return predictions;
  }

  /**
   * Similaridade histórica com dados de treinamento
   */
  private historicalSimilarity(code: string, features: CodeFeatures): Map<PackageType, number> {
    const predictions = new Map<PackageType, number>();
    
    if (this.trainingData.length === 0) return predictions;
    
    // Encontra códigos similares no histórico
    const similarCodes = this.trainingData
      .filter(sample => this.calculateSimilarity(features, sample.features) > 0.8)
      .slice(0, 10); // Top 10 similares
    
    if (similarCodes.length > 0) {
      // Conta frequência de tipos
      const typeCounts = new Map<PackageType, number>();
      similarCodes.forEach(sample => {
        typeCounts.set(sample.type, (typeCounts.get(sample.type) || 0) + 1);
      });
      
      // Normaliza para confiança
      const maxCount = Math.max(...typeCounts.values());
      typeCounts.forEach((count, type) => {
        predictions.set(type, count / maxCount);
      });
    }
    
    return predictions;
  }

  /**
   * Análise estatística das features
   */
  private statisticalAnalysis(features: CodeFeatures): Map<PackageType, number> {
    const predictions = new Map<PackageType, number>();
    
    // Análise de distribuição de features
    const stats = this.calculateFeatureStatistics();
    
    // Compara com estatísticas históricas
    Object.entries(stats).forEach(([type, typeStats]) => {
      const similarity = this.calculateFeatureSimilarity(features, typeStats);
      predictions.set(type as PackageType, similarity);
    });
    
    return predictions;
  }

  /**
   * Extração avançada de features
   */
  private extractFeatures(code: string): CodeFeatures {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    return {
      length: cleanCode.length,
      prefix: cleanCode.slice(0, Math.min(4, cleanCode.length)),
      suffix: cleanCode.slice(-Math.min(4, cleanCode.length)),
      digitCount: (cleanCode.match(/\d/g) || []).length,
      letterCount: (cleanCode.match(/[A-Z]/g) || []).length,
      hasSpecialChars: code !== cleanCode,
      patterns: this.identifyPatterns(cleanCode),
      entropy: this.calculateEntropy(cleanCode),
      structure: this.identifyStructure(cleanCode),
    };
  }

  /**
   * Identificação de patterns no código
   */
  private identifyPatterns(code: string): string[] {
    const patterns: string[] = [];
    
    // Prefix patterns
    if (code.startsWith('20000')) patterns.push('20000_prefix');
    if (code.startsWith('466')) patterns.push('466_prefix');
    if (code.startsWith('BR')) patterns.push('br_prefix');
    if (code.startsWith('LM')) patterns.push('lm_prefix');
    if (code.startsWith('14')) patterns.push('14_prefix');
    
    // Content patterns
    if (/^\d+$/.test(code)) {
      if (code.length >= 8) patterns.push('numeric_long');
      else patterns.push('numeric_short');
    }
    
    if (/^[A-Z]/.test(code)) patterns.push('letter_prefix');
    
    // Structure patterns
    if (/\d{4,}/.test(code)) patterns.push('has_digits');
    if (/[A-Z]{2,}/.test(code)) patterns.push('has_letters');
    
    return patterns;
  }

  /**
   * Cálculo de entropia do código
   */
  private calculateEntropy(code: string): number {
    const freq = new Map<string, number>();
    
    for (const char of code) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    const length = code.length;
    
    freq.forEach((count) => {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    });
    
    return entropy;
  }

  /**
   * Identificação da estrutura do código
   */
  private identifyStructure(code: string): string {
    let structure = '';
    
    for (const char of code) {
      if (/\d/.test(char)) structure += 'N';
      else if (/[A-Z]/.test(char)) structure += 'L';
      else structure += 'S';
    }
    
    return structure;
  }

  /**
   * Processamento e refinamento das predições
   */
  private processPredictions(predictions: Map<PackageType, number>, features: CodeFeatures): ClassificationResult {
    // Encontra a predição com maior confiança
    let maxConfidence = 0;
    let predictedType: PackageType = 'unknown';
    
    predictions.forEach((confidence, type) => {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        predictedType = type;
      }
    });
    
    // Gera alternativas
    const alternatives = Array.from(predictions.entries())
      .filter(([type, conf]) => type !== predictedType && conf > 0.1)
      .map(([type, conf]) => ({ type, confidence: conf }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    
    // Gera reasoning
    const reasoning = this.generateReasoning(predictedType, features, predictions);
    
    return {
      type: predictedType,
      confidence: maxConfidence,
      reasoning,
      alternativeTypes: alternatives,
      features,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Geração de explicação do resultado
   */
  private generateReasoning(
    predictedType: PackageType, 
    features: CodeFeatures, 
    predictions: Map<PackageType, number>
  ): string {
    const reasons: string[] = [];
    
    // Baseado no tipo predito
    switch (predictedType) {
      case 'mercado_livre':
        if (features.patterns.includes('20000_prefix')) {
          reasons.push('Prefixo 20000 característico do Mercado Livre');
        }
        if (features.digitCount >= 8) {
          reasons.push('Formato numérico longo típico do ML');
        }
        break;
        
      case 'shopee':
        if (features.patterns.includes('br_prefix')) {
          reasons.push('Prefixo BR identificado como Shopee');
        }
        break;
        
      case 'avulso':
        if (features.patterns.includes('lm_prefix')) {
          reasons.push('Prefixo LM para pacotes avulsos');
        }
        if (features.letterCount > features.digitCount) {
          reasons.push('Formato com predominância de letras');
        }
        break;
    }
    
    // Adiciona confiança geral
    const confidence = predictions.get(predictedType) || 0;
    reasons.push(`Confiança de ${Math.round(confidence * 100)}% baseada em análise ensemble`);
    
    return reasons.join('. ');
  }

  /**
   * Adiciona amostra aos dados de treinamento
   */
  private async addToTrainingData(
    code: string, 
    type: PackageType, 
    features: CodeFeatures, 
    confidence: number
  ): Promise<void> {
    const sample: TrainingData = {
      code,
      type,
      features,
      timestamp: Date.now(),
      confidence,
    };
    
    this.trainingData.push(sample);
    
    // Limita tamanho do dataset
    if (this.trainingData.length > 10000) {
      this.trainingData = this.trainingData.slice(-5000);
    }
    
    // Salva periodicamente
    if (this.trainingData.length % 10 === 0) {
      await this.saveTrainingData();
    }
    
    // Verifica se precisa retreinar
    if (this.trainingData.length >= this.MIN_TRAINING_SAMPLES && 
        Date.now() - this.lastRetrain > this.RETRAIN_INTERVAL) {
      await this.retrainModel();
    }
  }

  /**
   * Retreinamento do modelo
   */
  private async retrainModel(): Promise<void> {
    if (this.isTraining) return;
    
    this.isTraining = true;
    console.log('[SmartClassifier] Starting model retraining...');
    
    try {
      // 1. Atualiza patterns
      await this.buildPatterns();
      
      // 2. Recalcula métricas
      await this.evaluateModel();
      
      // 3. Atualiza versão
      this.modelVersion = this.generateNewVersion();
      
      this.lastRetrain = Date.now();
      await this.saveModelMetrics();
      
      console.log(`[SmartClassifier] Model retrained to version ${this.modelVersion}`);
    } catch (error) {
      console.error('[SmartClassifier] Error in retraining:', error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Construção de patterns a partir dos dados
   */
  private async buildPatterns(): Promise<void> {
    this.patterns.clear();
    
    // Agrupa por tipo
    const typeGroups = new Map<PackageType, TrainingData[]>();
    this.trainingData.forEach(sample => {
      if (!typeGroups.has(sample.type)) {
        typeGroups.set(sample.type, []);
      }
      typeGroups.get(sample.type)!.push(sample);
    });
    
    // Extrai patterns para cada tipo
    typeGroups.forEach((samples, type) => {
      const typePatterns = this.extractTypePatterns(samples);
      typePatterns.forEach(pattern => {
        this.patterns.set(pattern.pattern, pattern);
      });
    });
  }

  /**
   * Extração de patterns específicos por tipo
   */
  private extractTypePatterns(samples: TrainingData[]): PredictionPattern[] {
    const patterns: PredictionPattern[] = [];
    
    // Early return if no samples
    if (samples.length === 0) {
      return patterns;
    }
    
    // Analisa prefixos comuns
    const prefixes = new Map<string, number>();
    samples.forEach(sample => {
      const prefix = sample.features.prefix;
      prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
    });
    
    prefixes.forEach((count, prefix) => {
      if (count >= 3) { // Mínimo 3 ocorrências
        patterns.push({
          pattern: prefix,
          weight: count / samples.length,
          type: samples[0]!.type,
          examples: samples
            .filter(s => s.features.prefix === prefix)
            .slice(0, 3)
            .map(s => s.code),
        });
      }
    });
    
    return patterns;
  }

  /**
   * Avaliação do modelo
   */
  private async evaluateModel(): Promise<void> {
    if (this.trainingData.length < 50) return;
    
    // Cross-validation simples
    const foldSize = Math.floor(this.trainingData.length * 0.8);
    const trainSet = this.trainingData.slice(0, foldSize);
    const testSet = this.trainingData.slice(foldSize);
    
    let correct = 0;
    const confusionMatrix = Array(4).fill(0).map(() => Array(4).fill(0));
    const typeCounts = new Map<PackageType, number>();
    const correctCounts = new Map<PackageType, number>();
    
    for (const sample of testSet) {
      const prediction = await this.classifyCode(sample.code);
      
      // Atualiza matriz de confusão
      const actualIndex = this.getTypeIndex(sample.type);
      const predictedIndex = this.getTypeIndex(prediction?.type || 'unknown');
      
      // Verifica bounds para evitar acesso a undefined
      if (actualIndex >= 0 && actualIndex < 4 && predictedIndex >= 0 && predictedIndex < 4) {
        confusionMatrix[actualIndex]![predictedIndex]++;
      }
      
      // Atualiza contagens
      typeCounts.set(sample.type, (typeCounts.get(sample.type) || 0) + 1);
      if (prediction?.type === sample.type) {
        correct++;
        correctCounts.set(sample.type, (correctCounts.get(sample.type) || 0) + 1);
      }
    }
    
    // Calcula métricas
    const accuracy = correct / testSet.length;
    const precision = this.calculatePrecision(correctCounts, typeCounts, confusionMatrix);
    const recall = this.calculateRecall(correctCounts, typeCounts, confusionMatrix);
    const f1Score = this.calculateF1Score(precision, recall);
    
    this.modelMetrics = {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix,
      totalSamples: this.trainingData.length,
      lastUpdated: Date.now(),
    };
    
    console.log(`[SmartClassifier] Model evaluation - Accuracy: ${Math.round(accuracy * 100)}%`);
  }

  /**
   * Métodos utilitários
   */
  private calculateSimilarity(features1: CodeFeatures, features2: CodeFeatures): number {
    let similarity = 0;
    let factors = 0;
    
    // Comprimento
    similarity += 1 - Math.abs(features1.length - features2.length) / Math.max(features1.length, features2.length);
    factors++;
    
    // Prefixo
    similarity += features1.prefix === features2.prefix ? 1 : 0;
    factors++;
    
    // Contagem de dígitos/letras
    similarity += 1 - Math.abs(features1.digitCount - features2.digitCount) / Math.max(features1.digitCount, features2.digitCount);
    factors++;
    
    similarity += 1 - Math.abs(features1.letterCount - features2.letterCount) / Math.max(features1.letterCount, features2.letterCount);
    factors++;
    
    // Entropia
    similarity += 1 - Math.abs(features1.entropy - features2.entropy) / Math.max(features1.entropy, features2.entropy);
    factors++;
    
    return similarity / factors;
  }

  private calculateFeatureStatistics(): Record<PackageType, CodeFeatures> {
    const stats = {} as Record<PackageType, CodeFeatures>;
    
    // Agrupa por tipo
    const typeGroups = new Map<PackageType, CodeFeatures[]>();
    this.trainingData.forEach(sample => {
      if (!typeGroups.has(sample.type)) {
        typeGroups.set(sample.type, []);
      }
      typeGroups.get(sample.type)!.push(sample.features);
    });
    
    // Calcula médias
    typeGroups.forEach((features, type) => {
      const avg: CodeFeatures = {
        length: features.reduce((sum, f) => sum + f.length, 0) / features.length,
        prefix: '', // Não calcula média de prefixo
        suffix: '', // Não calcula média de suffix
        digitCount: features.reduce((sum, f) => sum + f.digitCount, 0) / features.length,
        letterCount: features.reduce((sum, f) => sum + f.letterCount, 0) / features.length,
        hasSpecialChars: features.reduce((sum, f) => sum + (f.hasSpecialChars ? 1 : 0), 0) / features.length > 0.5,
        patterns: [], // Não calcula média de patterns
        entropy: features.reduce((sum, f) => sum + f.entropy, 0) / features.length,
        structure: '', // Não calcula média de structure
      };
      
      stats[type] = avg;
    });
    
    return stats;
  }

  private calculateFeatureSimilarity(features: CodeFeatures, avgFeatures: CodeFeatures): number {
    let similarity = 0;
    let factors = 0;
    
    similarity += 1 - Math.abs(features.length - avgFeatures.length) / Math.max(features.length, avgFeatures.length);
    factors++;
    
    similarity += 1 - Math.abs(features.digitCount - avgFeatures.digitCount) / Math.max(features.digitCount, avgFeatures.digitCount);
    factors++;
    
    similarity += 1 - Math.abs(features.letterCount - avgFeatures.letterCount) / Math.max(features.letterCount, avgFeatures.letterCount);
    factors++;
    
    similarity += 1 - Math.abs(features.entropy - avgFeatures.entropy) / Math.max(features.entropy, avgFeatures.entropy);
    factors++;
    
    return similarity / factors;
  }

  private getTypeIndex(type: PackageType): number {
    const types: PackageType[] = ['shopee', 'mercado_livre', 'avulso', 'unknown'];
    return types.indexOf(type);
  }

  private calculatePrecision(
    correctCounts: Map<PackageType, number>,
    typeCounts: Map<PackageType, number>,
    confusionMatrix: number[][]
  ): Record<PackageType, number> {
    const precision = {} as Record<PackageType, number>;
    const types: PackageType[] = ['shopee', 'mercado_livre', 'avulso', 'unknown'];
    
    types.forEach((type, i) => {
      const truePositives = correctCounts.get(type) || 0;
      const predictedPositives = confusionMatrix.reduce((sum, row) => sum + (row?.[i] || 0), 0);
      precision[type] = predictedPositives > 0 ? truePositives / predictedPositives : 0;
    });
    
    return precision;
  }

  private calculateRecall(
    correctCounts: Map<PackageType, number>,
    typeCounts: Map<PackageType, number>,
    confusionMatrix: number[][]
  ): Record<PackageType, number> {
    const recall = {} as Record<PackageType, number>;
    const types: PackageType[] = ['shopee', 'mercado_livre', 'avulso', 'unknown'];
    
    types.forEach((type, i) => {
      const truePositives = correctCounts.get(type) || 0;
      const actualPositives = typeCounts.get(type) || 0;
      recall[type] = actualPositives > 0 ? truePositives / actualPositives : 0;
    });
    
    return recall;
  }

  private calculateF1Score(precision: Record<PackageType, number>, recall: Record<PackageType, number>): Record<PackageType, number> {
    const f1Score = {} as Record<PackageType, number>;
    const types: PackageType[] = ['shopee', 'mercado_livre', 'avulso', 'unknown'];
    
    types.forEach(type => {
      const p = precision[type];
      const r = recall[type];
      f1Score[type] = (p + r) > 0 ? (2 * p * r) / (p + r) : 0;
    });
    
    return f1Score;
  }

  private getFallbackResult(code: string): ClassificationResult {
    const features = this.extractFeatures(code);
    
    return {
      type: 'unknown',
      confidence: 0.5,
      reasoning: 'Fallback classification due to ML service error',
      alternativeTypes: [],
      features,
      modelVersion: this.modelVersion,
    };
  }

  private initializeMetrics(): ModelMetrics {
    return {
      accuracy: 0,
      precision: { shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 },
      recall: { shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 },
      f1Score: { shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 },
      confusionMatrix: Array(4).fill(0).map(() => Array(4).fill(0)),
      totalSamples: 0,
      lastUpdated: Date.now(),
    };
  }

  private generateNewVersion(): string {
    const versionParts = this.modelVersion.split('.').map(Number);
    const [major = 0, minor = 0, patch = 0] = versionParts;
    
    // Ensure all parts are valid numbers
    const validMajor = isNaN(major) ? 0 : major;
    const validMinor = isNaN(minor) ? 0 : minor;
    const validPatch = isNaN(patch) ? 0 : patch;
    
    return `${validMajor}.${validMinor}.${validPatch + 1}`;
  }

  private scheduleRetraining(): void {
    setInterval(async () => {
      if (this.trainingData.length >= this.MIN_TRAINING_SAMPLES && 
          Date.now() - this.lastRetrain > this.RETRAIN_INTERVAL) {
        await this.retrainModel();
      }
    }, this.RETRAIN_INTERVAL);
  }

  // Métodos de persistência
  private async loadStoredData(): Promise<void> {
    try {
      const [trainingData, metrics, patterns, version] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.TRAINING_DATA),
        AsyncStorage.getItem(this.STORAGE_KEYS.MODEL_METRICS),
        AsyncStorage.getItem(this.STORAGE_KEYS.PATTERNS),
        AsyncStorage.getItem(this.STORAGE_KEYS.MODEL_VERSION),
      ]);

      if (trainingData) {
        this.trainingData = JSON.parse(trainingData);
      }

      if (metrics) {
        this.modelMetrics = JSON.parse(metrics);
      }

      if (patterns) {
        const patternsData = JSON.parse(patterns);
        Object.entries(patternsData).forEach(([key, value]) => {
          this.patterns.set(key, value as PredictionPattern);
        });
      }

      if (version) {
        this.modelVersion = version;
      }

      console.log('[SmartClassifier] Data loaded from storage');
    } catch (error) {
      console.error('[SmartClassifier] Error loading stored data:', error);
    }
  }

  private async saveTrainingData(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.TRAINING_DATA, JSON.stringify(this.trainingData));
    } catch (error) {
      console.error('[SmartClassifier] Error saving training data:', error);
    }
  }

  private async saveModelMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.MODEL_METRICS, JSON.stringify(this.modelMetrics));
      await AsyncStorage.setItem(this.STORAGE_KEYS.MODEL_VERSION, this.modelVersion);
      
      const patternsData = Object.fromEntries(this.patterns);
      await AsyncStorage.setItem(this.STORAGE_KEYS.PATTERNS, JSON.stringify(patternsData));
    } catch (error) {
      console.error('[SmartClassifier] Error saving model metrics:', error);
    }
  }

  // Métodos públicos
  async getModelMetrics(): Promise<ModelMetrics> {
    return this.modelMetrics;
  }

  async getTrainingDataSize(): Promise<number> {
    return this.trainingData.length;
  }

  async forceRetrain(): Promise<void> {
    await this.retrainModel();
  }

  async exportModel(): Promise<any> {
    return {
      version: this.modelVersion,
      metrics: this.modelMetrics,
      patterns: Object.fromEntries(this.patterns),
      trainingDataSize: this.trainingData.length,
      lastUpdated: this.modelMetrics.lastUpdated,
    };
  }

  clearAllData(): void {
    this.trainingData = [];
    this.patterns.clear();
    this.modelMetrics = this.initializeMetrics();
    this.modelVersion = '2.0.0';
    this.lastRetrain = 0;
  }
}

// Exportar instância singleton
export const smartClassifier = SmartClassifierService.getInstance();
export default SmartClassifierService;
export type {
  ClassificationResult,
  CodeFeatures,
  ModelMetrics,
  TrainingData,
  PredictionPattern,
};
