# 🎬 Guia de Animações e Micro-interações Avançadas

Este guia documenta o sistema completo de animações, feedback tátil e micro-interações implementado no projeto beep-velozz.

## 📦 Componentes Implementados

### 1. Sistema de Haptics Avançado (`utils/advancedHaptics.ts`)
- **Feedback tátil contextual** com diferentes intensidades e padrões
- **Presets para ações específicas**: scan, sucesso, erro, navegação
- **Padrões complexos**: pulse, shake, ramp-up/down, complex
- **Configuração de intensidade** adaptável

```typescript
import { advancedHaptics } from '@/utils/advancedHaptics';

// Uso simples
advancedHaptics.onTabPress();
advancedHaptics.onScanSuccess();
advancedHaptics.onScanError();

// Configuração avançada
advancedHaptics.trigger({
  type: 'success',
  pattern: 'pulse',
  intensity: 1.5,
  delay: 100
});
```

### 2. Sistema de Animações (`utils/animationUtils.ts`)
- **Hooks reutilizáveis** para diferentes tipos de animação
- **Configurações predefinidas** (spring, timing, bouncy, snappy)
- **Animações de tela**, loading, cards, listas, modais
- **Transições fluidas** com easing avançado

```typescript
import { useBasicAnimation, useScreenTransition, useTabAnimation } from '@/utils/animationUtils';

// Animação básica
const { animatedStyle, pressIn, pressOut, shake, bounce } = useBasicAnimation();

// Transição de tela
const { animatedStyle, enter, exit } = useScreenTransition();

// Animação de tab
const { animatedStyle, activate, deactivate } = useTabAnimation(isActive);
```

### 3. Ícones Animados (`components/AnimatedIcon.tsx`)
- **Ícones premium com animações** integradas
- **Tipos de animação**: pulse, bounce, shake, rotate, scale, glow
- **Componentes específicos**: AnimatedHomeIcon, AnimatedCameraIcon, etc.
- **Feedback tátil automático** ao interagir

```typescript
import { AnimatedHomeIcon, AnimatedSuccessIcon } from '@/components/AnimatedIcon';

// Ícone animado básico
<AnimatedHomeIcon 
  animationType="bounce" 
  autoPlay={true}
  hapticType="light"
/>

// Ícone de sucesso
<AnimatedSuccessIcon 
  trigger={showSuccess}
  size={32}
/>
```

### 4. Micro-interações (`components/MicroInteractions.tsx`)
- **Botões com gestos avançados**: swipe, long press, double tap
- **Cards interativos** com elevação e feedback tátil
- **Ripple effects** para feedback visual
- **Swipeable items** com actions

```typescript
import { MicroInteractions, InteractiveCard, RippleButton } from '@/components/MicroInteractions';

// Botão com múltiplos gestos
<MicroInteractions
  onPress={() => console.log('Press')}
  onLongPress={() => console.log('Long press')}
  onSwipeRight={() => console.log('Swipe right')}
  hapticFeedback={true}
  pressAnimation={true}
>
  <Text>Interactive Button</Text>
</MicroInteractions>

// Card interativo
<InteractiveCard
  onPress={handleCardPress}
  elevation={true}
  scaleOnPress={true}
>
  <Text>Card Content</Text>
</InteractiveCard>
```

### 5. Otimização de Performance (`utils/performanceOptimizer.ts`)
- **Monitoramento de FPS** em tempo real
- **Adaptação automática** baseada na performance do dispositivo
- **Gerenciamento de animações** com fila e limites
- **Memory cleanup** automático
- **Configurações otimizadas** para diferentes níveis de performance

```typescript
import { 
  performanceMonitor, 
  useOptimizedAnimation, 
  shouldAnimate,
  debounce 
} from '@/utils/performanceOptimizer';

// Monitorar performance
performanceMonitor.startMonitoring();

// Usar animações otimizadas
const { preset, shouldUseComplexAnimations } = useOptimizedAnimation();

// Debounce para eventos frequentes
const debouncedSearch = debounce(handleSearch, 300);
```

## 🚀 Como Usar

### 1. BottomTabNavigator Melhorado

O BottomTabNavigator foi atualizado com:
- **Animações fluidas** ao trocar de tab
- **Feedback tátil contextual**
- **Ícones animados**
- **Transições suaves**

```typescript
// O componente já está atualizado com as novas animações
<BottomTabNavigator 
  activeTab={activeTab}
  onTabChange={handleTabChange}
  showScannerTab={true}
/>
```

### 2. Implementar em Novos Componentes

```typescript
// 1. Importar os hooks necessários
import { useBasicAnimation, useTabAnimation } from '@/utils/animationUtils';
import { advancedHaptics } from '@/utils/advancedHaptics';
import { useOptimizedAnimation } from '@/utils/performanceOptimizer';

// 2. Usar nos componentes
function MyComponent() {
  const { animatedStyle, pressIn, pressOut } = useBasicAnimation();
  const { shouldUseComplexAnimations } = useOptimizedAnimation();

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      onTouchStart={pressIn}
      onTouchEnd={pressOut}
    >
      {/* Conteúdo */}
    </Animated.View>
  );
}
```

### 3. Adicionar Feedback Tátil

```typescript
// Para diferentes ações
const handleScan = () => {
  advancedHaptics.onScanSuccess();
  // Lógica de scan
};

const handleError = () => {
  advancedHaptics.onScanError();
  // Lógica de erro
};

const handleTabPress = () => {
  advancedHaptics.onTabPress();
  // Lógica de navegação
};
```

## 🎨 Tipos de Animação Disponíveis

### Animações Básicas
- **Pulse**: Efeito de pulsação suave
- **Bounce**: Efeito de quicada
- **Shake**: Efeito de shake/vibração
- **Rotate**: Rotação 360°
- **Scale**: Efeito de zoom

### Animações de Transição
- **SlideIn**: Entrada deslizando
- **SlideOut**: Saída deslizando
- **FadeIn**: Aparecimento suave
- **FadeOut**: Desaparecimento suave
- **ScaleIn**: Entrada com zoom
- **ScaleOut**: Saída com zoom

### Animações Avançadas
- **Elastic**: Efeito elástico
- **Wave**: Efeito de onda
- **Glow**: Efeito de brilho
- **Parallax**: Efeito de paralaxe

## 🔧 Configurações

### Performance Config
```typescript
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 60,
  COMPLEX_ANIMATION_THRESHOLD: 1000,
  DEBOUNCE_TIME: 16,
  MAX_CONCURRENT_ANIMATIONS: 10,
  CLEANUP_INTERVAL: 30000,
};
```

### Animation Presets
```typescript
export const ANIMATION_PRESETS = {
  spring: { damping: 15, stiffness: 200, mass: 1 },
  timing: { duration: 300, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) },
  bouncy: { damping: 5, stiffness: 400, mass: 1 },
  snappy: { duration: 200, easing: Easing.bezier(0.4, 0.0, 0.2, 1) },
};
```

## 📱 Melhores Práticas

### 1. Performance
- Use `shouldAnimate()` para verificar se deve animar
- Monitore FPS com `performanceMonitor`
- Use presets otimizados para cada dispositivo
- Limpe animações não utilizadas

### 2. Feedback Tátil
- Use feedback contextual (light para navegação, heavy para ações importantes)
- Respeite preferências do usuário (reduced motion)
- Adapte intensidade baseada na ação

### 3. Animações
- Mantenha durações entre 200-500ms
- Use easing natural (bezier curves)
- Evite muitas animações simultâneas
- Teste em dispositivos diferentes

## 🎯 Exemplos de Uso

### Scanner com Feedback Completo
```typescript
function ScannerComponent() {
  const { animatedStyle, shake, pulse } = useBasicAnimation();
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    advancedHaptics.onScanSuccess();
    pulse();
    
    try {
      // Lógica de scan
    } catch (error) {
      advancedHaptics.onScanError();
      shake();
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={handleScan}>
        <Text>Scan Package</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
```

### Card de Lista Animado
```typescript
function PackageListItem({ item, index }) {
  const { animatedStyle, enter } = useListItemAnimation(index);
  
  useEffect(() => {
    enter();
  }, []);

  return (
    <InteractiveCard style={animatedStyle}>
      <Text>{item.name}</Text>
    </InteractiveCard>
  );
}
```

## 🔍 Debug e Monitoramento

### 1. Performance Monitor
```typescript
// Adicionar ao app principal
useEffect(() => {
  performanceMonitor.startMonitoring();
  
  const unsubscribe = performanceMonitor.onFPSUpdate((fps) => {
    console.log(`Current FPS: ${fps}`);
    if (fps < 30) {
      console.warn('Low performance detected!');
    }
  });
  
  return () => {
    unsubscribe();
    performanceMonitor.stopMonitoring();
  };
}, []);
```

### 2. Animation Manager
```typescript
// Monitorar animações ativas
console.log(`Active animations: ${animationManager.getActiveCount()}`);

// Limpar todas se necessário
animationManager.clearAll();
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Animações travando**: Verifique o FPS e use presets otimizados
2. **Haptics não funcionando**: Verifique se o dispositivo suporta
3. **Performance baixa**: Reduza animações complexas ou use `shouldAnimate()`
4. **Memory leaks**: Use cleanup automático e limpe animações

### Soluções

```typescript
// Verificar performance
if (!performanceMonitor.isHighPerformance()) {
  // Usar animações simplificadas
  return <SimpleAnimation />;
}

// Verificar suporte a haptics
if (Platform.OS === 'web') {
  // Fallback visual
  return <VisualFeedback />;
}
```

## 📈 Futuras Melhorias

- [ ] Animações 3D com depth
- [ ] Physics-based animations
- [ ] Gesture recognition avançado
- [ ] AI-based performance optimization
- [ ] Custom animation builder
- [ ] Animation library online

---

## 🎉 Conclusão

O sistema de animações e micro-interações implementado oferece:

✅ **Feedback tátil avançado** contextual  
✅ **Animações fluidas** otimizadas para performance  
✅ **Micro-interações** intuitivas  
✅ **Componentes reutilizáveis** e bem documentados  
✅ **Otimização automática** baseada no dispositivo  
✅ **Acessibilidade** e preferências do usuário  

Isso resulta em uma experiência de usuário **incrivelmente robusta e avançada** que se adapta a diferentes dispositivos e contextos de uso.
