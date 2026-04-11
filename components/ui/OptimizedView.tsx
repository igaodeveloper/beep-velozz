/**
 * Optimized View - 60fps Constant
 * Componente UI otimizado para renderização ultra-rápida
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  ScrollView,
  Dimensions,
  InteractionManager,
  Image,
  TextInput,
} from "react-native";
import { BlurView } from "expo-blur";
import { performanceOptimizer } from "@/services/performanceOptimizer";

interface OptimizedViewProps {
  children: React.ReactNode;
  style?: any;
  animated?: boolean;
  blur?: boolean;
  performanceMode?: "normal" | "high" | "ultra";
}

interface OptimizedListProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement | null;
  keyExtractor: (item: any, index: number) => string;
  style?: any;
  performanceMode?: "normal" | "high" | "ultra";
}

interface OptimizedTextProps {
  children: string;
  style?: any;
  numberOfLines?: number;
  performanceMode?: "normal" | "high" | "ultra";
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Cache de estilos otimizados
const styleCache = new Map<string, any>();

// Componente View otimizado
export const OptimizedView: React.FC<OptimizedViewProps> = memo(
  ({
    children,
    style,
    animated = false,
    blur = false,
    performanceMode = "normal",
  }) => {
    // Memoiza estilos para evitar recalculos
    const optimizedStyle = useMemo(() => {
      const cacheKey = `view_${performanceMode}_${JSON.stringify(style)}`;

      if (styleCache.has(cacheKey)) {
        return styleCache.get(cacheKey);
      }

      const baseStyle = [styles.container];
      if (style) baseStyle.push(style);

      // Otimizações baseadas no modo de performance
      if (performanceMode === "ultra") {
        baseStyle.push(styles.ultraOptimized);
      } else if (performanceMode === "high") {
        baseStyle.push(styles.highOptimized);
      }

      styleCache.set(cacheKey, baseStyle);
      return baseStyle;
    }, [style, performanceMode]);

    // Renderização condicional otimizada
    const renderContent = useCallback(() => {
      if (blur) {
        return (
          <BlurView
            intensity={performanceMode === "ultra" ? 10 : 20}
            style={optimizedStyle}
            tint="light"
          >
            {children}
          </BlurView>
        );
      }

      if (animated) {
        return <Animated.View style={optimizedStyle}>{children}</Animated.View>;
      }

      return <View style={optimizedStyle}>{children}</View>;
    }, [children, blur, animated, optimizedStyle]);

    return renderContent();
  },
);

// Componente FlatList otimizado
export const OptimizedList: React.FC<OptimizedListProps> = memo(
  ({ data, renderItem, keyExtractor, style, performanceMode = "normal" }) => {
    // Memoiza configurações de performance
    const listConfig = useMemo(() => {
      const baseConfig = {
        windowSize: performanceMode === "ultra" ? 5 : 10,
        initialNumToRender: performanceMode === "ultra" ? 3 : 10,
        maxToRenderPerBatch: performanceMode === "ultra" ? 3 : 10,
        updateCellsBatchingPeriod: performanceMode === "ultra" ? 50 : 100,
        removeClippedSubviews: performanceMode !== "normal",
        keyExtractor,
        getItemLayout:
          performanceMode === "ultra"
            ? (data: ArrayLike<any> | null | undefined, index: number) => ({
                length: 60,
                offset: 60 * index,
                index,
              })
            : undefined,
      };

      return baseConfig;
    }, [performanceMode, keyExtractor]);

    // Memoiza renderItem para evitar re-renders
    const optimizedRenderItem = useCallback(
      ({ item, index }: { item: any; index: number }) => {
        const result = renderItem(item, index);
        // Ensure we return ReactElement | null as expected by FlatList
        return result || null;
      },
      [renderItem],
    );

    // Otimiza estilo da lista
    const listStyle = useMemo(
      () =>
        [
          styles.list,
          style,
          performanceMode === "ultra" && styles.ultraList,
        ].filter(Boolean),
      [style, performanceMode],
    );

    return (
      <FlatList
        data={data}
        renderItem={optimizedRenderItem}
        style={listStyle}
        {...listConfig}
      />
    );
  },
);

// Componente Text otimizado
export const OptimizedText: React.FC<OptimizedTextProps> = memo(
  ({ children, style, numberOfLines = 1, performanceMode = "normal" }) => {
    // Memoiza estilos de texto
    const textStyle = useMemo(() => {
      const cacheKey = `text_${performanceMode}_${numberOfLines}_${JSON.stringify(style)}`;

      if (styleCache.has(cacheKey)) {
        return styleCache.get(cacheKey);
      }

      const baseStyle = [styles.text];
      if (style) baseStyle.push(style);

      if (performanceMode === "ultra") {
        baseStyle.push(styles.ultraText);
      }

      styleCache.set(cacheKey, baseStyle);
      return baseStyle;
    }, [style, performanceMode, numberOfLines]);

    return (
      <Text
        style={textStyle}
        numberOfLines={numberOfLines}
        selectable={performanceMode !== "ultra"}
      >
        {children}
      </Text>
    );
  },
);

// Hook para performance optimization
export const usePerformanceOptimization = (
  performanceMode: "normal" | "high" | "ultra" = "normal",
) => {
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const isOptimized = useRef(false);

  useEffect(() => {
    if (performanceMode === "ultra" && !isOptimized.current) {
      // Ativa modo ultra performance
      performanceOptimizer.forceMaxPerformance();
      isOptimized.current = true;

      return () => {
        performanceOptimizer.restoreNormalMode();
        isOptimized.current = false;
      };
    }
  }, [performanceMode]);

  // Monitora FPS
  const monitorFPS = useCallback(() => {
    const now = Date.now();
    const delta = now - lastFrameTime.current;

    if (delta >= 1000) {
      const fps = frameCount.current;
      frameCount.current = 0;
      lastFrameTime.current = now;

      // Se FPS < 55, ativa otimizações
      if (fps < 55 && performanceMode !== "ultra") {
        performanceOptimizer.forceMaxPerformance();
      }
    } else {
      frameCount.current++;
    }
  }, [performanceMode]);

  // Executa após interações
  const runAfterInteractions = useCallback((callback: () => void) => {
    InteractionManager.runAfterInteractions(() => {
      callback();
    });
  }, []);

  return {
    monitorFPS,
    runAfterInteractions,
    isHighPerformance:
      performanceMode === "high" || performanceMode === "ultra",
  };
};

// Componente de container otimizado
export const OptimizedContainer: React.FC<{
  children: React.ReactNode;
  performanceMode?: "normal" | "high" | "ultra";
  style?: any;
}> = memo(({ children, performanceMode = "normal", style }) => {
  const { runAfterInteractions } = usePerformanceOptimization(performanceMode);

  // Renderização diferida para não bloquear UI
  const [shouldRender, setShouldRender] = React.useState(
    performanceMode !== "ultra",
  );

  useEffect(() => {
    if (performanceMode === "ultra") {
      runAfterInteractions(() => {
        setShouldRender(true);
      });
    }
  }, [performanceMode, runAfterInteractions]);

  if (!shouldRender) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <OptimizedView
      style={[styles.container, style]}
      performanceMode={performanceMode}
    >
      {children}
    </OptimizedView>
  );
});

// Componente de imagem otimizada
export const OptimizedImage: React.FC<{
  source: any;
  style?: any;
  performanceMode?: "normal" | "high" | "ultra";
  placeholder?: string;
}> = memo(({ source, style, performanceMode = "normal", placeholder }) => {
  const [loaded, setLoaded] = React.useState(false);
  const imageRef = useRef<any>(null);

  // Lazy loading baseado no modo de performance
  const shouldLoad = useMemo(() => {
    if (performanceMode === "ultra") {
      return false; // Não carrega automaticamente em modo ultra
    }
    return true;
  }, [performanceMode]);

  const onLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const renderPlaceholder = useCallback(() => {
    if (!placeholder || loaded) return null;

    return (
      <View style={[styles.imagePlaceholder, style]}>
        <OptimizedText performanceMode={performanceMode}>
          {placeholder}
        </OptimizedText>
      </View>
    );
  }, [placeholder, loaded, style, performanceMode]);

  if (!shouldLoad) {
    return renderPlaceholder();
  }

  return (
    <View style={style}>
      <Image
        ref={imageRef}
        source={source}
        style={style}
        onLoad={onLoad}
        fadeDuration={performanceMode === "ultra" ? 0 : 300}
      />
      {!loaded && renderPlaceholder()}
    </View>
  );
});

// Componente de input otimizado
export const OptimizedInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  performanceMode?: "normal" | "high" | "ultra";
}> = memo(
  ({ value, onChangeText, placeholder, style, performanceMode = "normal" }) => {
    const { runAfterInteractions } =
      usePerformanceOptimization(performanceMode);

    // Debounce otimizado
    const debouncedOnChange = useCallback(
      performanceMode === "ultra"
        ? onChangeText // Sem debounce em modo ultra
        : debounce(onChangeText, performanceMode === "high" ? 100 : 300),
      [onChangeText, performanceMode],
    );

    const handleChangeText = useCallback(
      (text: string) => {
        if (performanceMode === "ultra") {
          onChangeText(text);
        } else {
          runAfterInteractions(() => {
            debouncedOnChange(text);
          });
        }
      },
      [performanceMode, onChangeText, debouncedOnChange, runAfterInteractions],
    );

    return (
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        style={[styles.input, style]}
        placeholderTextColor={performanceMode === "ultra" ? "#999" : "#666"}
        autoCorrect={false}
        autoComplete="off"
        autoCapitalize="none"
      />
    );
  },
);

// Função debounce otimizada
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Estilos otimizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ultraOptimized: {
    // Remove sombras e efeitos visuais pesados
    flex: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  highOptimized: {
    // Reduz complexidade visual
    flex: 1,
    shadowOpacity: 0.3,
    elevation: 2,
  },
  list: {
    flex: 1,
  },
  ultraList: {
    // Otimizações para lista em modo ultra
    flex: 1,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  ultraText: {
    // Remove fontes custom em modo ultra
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "System",
  },
  imagePlaceholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#2D3748",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
});

// Limpa cache de estilos periodicamente
setInterval(() => {
  if (styleCache.size > 1000) {
    styleCache.clear();
  }
}, 60000);

export default {
  OptimizedView,
  OptimizedList,
  OptimizedText,
  OptimizedContainer,
  OptimizedImage,
  OptimizedInput,
  usePerformanceOptimization,
};
