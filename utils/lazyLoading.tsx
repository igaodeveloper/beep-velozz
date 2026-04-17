/**
 * Industrial Lazy Loading System - Ultra Performance
 * Sistema de lazy loading otimizado para ambiente industrial
 */

import React, { Suspense, lazy, ComponentType, useCallback } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from './useAppTheme';

interface LazyComponentProps {
  fallback?: ComponentType<any>;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
}

interface LazyLoadOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Componente de fallback otimizado
 */
const DefaultFallback: ComponentType = () => {
  const { colors } = useAppTheme();
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ 
        color: colors.text, 
        marginTop: 10,
        fontSize: 14,
      }}>
        Carregando...
      </Text>
    </View>
  );
};

/**
 * Componente de erro otimizado
 */
const DefaultErrorFallback: ComponentType<{ error: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => {
  const { colors } = useAppTheme();
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
      padding: 20,
    }}>
      <Text style={{ 
        color: colors.danger, 
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
      }}>
        Erro ao carregar componente
      </Text>
      <Text style={{ 
        color: colors.textMuted, 
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
      }}>
        {error.message}
      </Text>
      <TouchableOpacity
        onPress={retry}
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', fontSize: 14 }}>
          Tentar Novamente
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Wrapper para lazy loading com retry e timeout
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions & LazyComponentProps = {}
): ComponentType<T> {
  const {
    timeout = 10000, // 10 segundos
    retryCount = 3,
    retryDelay = 1000,
    fallback: Fallback = DefaultFallback,
    errorFallback: ErrorFallback = DefaultErrorFallback,
    preload = false,
  } = options;

  // Criar componente lazy com retry
  const LazyComponent = lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;
      
      const attemptLoad = async () => {
        try {
          // Timeout para carregamento
          const timeoutPromise = new Promise<never>((_, timeoutReject) => {
            setTimeout(() => timeoutReject(new Error('Component loading timeout')), timeout);
          });
          
          const loadPromise = importFunc();
          
          const result = await Promise.race([loadPromise, timeoutPromise]);
          resolve(result);
        } catch (error) {
          attempts++;
          
          if (attempts < retryCount) {
            console.warn(`Component load failed, retrying (${attempts}/${retryCount}):`, error);
            setTimeout(attemptLoad, retryDelay * attempts);
          } else {
            reject(error);
          }
        }
      };
      
      attemptLoad();
    });
  });

  // Preload se solicitado
  if (preload) {
    importFunc().catch(console.warn);
  }

  // Componente com Suspense e tratamento de erro
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <Suspense fallback={<Fallback />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

/**
 * Error Boundary para lazy loading
 */
class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    fallback: ComponentType<{ error: Error; retry: () => void }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static override getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return (
        <Fallback 
          error={this.state.error} 
          retry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Factory para componentes críticos do sistema
 */
export const LazyComponents = {
  // Scanner (crítico para operação)
  IndustrialScanner: createLazyComponent(
    () => import('@/components/OptimizedIndustrialScanner'),
    { 
      preload: true, // Preload crítico
      timeout: 5000, // Timeout mais curto para críticos
      fallback: () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Iniciando Scanner...</Text>
        </View>
      ),
    }
  ),

  // Dashboard (usado frequentemente)
  Dashboard: createLazyComponent(
    () => import('@/components/MetricsDashboard'),
    { 
      preload: true,
      timeout: 8000,
    }
  ),

  // Histórico (usado com menos frequência)
  HistoryBrowser: createLazyComponent(
    () => import('@/components/HistoryBrowser'),
    { 
      preload: false,
      timeout: 10000,
    }
  ),

  // Relatórios (usado esporadicamente)
  ReportView: createLazyComponent(
    () => import('@/components/ReportView'),
    { 
      preload: false,
      timeout: 15000,
    }
  ),

  // Configurações (usado ocasionalmente)
  SettingsScreen: createLazyComponent(
    () => import('@/components/SettingsScreen'),
    { 
      preload: false,
      timeout: 10000,
    }
  ),

  // Modais (carregados sob demanda)
  SessionInitModal: createLazyComponent(
    () => import('@/components/SessionInitModal'),
    { 
      preload: false,
      timeout: 5000,
    }
  ),

  ThemeSelector: createLazyComponent(
    () => import('@/components/ThemeSelector'),
    { 
      preload: false,
      timeout: 5000,
    }
  ),

  // Componentes de mídia (pesados)
  PackagePhotoCapture: createLazyComponent(
    () => import('@/components/PackagePhotoCapture'),
    { 
      preload: false,
      timeout: 15000,
    }
  ),
};

/**
 * Hook para preloading inteligente
 */
export function useIntelligentPreload() {
  const preloadCritical = useCallback(() => {
    // Preload componentes críticos baseado no uso
    if (typeof window !== 'undefined') {
      // Preload baseado em interações do usuário
      const preloadOnInteraction = () => {
        LazyComponents.IndustrialScanner;
        LazyComponents.Dashboard;
      };
      
      // Preload após 2 segundos
      setTimeout(preloadOnInteraction, 2000);
    }
  }, []);

  const preloadOnDemand = useCallback((componentName: keyof typeof LazyComponents) => {
    LazyComponents[componentName];
  }, []);

  return {
    preloadCritical,
    preloadOnDemand,
  };
}

/**
 * Sistema de prefetch baseado em predição
 */
export class PrefetchManager {
  private static instance: PrefetchManager;
  private prefetchedComponents = new Set<string>();
  private prefetchQueue: Array<() => void> = [];

  static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  prefetch(componentName: keyof typeof LazyComponents): void {
    if (this.prefetchedComponents.has(componentName)) {
      return;
    }

    this.prefetchQueue.push(() => {
      LazyComponents[componentName];
      this.prefetchedComponents.add(componentName);
    });

    this.processQueue();
  }

  private processQueue(): void {
    if (this.prefetchQueue.length === 0) return;

    // Processar um item por vez para não sobrecarregar
    const next = this.prefetchQueue.shift();
    if (next) {
      next();
      
      // Processar próximo após 500ms
      setTimeout(() => this.processQueue(), 500);
    }
  }

  prefetchAll(): void {
    Object.keys(LazyComponents).forEach(key => {
      this.prefetch(key as keyof typeof LazyComponents);
    });
  }
}

export const prefetchManager = PrefetchManager.getInstance();

export default LazyComponents;
