/**
 * API Integration Service
 * Serviço de integração com APIs externas para validação de pacotes
 */

import { Session, ScannedPackage } from "@/types/session";
import { PackageType } from "@/types/scanner";

export interface APIValidationResult {
  isValid: boolean;
  packageInfo?: PackageInfo;
  errors?: string[];
  warnings?: string[];
  timestamp: number;
  source: string;
}

export interface PackageInfo {
  trackingCode: string;
  status: "in_transit" | "delivered" | "pending" | "cancelled" | "returned";
  carrier: string;
  origin: string;
  destination: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  value?: number;
  estimatedDelivery?: string;
  lastUpdate: string;
}

export interface APIProvider {
  name: string;
  endpoint: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  timeout: number; // milliseconds
  enabled: boolean;
}

export interface ValidationConfig {
  enableRealTimeValidation: boolean;
  cacheResults: boolean;
  cacheTimeout: number; // milliseconds
  retryAttempts: number;
  fallbackProviders: boolean;
}

class PackageAPIIntegration {
  private providers: Map<string, APIProvider> = new Map();
  private cache: Map<string, APIValidationResult> = new Map();
  private config: ValidationConfig;
  private requestQueue: Array<{
    code: string;
    type: PackageType;
    resolve: (result: APIValidationResult) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enableRealTimeValidation: true,
      cacheResults: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      retryAttempts: 3,
      fallbackProviders: true,
      ...config,
    };

    this.initializeProviders();
    this.startRequestProcessor();
  }

  /**
   * Inicializa provedores de API
   */
  private initializeProviders(): void {
    // Shopee API
    this.providers.set("shopee", {
      name: "Shopee",
      endpoint: "https://api.shopee.com/v1/package",
      apiKey: process.env.SHOPEE_API_KEY,
      rateLimit: 100,
      timeout: 5000,
      enabled: true,
    });

    // Mercado Libre API
    this.providers.set("mercadolibre", {
      name: "Mercado Libre",
      endpoint: "https://api.mercadolibre.com/v1/tracking",
      apiKey: process.env.MERCADOLIBRE_API_KEY,
      rateLimit: 60,
      timeout: 7000,
      enabled: true,
    });

    // Correios API (Brasil)
    this.providers.set("correios", {
      name: "Correios",
      endpoint: "https://api.correios.com.br/package",
      apiKey: process.env.CORREIOS_API_KEY,
      rateLimit: 30,
      timeout: 10000,
      enabled: true,
    });

    // API genérica para pacotes avulsos
    this.providers.set("generic", {
      name: "Generic Tracker",
      endpoint: "https://api.tracking.com/v1/track",
      rateLimit: 50,
      timeout: 8000,
      enabled: true,
    });
  }

  /**
   * Valida pacote com APIs externas
   */
  async validatePackage(
    code: string,
    type: PackageType,
  ): Promise<APIValidationResult> {
    if (!this.config.enableRealTimeValidation) {
      return {
        isValid: false,
        packageInfo: undefined,
        warnings: ["Validação em tempo real desabilitada"],
        timestamp: Date.now(),
        source: "Local",
      };
    }

    // Verifica cache primeiro
    if (this.config.cacheResults) {
      const cached = this.getCachedResult(code);
      if (cached) return cached;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ code, type, resolve, reject });
    });
  }

  /**
   * Processador de fila de requisições
   */
  private startRequestProcessor(): void {
    setInterval(async () => {
      if (this.requestQueue.length === 0) return;

      const batch = this.requestQueue.splice(0, 10); // Processa em lotes de 10

      await Promise.allSettled(
        batch.map(async ({ code, type, resolve, reject }) => {
          try {
            const result = await this.processRequest(code, type);
            resolve(result);
          } catch (error) {
            reject(error as Error);
          }
        }),
      );
    }, 1000); // Processa a cada segundo
  }

  /**
   * Processa requisição individual
   */
  private async processRequest(
    code: string,
    type: PackageType,
  ): Promise<APIValidationResult> {
    const providerKey = this.getProviderForType(type);
    const provider = this.providers.get(providerKey);

    if (!provider || !provider.enabled) {
      return {
        isValid: false,
        packageInfo: undefined,
        warnings: ["Provedor não disponível"],
        timestamp: Date.now(),
        source: "Local",
      };
    }

    try {
      // Simula requisição HTTP
      const result = await this.makeAPIRequest(provider, code, type);

      // Cache do resultado
      if (this.config.cacheResults) {
        this.cacheResult(code, result);
      }

      return result;
    } catch (error) {
      console.error(`API request failed for ${code}:`, error);

      // Tenta fallback providers
      if (this.config.fallbackProviders) {
        return this.tryFallbackProviders(code, type);
      }

      throw error;
    }
  }

  /**
   * Faz requisição HTTP para API
   */
  private async makeAPIRequest(
    provider: APIProvider,
    code: string,
    type: PackageType,
  ): Promise<APIValidationResult> {
    // Simulação de requisição HTTP
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    // Simula resposta da API
    const isValid = Math.random() > 0.1; // 90% de validade
    const hasWarnings = Math.random() > 0.7; // 30% de warnings

    if (isValid) {
      const packageInfo: PackageInfo = {
        trackingCode: code,
        status: this.getRandomStatus(),
        carrier: provider.name,
        origin: "São Paulo, SP",
        destination: "Rio de Janeiro, RJ",
        weight: 0.5 + Math.random() * 4.5,
        dimensions: {
          length: 10 + Math.random() * 30,
          width: 10 + Math.random() * 30,
          height: 5 + Math.random() * 20,
        },
        value:
          type === "shopee"
            ? 50 + Math.random() * 500
            : 30 + Math.random() * 300,
        estimatedDelivery: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        lastUpdate: new Date().toISOString(),
      };

      return {
        isValid: true,
        packageInfo,
        warnings: hasWarnings
          ? ["Pacote com leve atraso na entrega"]
          : undefined,
        timestamp: Date.now(),
        source: provider.name,
      };
    } else {
      return {
        isValid: false,
        errors: ["Código de rastreamento inválido ou não encontrado"],
        timestamp: Date.now(),
        source: provider.name,
      };
    }
  }

  /**
   * Tenta provedores fallback
   */
  private async tryFallbackProviders(
    code: string,
    type: PackageType,
  ): Promise<APIValidationResult> {
    const fallbackProviders = Array.from(this.providers.entries()).filter(
      ([key, provider]) =>
        key !== this.getProviderForType(type) && provider.enabled,
    );

    for (const [_, provider] of fallbackProviders) {
      try {
        const result = await this.makeAPIRequest(provider, code, type);
        if (result.isValid) {
          result.warnings = [`Validado via ${provider.name} (fallback)`];
          return result;
        }
      } catch (error) {
        console.warn(`Fallback provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // Todos os fallbacks falharam
    return {
      isValid: false,
      packageInfo: undefined,
      warnings: ["Todos os provedores falharam"],
      timestamp: Date.now(),
      source: "Local",
    };
  }


  /**
   * Obtém provedor para tipo de pacote
   */
  private getProviderForType(type: PackageType): string {
    switch (type) {
      case "shopee":
        return "shopee";
      case "mercado_livre":
        return "mercadolibre";
      case "avulso":
        return "correios";
      default:
        return "generic";
    }
  }

  /**
   * Obtém resultado do cache
   */
  private getCachedResult(code: string): APIValidationResult | null {
    const cached = this.cache.get(code);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.config.cacheTimeout) {
      this.cache.delete(code);
      return null;
    }

    return cached;
  }

  /**
   * Armazena resultado no cache
   */
  private cacheResult(code: string, result: APIValidationResult): void {
    this.cache.set(code, result);

    // Limpa cache antigo periodicamente
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Limpa cache antigo
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [code, result] of this.cache.entries()) {
      if (now - result.timestamp > this.config.cacheTimeout) {
        this.cache.delete(code);
      }
    }
  }

  /**
   * Obtém status aleatório para simulação
   */
  private getRandomStatus(): PackageInfo["status"] {
    const statuses: PackageInfo["status"][] = [
      "in_transit",
      "pending",
      "delivered",
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Valida lote de pacotes
   */
  async validateBatch(
    packages: Array<{ code: string; type: PackageType }>,
  ): Promise<APIValidationResult[]> {
    const promises = packages.map(({ code, type }) =>
      this.validatePackage(code, type),
    );

    return Promise.all(promises);
  }

  /**
   * Obtém estatísticas das APIs
   */
  getAPIStats(): {
    cacheSize: number;
    queueSize: number;
    providersStatus: Record<string, boolean>;
    cacheHitRate: number;
  } {
    const providersStatus = Array.from(this.providers.entries()).reduce(
      (acc, [key, provider]) => {
        acc[key] = provider.enabled;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    return {
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.length,
      providersStatus,
      cacheHitRate: 0.75, // TODO: Calcular taxa real
    };
  }

  /**
   * Configura provedor
   */
  configureProvider(key: string, config: Partial<APIProvider>): void {
    const existing = this.providers.get(key);
    if (existing) {
      this.providers.set(key, { ...existing, ...config });
    }
  }

  /**
   * Habilita/desabilita provedor
   */
  toggleProvider(key: string, enabled: boolean): void {
    const provider = this.providers.get(key);
    if (provider) {
      provider.enabled = enabled;
    }
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton
export const packageAPIIntegration = new PackageAPIIntegration();
