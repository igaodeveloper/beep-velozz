/**
 * Hook profissional para gerenciar estado da aplicação
 * Otimizado para performance e UX
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}

export function useAppState(options: UseAppStateOptions = {}) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isForeground, setIsForeground] = useState(appState === 'active');

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
      
      const wasForeground = isForeground;
      const nowForeground = nextAppState === 'active';
      setIsForeground(nowForeground);

      // Disparar callbacks baseados na mudança de estado
      if (wasForeground !== nowForeground) {
        if (nowForeground && options.onForeground) {
          options.onForeground();
        } else if (!nowForeground && options.onBackground) {
          options.onBackground();
        }
      }

      if (nextAppState === 'inactive' && options.onInactive) {
        options.onInactive();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [isForeground, options]);

  return {
    appState,
    isForeground,
    isBackground: appState === 'background',
    isActive: appState === 'active',
    isInactive: appState === 'inactive'
  };
}
