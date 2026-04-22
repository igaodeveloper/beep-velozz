// src/utils/intelligentPreCache.ts
/**
 * Intelligent PreCache System - Smart Resource Loading
 * Sistema de precaching inteligente que aprende padrões de uso
 */

import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { caches } from './advancedCache';

// Interfaces para precaching
interface CacheItem {
  key: string;
  data: any;
  priority: number;
  size: number;
  lastAccessed: number;
  accessCount: number;
  preloadCost: number;
}

interface UsagePattern {
  key: string;
  frequency: number;
  timeOfDay: number[];
  sequence: string[];
  context: string;
}

interface PreCacheStrategy {
  aggressive: boolean;
  maxMemoryUsage: number;
  maxItems: number;
  preloadThreshold: number;
  learningEnabled: boolean;
}

// Configurações de precaching
const PRECACHE_CONFIG: PreCacheStrategy = {
  aggressive: false, // Modo conservador por padrão
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  maxItems: 200,
  preloadThreshold: 0.7, // 70% de probabilidade
  learningEnabled: true,
};

// Classe principal de precaching inteligente
class IntelligentPreCache {
  private cache = new Map<string, CacheItem>();
  private patterns = new Map<string, UsagePattern>();
  private currentContext = 'default';
  private sessionStartTime = Date.now();
  private memoryUsage = 0;
  private preloadQueue: Array<{ key: string; priority: number }> = [];
  private isPreloading = false;
  
  constructor(private config: PreCacheStrategy = PRECACHE_CONFIG) {}
  
  // Definir contexto atual
  setContext(context: string): void {
    this.currentContext = context;
    this.triggerPreloadBasedOnContext();
  }
  
  // Adicionar item ao cache com aprendizado
  async set(key: string, data: any, priority: number = 1): Promise<void> {
    const size = this.calculateSize(data);
    const now = Date.now();
    
    // Verificar se precisa de espaço
    if (this.needsEviction(size)) {
      await this.evictLeastUseful();
    }
    
    const item: CacheItem = {
      key,
      data,
      priority,
      size,
      lastAccessed: now,
      accessCount: 1,
      preloadCost: this.calculatePreloadCost(data),
    };
    
    this.cache.set(key, item);
    this.memoryUsage += size;
    
    // Aprender padrão de uso
    this.learnUsagePattern(key);
    
    // Verificar se deve precarregar itens relacionados
    this.checkRelatedItems(key);
  }
  
  // Obter item do cache
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (item) {
      const now = Date.now();
      item.lastAccessed = now;
      item.accessCount++;
      
      // Aprender com este acesso
      this.learnUsagePattern(key);
      
      return item.data;
    }
    
    // Se não encontrou, registrar miss para aprendizado
    this.recordMiss(key);
    return null;
  }
  
  // Precarregar item baseado em padrões
  async preload(key: string, loader: () => Promise<any>): Promise<void> {
    if (this.cache.has(key) || this.preloadQueue.some(item => item.key === key)) {
      return; // Já está no cache ou na fila
    }
    
    // Calcular prioridade de preload
    const priority = this.calculatePreloadPriority(key);
    
    if (priority >= this.config.preloadThreshold) {
      this.preloadQueue.push({ key, priority });
      this.preloadQueue.sort((a, b) => b.priority - a.priority);
      
      if (!this.isPreloading) {
        await this.processPreloadQueue(loader);
      }
    }
  }
  
  // Precarregar múltiplos itens
  async preloadBatch(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const validKeys = keys.filter(key => !this.cache.has(key));
    
    if (validKeys.length === 0) return;
    
    // Ordenar por prioridade
    const prioritized = validKeys
      .map(key => ({ key, priority: this.calculatePreloadPriority(key) }))
      .filter(item => item.priority >= this.config.preloadThreshold)
      .sort((a, b) => b.priority - a.priority);
    
    // Adicionar à fila
    this.preloadQueue.push(...prioritized);
    
    if (!this.isPreloading) {
      await this.processPreloadQueue(loader);
    }
  }
  
  // Processar fila de preload
  private async processPreloadQueue(loader: (key: string) => Promise<any>): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;
    
    this.isPreloading = true;
    
    while (this.preloadQueue.length > 0 && this.canPreloadMore()) {
      const { key } = this.preloadQueue.shift()!;
      
      try {
        const data = await loader(key);
        await this.set(key, data, 2); // Prioridade alta para preload
        
        // Delay para não bloquear UI
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.warn(`Preload failed for ${key}:`, error);
      }
    }
    
    this.isPreloading = false;
  }
  
  // Calcular prioridade de preload
  private calculatePreloadPriority(key: string): number {
    const pattern = this.patterns.get(key);
    
    if (!pattern) {
      return 0.1; // Prioridade mínima para itens desconhecidos
    }
    
    let priority = 0;
    
    // Frequência de uso (40%)
    priority += pattern.frequency * 0.4;
    
    // Padrão de tempo (20%)
    const currentHour = new Date().getHours();
    const timeMatch = pattern.timeOfDay.includes(currentHour) ? 1 : 0;
    priority += timeMatch * 0.2;
    
    // Padrão de sequência (25%)
    const sequenceMatch = this.calculateSequenceMatch(pattern.sequence);
    priority += sequenceMatch * 0.25;
    
    // Contexto atual (15%)
    const contextMatch = pattern.context === this.currentContext ? 1 : 0;
    priority += contextMatch * 0.15;
    
    return Math.min(priority, 1);
  }
  
  // Aprender padrões de uso
  private learnUsagePattern(key: string): void {
    if (!this.config.learningEnabled) return;
    
    let pattern = this.patterns.get(key);
    
    if (!pattern) {
      pattern = {
        key,
        frequency: 0,
        timeOfDay: [],
        sequence: [],
        context: this.currentContext,
      };
      this.patterns.set(key, pattern);
    }
    
    // Atualizar frequência
    const sessionDuration = Date.now() - this.sessionStartTime;
    pattern.frequency = Math.min(1, pattern.frequency + (1 / (sessionDuration / 1000 / 60))); // Decay por minuto
    
    // Atualizar padrão de tempo
    const currentHour = new Date().getHours();
    if (!pattern.timeOfDay.includes(currentHour)) {
      pattern.timeOfDay.push(currentHour);
      if (pattern.timeOfDay.length > 8) {
        pattern.timeOfDay.shift(); // Manter apenas 8 horas mais recentes
      }
    }
    
    // Atualizar contexto se mudou
    if (pattern.context !== this.currentContext) {
      pattern.context = this.currentContext;
    }
  }
  
  // Registrar miss para aprendizado
  private recordMiss(key: string): void {
    if (!this.config.learningEnabled) return;
    
    let pattern = this.patterns.get(key);
    
    if (!pattern) {
      pattern = {
        key,
        frequency: 0,
        timeOfDay: [],
        sequence: [],
        context: this.currentContext,
      };
      this.patterns.set(key, pattern);
    }
    
    // Reduzir frequência em misses
    pattern.frequency = Math.max(0, pattern.frequency - 0.1);
  }
  
  // Calcular match de sequência
  private calculateSequencePattern(): string[] {
    // Implementar análise de sequência de acessos
    // Por enquanto, retorna array vazio
    return [];
  }
  
  private calculateSequenceMatch(sequence: string[]): number {
    const currentSequence = this.calculateSequencePattern();
    
    if (currentSequence.length === 0 || sequence.length === 0) {
      return 0;
    }
    
    // Calcular similaridade de sequência
    let matches = 0;
    const minLength = Math.min(currentSequence.length, sequence.length);
    
    for (let i = 0; i < minLength; i++) {
      if (currentSequence[i] === sequence[i]) {
        matches++;
      }
    }
    
    return matches / minLength;
  }
  
  // Verificar itens relacionados para preload
  private checkRelatedItems(key: string): void {
    // Implementar lógica para encontrar itens relacionados
    // Por enquanto, não faz nada
  }
  
  // Trigger preload baseado no contexto
  private triggerPreloadBasedOnContext(): void {
    // Implementar preload baseado em mudança de contexto
    // Por enquanto, não faz nada
  }
  
  // Métodos utilitários
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16
    } catch {
      return 1024; // Default 1KB
    }
  }
  
  private calculatePreloadCost(data: any): number {
    const size = this.calculateSize(data);
    return size / (1024 * 1024); // MB
  }
  
  private needsEviction(newItemSize: number): boolean {
    return (
      this.cache.size >= this.config.maxItems ||
      this.memoryUsage + newItemSize > this.config.maxMemoryUsage
    );
  }
  
  private canPreloadMore(): boolean {
    return (
      this.cache.size < this.config.maxItems &&
      this.memoryUsage < this.config.maxMemoryUsage * 0.8
    );
  }
  
  private async evictLeastUseful(): Promise<void> {
    if (this.cache.size === 0) return;
    
    // Ordenar por utilidade (prioridade / custo)
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({
        key,
        usefulness: (item.priority * item.accessCount) / (item.preloadCost + 1),
        item,
      }))
      .sort((a, b) => a.usefulness - b.usefulness);
    
    // Remover itens menos úteis até ter espaço
    while (items.length > 0 && this.needsEviction(0)) {
      const { key, item } = items.shift()!;
      this.cache.delete(key);
      this.memoryUsage -= item.size;
    }
  }
  
  // Métodos públicos
  clear(): void {
    this.cache.clear();
    this.patterns.clear();
    this.preloadQueue = [];
    this.memoryUsage = 0;
    this.sessionStartTime = Date.now();
  }
  
  getStats(): {
    cacheSize: number;
    memoryUsage: number;
    patternsCount: number;
    queueSize: number;
    hitRate: number;
  } {
    const totalAccesses = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.accessCount, 0);
    
    return {
      cacheSize: this.cache.size,
      memoryUsage: this.memoryUsage,
      patternsCount: this.patterns.size,
      queueSize: this.preloadQueue.length,
      hitRate: totalAccesses > 0 ? totalAccesses / (totalAccesses + 1) : 0,
    };
  }
  
  getPatterns(): UsagePattern[] {
    return Array.from(this.patterns.values());
  }
  
  updateConfig(config: Partial<PreCacheStrategy>): void {
    this.config = { ...this.config, ...config };
  }
}

// Instância global
const intelligentCache = new IntelligentPreCache();

// Hook para uso em componentes
export function useIntelligentPreCache(context: string = 'default') {
  const cacheRef = useRef(intelligentCache);
  
  useEffect(() => {
    cacheRef.current.setContext(context);
  }, [context]);
  
  const preload = useCallback(async (key: string, loader: () => Promise<any>) => {
    await cacheRef.current.preload(key, loader);
  }, []);
  
  const preloadBatch = useCallback(async (keys: string[], loader: (key: string) => Promise<any>) => {
    await cacheRef.current.preloadBatch(keys, loader);
  }, []);
  
  const get = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);
  
  const set = useCallback(async (key: string, data: any, priority?: number) => {
    await cacheRef.current.set(key, data, priority);
  }, []);
  
  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);
  
  const getStats = useCallback(() => {
    return cacheRef.current.getStats();
  }, []);
  
  return {
    preload,
    preloadBatch,
    get,
    set,
    clear,
    getStats,
  };
}

// Exportar instância global
export { intelligentCache };
export default IntelligentPreCache;
