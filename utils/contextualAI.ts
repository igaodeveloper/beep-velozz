/**
 * Contextual AI Integration
 * Integração inteligente que combina ChatGPT com sistemas existentes de IA do projeto
 */

import { openaiService, ChatContext, ChatResponse } from './openaiService';
import { aiPatternRecognition, PatternInsight } from './aiPatternRecognition';
import { enhancedAI, EnhancedPrediction } from './enhancedAI';
import { packageImageRecognition } from './imageRecognition';
import { Session, ScannedPackage } from '@/types/session';
import { PackageType } from '@/types/scanner';

export interface ContextualInsight {
  type: 'chatgpt' | 'pattern' | 'enhanced' | 'vision';
  title: string;
  content: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  actions?: string[];
  timestamp: number;
}

export interface AIRecommendation {
  category: 'efficiency' | 'quality' | 'safety' | 'compliance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
  expectedGain?: string;
  steps: string[];
}

export interface IndustrialContext {
  sessionId: string;
  operatorId: string;
  currentTask: 'scanning' | 'sorting' | 'inspection' | 'break' | 'training';
  environment: {
    lighting: 'good' | 'moderate' | 'poor';
    noise: 'low' | 'moderate' | 'high';
    temperature: 'comfortable' | 'hot' | 'cold';
  };
  performance: {
    scanRate: number;
    errorRate: number;
    efficiency: number;
    streak: number;
  };
  inventory: {
    totalProcessed: number;
    remaining: number;
    types: Record<PackageType, number>;
    problematic: string[];
  };
}

class ContextualAI {
  private insights: Map<string, ContextualInsight[]> = new Map();
  private recommendations: AIRecommendation[] = [];
  private lastAnalysis: number = 0;
  private analysisInterval: number = 30000; // 30 segundos

  /**
   * Analisa contexto completo e gera insights integrados
   */
  async analyzeContext(session: Session, environment?: Partial<IndustrialContext['environment']>): Promise<ContextualInsight[]> {
    const context = this.buildIndustrialContext(session, environment);
    const insights: ContextualInsight[] = [];

    try {
      // 1. Análise de padrões existente
      const patternInsights = await this.getPatternInsights(session);
      insights.push(...patternInsights);

      // 2. Predições enhanced AI
      const enhancedInsights = await this.getEnhancedInsights(session);
      insights.push(...enhancedInsights);

      // 3. Insights do ChatGPT contextualizados
      const chatgptInsights = await this.getChatGPTInsights(context);
      insights.push(...chatgptInsights);

      // 4. Análise de imagens se houver fotos recentes
      const visionInsights = await this.getVisionInsights(session);
      insights.push(...visionInsights);

      // Ordena por urgência e confiança
      insights.sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aUrgency = urgencyOrder[a.urgency];
        const bUrgency = urgencyOrder[b.urgency];
        
        if (aUrgency !== bUrgency) return bUrgency - aUrgency;
        return b.confidence - a.confidence;
      });

      // Salva insights
      this.insights.set(context.sessionId, insights);
      this.lastAnalysis = Date.now();

      return insights;

    } catch (error) {
      console.error('❌ Error analyzing context:', error);
      return [];
    }
  }

  /**
   * Gera recomendações inteligentes baseadas em múltiplas fontes
   */
  async generateRecommendations(session: Session): Promise<AIRecommendation[]> {
    const context = this.buildIndustrialContext(session);
    const recommendations: AIRecommendation[] = [];

    try {
      // Recomendações de eficiência
      if (context.performance.scanRate < 8) {
        recommendations.push({
          category: 'efficiency',
          title: 'Otimizar Velocidade de Scanning',
          description: 'Sua velocidade está abaixo do ideal. Considere ajustar técnica ou ambiente.',
          impact: 'high',
          effort: 'moderate',
          expectedGain: '+20% produtividade',
          steps: [
            'Ajuste altura do scanner para conforto',
            'Organize pacotes em sequência lógica',
            'Use iluminação adequada',
            'Mantenha ritmo constante'
          ]
        });
      }

      // Recomendações de qualidade
      if (context.performance.errorRate > 0.1) {
        recommendations.push({
          category: 'quality',
          title: 'Reduzir Taxa de Erros',
          description: 'Sua taxa de erros está elevada. Foco em qualidade vs velocidade.',
          impact: 'high',
          effort: 'easy',
          expectedGain: '-50% divergências',
          steps: [
            'Verifique códigos difíceis com atenção',
            'Use função de zoom para códigos pequenos',
            'Confirme tipo de pacote antes de scan',
            'Tire foto de pacotes problemáticos'
          ]
        });
      }

      // Recomendações de segurança
      if (context.environment.lighting === 'poor') {
        recommendations.push({
          category: 'safety',
          title: 'Melhorar Iluminação',
          description: 'Iluminação inadequada pode causar erros e fadiga visual.',
          impact: 'medium',
          effort: 'easy',
          expectedGain: '+15% precisão',
          steps: [
            'Posicione fonte de luz adequadamente',
            'Evite reflexos na tela',
            'Use luz branca e difusa',
            'Descanse visão periodicamente'
          ]
        });
      }

      // Recomendações de conformidade
      if (context.inventory.problematic.length > 3) {
        recommendations.push({
          category: 'compliance',
          title: 'Revisar Pacotes Problemáticos',
          description: 'Muitos pacotes precisam de atenção especial.',
          impact: 'high',
          effort: 'moderate',
          expectedGain: '-80% não conformidades',
          steps: [
            'Sequencie pacotes por prioridade',
            'Documente todos os problemas',
            'Contacte supervisor se necessário',
            'Use modo de inspeção detalhada'
          ]
        });
      }

      // Recomendações personalizadas do ChatGPT
      const personalizedRecs = await this.getPersonalizedRecommendations(context);
      recommendations.push(...personalizedRecs);

      this.recommendations = recommendations;
      return recommendations;

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Obtém resposta inteligente combinando múltiplas IAs
   */
  async getSmartResponse(
    question: string,
    context: IndustrialContext,
    imageUri?: string
  ): Promise<{
    response: string;
    sources: string[];
    confidence: number;
    relatedInsights: ContextualInsight[];
  }> {
    const sources: string[] = [];
    let response = '';
    let totalConfidence = 0;
    let sourceCount = 0;

    try {
      // 1. Resposta do ChatGPT com contexto industrial
      const chatgptResponse = await openaiService.sendMessage(
        question,
        this.convertToChatContext(context),
        context.sessionId
      );
      
      response += chatgptResponse.message;
      sources.push('ChatGPT');
      totalConfidence += chatgptResponse.confidence;
      sourceCount++;

      // 2. Insights de padrões relevantes
      const relevantInsights = this.getRelevantInsights(question, context.sessionId);
      if (relevantInsights.length > 0) {
        response += '\n\n📊 **Insights Relevantes:**\n';
        relevantInsights.forEach(insight => {
          response += `• ${insight.title}: ${insight.content}\n`;
        });
        sources.push('Pattern Recognition');
        totalConfidence += 0.8;
        sourceCount++;
      }

      // 3. Análise de imagem se fornecida
      if (imageUri) {
        const imageAnalysis = await openaiService.analyzeImage(
          imageUri,
          question,
          this.convertToChatContext(context)
        );
        
        response += `\n\n📸 **Análise de Imagem:**\n${imageAnalysis.message}`;
        sources.push('Computer Vision');
        totalConfidence += imageAnalysis.confidence;
        sourceCount++;
      }

      // 4. Recomendações contextuais
      const contextualRecs = this.recommendations.filter(rec => 
        this.isRecommendationRelevant(rec, question)
      );
      
      if (contextualRecs.length > 0) {
        response += '\n\n💡 **Recomendações:**\n';
        contextualRecs.slice(0, 2).forEach(rec => {
          response += `• ${rec.title}: ${rec.description}\n`;
        });
        sources.push('Contextual AI');
        totalConfidence += 0.9;
        sourceCount++;
      }

      const avgConfidence = sourceCount > 0 ? totalConfidence / sourceCount : 0;

      return {
        response,
        sources,
        confidence: avgConfidence,
        relatedInsights: relevantInsights
      };

    } catch (error) {
      console.error('❌ Error getting smart response:', error);
      return {
        response: 'Desculpe, não consegui processar sua solicitação no momento.',
        sources: [],
        confidence: 0,
        relatedInsights: []
      };
    }
  }

  /**
   * Constrói contexto industrial completo
   */
  private buildIndustrialContext(
    session: Session,
    environment?: Partial<IndustrialContext['environment']>
  ): IndustrialContext {
    const scanRate = this.calculateScanRate(session);
    const errorRate = this.calculateErrorRate(session);
    const packageDistribution = this.getPackageDistribution(session.packages);

    return {
      sessionId: session.id,
      operatorId: session.operatorId || 'unknown',
      currentTask: 'scanning', // Detecção automática pode ser implementada
      environment: {
        lighting: 'good', // Sensor de luz pode ser implementado
        noise: 'moderate',
        temperature: 'comfortable',
        ...environment
      },
      performance: {
        scanRate,
        errorRate,
        efficiency: Math.max(0, (scanRate / 12) * (1 - errorRate)), // 12 = taxa ideal
        streak: this.calculateCurrentStreak(session)
      },
      inventory: {
        totalProcessed: session.packages.length,
        remaining: session.declaredCount - session.packages.length,
        types: packageDistribution,
        problematic: this.identifyProblematicPackages(session.packages)
      }
    };
  }

  /**
   * Converte contexto industrial para contexto do ChatGPT
   */
  private convertToChatContext(industrialContext: IndustrialContext): ChatContext {
    return {
      sessionId: industrialContext.sessionId,
      operatorId: industrialContext.operatorId,
      scanRate: industrialContext.performance.scanRate,
      errorRate: industrialContext.performance.errorRate,
      sessionProgress: industrialContext.inventory.totalProcessed / (industrialContext.inventory.totalProcessed + industrialContext.inventory.remaining),
      lastAction: industrialContext.currentTask,
      packageType: this.getMostCommonPackageType(industrialContext.inventory.types)
    };
  }

  /**
   * Obtém insights de padrões de IA
   */
  private async getPatternInsights(session: Session): Promise<ContextualInsight[]> {
    try {
      const patternInsights = await aiPatternRecognition.analyzeSession(session, []);
      
      return patternInsights.map(insight => ({
        type: 'pattern' as const,
        title: insight.title,
        content: insight.description,
        confidence: insight.confidence,
        urgency: insight.severity === 'critical' ? 'critical' : 
                 insight.severity === 'high' ? 'high' : 
                 insight.severity === 'medium' ? 'medium' : 'low',
        actionable: insight.actionable,
        timestamp: insight.timestamp
      }));
    } catch (error) {
      console.error('Error getting pattern insights:', error);
      return [];
    }
  }

  /**
   * Obtém insights da Enhanced AI
   */
  private async getEnhancedInsights(session: Session): Promise<ContextualInsight[]> {
    try {
      const sessionData = this.convertToSessionData(session);
      const prediction = await enhancedAI.predictDivergence(sessionData);
      
      return [{
        type: 'enhanced' as const,
        title: 'Previsão de Divergência',
        content: `Risco de ${(prediction.prediction.probability * 100).toFixed(0)}% de divergência. Fatores: ${prediction.factors.join(', ')}`,
        confidence: prediction.confidence,
        urgency: prediction.prediction.risk === 'high' ? 'critical' : 
                 prediction.prediction.risk === 'medium' ? 'high' : 'medium',
        actionable: true,
        actions: prediction.recommendations,
        timestamp: prediction.timestamp
      }];
    } catch (error) {
      console.error('Error getting enhanced insights:', error);
      return [];
    }
  }

  /**
   * Obtém insights do ChatGPT
   */
  private async getChatGPTInsights(context: IndustrialContext): Promise<ContextualInsight[]> {
    try {
      const prompt = this.buildContextualPrompt(context);
      const response = await openaiService.sendMessage(
        prompt,
        this.convertToChatContext(context),
        context.sessionId
      );

      return [{
        type: 'chatgpt' as const,
        title: 'Análise Contextual IA',
        content: response.message,
        confidence: response.confidence,
        urgency: 'medium',
        actionable: true,
        timestamp: Date.now()
      }];
    } catch (error) {
      console.error('Error getting ChatGPT insights:', error);
      return [];
    }
  }

  /**
   * Obtém insights de visão computacional
   */
  private async getVisionInsights(session: Session): Promise<ContextualInsight[]> {
    // Implementação futura com análise de imagens recentes
    return [];
  }

  /**
   * Obtém recomendações personalizadas do ChatGPT
   */
  private async getPersonalizedRecommendations(context: IndustrialContext): Promise<AIRecommendation[]> {
    try {
      const prompt = `Baseado no meu desempenho atual:
- Taxa de scanning: ${context.performance.scanRate.toFixed(1)} pacotes/min
- Taxa de erro: ${(context.performance.errorRate * 100).toFixed(1)}%
- Eficiência: ${(context.performance.efficiency * 100).toFixed(1)}%
- Pacotes processados: ${context.inventory.totalProcessed}
- Ambiente: iluminação ${context.environment.lighting}, ruído ${context.environment.noise}

Quais 2-3 recomendações personalizadas você faria para melhorar meu desempenho?`;

      const response = await openaiService.sendMessage(prompt, this.convertToChatContext(context));
      
      // Parse da resposta para extrair recomendações estruturadas
      return this.parseRecommendations(response.message);
      
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Constrói prompt contextual para análise
   */
  private buildContextualPrompt(context: IndustrialContext): string {
    return `Analise meu contexto industrial atual e forneça insights acionáveis:

DESEMPENHO:
- Velocidade: ${context.performance.scanRate.toFixed(1)} pacotes/min (ideal: 10-12)
- Taxa de erro: ${(context.performance.errorRate * 100).toFixed(1)}% (aceitável: <5%)
- Eficiência: ${(context.performance.efficiency * 100).toFixed(1)}%
- Sequência atual: ${context.performance.streak} pacotes

INVENTÁRIO:
- Processados: ${context.inventory.totalProcessed}
- Restantes: ${context.inventory.remaining}
- Tipos: ${JSON.stringify(context.inventory.types)}
- Problemáticos: ${context.inventory.problematic.length}

AMBIENTE:
- Iluminação: ${context.environment.lighting}
- Ruído: ${context.environment.noise}
- Tarefa atual: ${context.currentTask}

Forneça análise concisa com 2-3 insights principais e ações recomendadas.`;
  }

  /**
   * Métodos utilitários
   */
  private calculateScanRate(session: Session): number {
    if (!session.completedAt) return 0;
    
    const duration = (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60);
    return duration > 0 ? session.packages.length / duration : 0;
  }

  private calculateErrorRate(session: Session): number {
    // Simulação - implementar lógica real
    return session.hasDivergence ? 0.15 : 0.05;
  }

  private getPackageDistribution(packages: ScannedPackage[]): Record<PackageType, number> {
    const distribution: Record<PackageType, number> = {
      shopee: 0,
      mercado_livre: 0,
      avulso: 0,
      unknown: 0
    };

    packages.forEach(pkg => {
      distribution[pkg.type]++;
    });

    return distribution;
  }

  private calculateCurrentStreak(session: Session): number {
    // Implementar lógica de streak
    return Math.floor(Math.random() * 20);
  }

  private identifyProblematicPackages(packages: ScannedPackage[]): string[] {
    // Simulação - identificar pacotes com problemas
    return packages
      .filter(() => Math.random() < 0.1)
      .slice(0, 5)
      .map(pkg => pkg.code);
  }

  private getMostCommonPackageType(distribution: Record<PackageType, number>): string {
    const entries = Object.entries(distribution);
    const max = entries.reduce((max, [, count]) => Math.max(max, count), 0);
    const mostCommon = entries.find(([, count]) => count === max)?.[0];
    return mostCommon || 'unknown';
  }

  private convertToSessionData(session: Session): any {
    return {
      sessionId: session.id,
      operatorId: session.operatorId,
      packages: session.packages,
      startTime: new Date(session.startedAt).getTime(),
      currentTime: Date.now(),
      scanRate: this.calculateScanRate(session),
      errorRate: this.calculateErrorRate(session),
      packageDistribution: this.getPackageDistribution(session.packages)
    };
  }

  private getRelevantInsights(question: string, sessionId: string): ContextualInsight[] {
    const insights = this.insights.get(sessionId) || [];
    
    // Simples relevância por palavras-chave
    const keywords = question.toLowerCase().split(' ');
    
    return insights.filter(insight => {
      const content = (insight.title + ' ' + insight.content).toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    }).slice(0, 3);
  }

  private isRecommendationRelevant(recommendation: AIRecommendation, question: string): boolean {
    const keywords = question.toLowerCase();
    const content = (recommendation.title + ' ' + recommendation.description).toLowerCase();
    return content.includes(keywords) || keywords.includes(recommendation.category);
  }

  private parseRecommendations(response: string): AIRecommendation[] {
    // Implementar parsing mais sofisticado
    return [{
      category: 'efficiency',
      title: 'Recomendação Personalizada',
      description: response.slice(0, 200),
      impact: 'medium',
      effort: 'moderate',
      steps: [response.slice(0, 100)]
    }];
  }

  /**
   * Obtém insights acumulados
   */
  getInsights(sessionId: string): ContextualInsight[] {
    return this.insights.get(sessionId) || [];
  }

  /**
   * Obtém recomendações atuais
   */
  getCurrentRecommendations(): AIRecommendation[] {
    return this.recommendations;
  }

  /**
   * Limpa cache de insights
   */
  clearCache(sessionId?: string): void {
    if (sessionId) {
      this.insights.delete(sessionId);
    } else {
      this.insights.clear();
      this.recommendations = [];
    }
  }

  /**
   * Verifica se precisa de nova análise
   */
  needsAnalysis(): boolean {
    return Date.now() - this.lastAnalysis > this.analysisInterval;
  }
}

// Export singleton
export const contextualAI = new ContextualAI();
