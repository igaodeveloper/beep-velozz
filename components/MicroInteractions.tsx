import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/utils/useAppTheme';
import { advancedHaptics } from '@/utils/advancedHaptics';
import { useBasicAnimation } from '@/utils/animationUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MicroInteractionsProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  style?: any;
  disabled?: boolean;
  hapticFeedback?: boolean;
  pressAnimation?: boolean;
  longPressDelay?: number;
  swipeThreshold?: number;
}

export function MicroInteractions({
  children,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  style,
  disabled = false,
  hapticFeedback = true,
  pressAnimation = true,
  longPressDelay = 500,
  swipeThreshold = 50,
}: MicroInteractionsProps) {
  const { colors } = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  
  const { animatedStyle, pressIn, pressOut, shake, bounce, pulse } = useBasicAnimation();
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (evt, gestureState) => {
      if (disabled) return;
      
      setIsPressed(true);
      if (pressAnimation) {
        pressIn();
      }
      
      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressed(true);
        if (onLongPress) {
          onLongPress();
          if (hapticFeedback) advancedHaptics.onLongPress();
        }
      }, longPressDelay);
    },
    
    onPanResponderMove: (evt, gestureState) => {
      if (disabled) return;
      
      // Cancel long press if moved too much
      if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        setIsLongPressed(false);
      }
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      if (disabled) return;
      
      setIsPressed(false);
      setIsLongPressed(false);
      
      if (pressAnimation) {
        pressOut();
      }
      
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      const dx = gestureState.dx;
      const dy = gestureState.dy;
      
      // Detect swipe gestures
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > swipeThreshold) {
          if (dx > 0) {
            if (onSwipeRight) {
              onSwipeRight();
              if (hapticFeedback) advancedHaptics.onSwipe();
            }
          } else {
            if (onSwipeLeft) {
              onSwipeLeft();
              if (hapticFeedback) advancedHaptics.onSwipe();
            }
          }
        } else if (onPress) {
          onPress();
          if (hapticFeedback) advancedHaptics.onButtonPress();
        }
      } else {
        if (Math.abs(dy) > swipeThreshold) {
          if (dy > 0) {
            if (onSwipeDown) {
              onSwipeDown();
              if (hapticFeedback) advancedHaptics.onSwipe();
            }
          } else {
            if (onSwipeUp) {
              onSwipeUp();
              if (hapticFeedback) advancedHaptics.onSwipe();
            }
          }
        } else if (onPress) {
          onPress();
          if (hapticFeedback) advancedHaptics.onButtonPress();
        }
      }
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      {children}
      
      {/* Long press indicator */}
      {isLongPressed && (
        <View
          style={[
            styles.longPressIndicator,
            { backgroundColor: colors.primary + '30' },
          ]}
        />
      )}
    </Animated.View>
  );
}

// Componente de Card com micro-interações
interface InteractiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  elevation?: boolean;
  scaleOnPress?: boolean;
  hapticFeedback?: boolean;
}

export function InteractiveCard({
  children,
  onPress,
  onLongPress,
  style,
  elevation = true,
  scaleOnPress = true,
  hapticFeedback = true,
}: InteractiveCardProps) {
  const { colors } = useAppTheme();
  const { animatedStyle, pressIn, pressOut } = useBasicAnimation();
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    if (scaleOnPress) {
      pressIn();
    }
    setIsPressed(true);
  };

  const handlePressOut = () => {
    if (scaleOnPress) {
      pressOut();
    }
    setIsPressed(false);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      if (hapticFeedback) advancedHaptics.onButtonPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
      if (hapticFeedback) advancedHaptics.onLongPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.text,
          elevation: isPressed && elevation ? 8 : elevation ? 4 : 0,
        },
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
}

// Componente de Botão com ripple effect
interface RippleButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  rippleColor?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export function RippleButton({
  children,
  onPress,
  style,
  rippleColor,
  disabled = false,
  hapticFeedback = true,
}: RippleButtonProps) {
  const { colors } = useAppTheme();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef(0);

  const handlePress = (evt: any) => {
    if (disabled) return;
    
    const { locationX, locationY } = evt.nativeEvent;
    const newRipple = {
      id: rippleIdRef.current++,
      x: locationX,
      y: locationY,
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
    
    if (onPress) {
      onPress();
      if (hapticFeedback) advancedHaptics.onButtonPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.rippleButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.ripple,
            {
              left: ripple.x - 25,
              top: ripple.y - 25,
              backgroundColor: rippleColor || colors.primary + '40',
            },
          ]}
        />
      ))}
    </TouchableOpacity>
  );
}

// Componente de Swipeable Item
interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: any;
  threshold?: number;
}

export function SwipeableItem({
  children,
  leftActions,
  rightActions,
  onSwipeLeft,
  onSwipeRight,
  style,
  threshold = 100,
}: SwipeableItemProps) {
  const { colors } = useAppTheme();
  const translateX = useSharedValue(0);
  const [showLeftActions, setShowLeftActions] = useState(false);
  const [showRightActions, setShowRightActions] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleSwipe = (gesture: any) => {
    const { dx } = gesture;
    
    if (dx > threshold) {
      // Swipe right
      setShowLeftActions(true);
      setShowRightActions(false);
      if (onSwipeRight) {
        onSwipeRight();
        advancedHaptics.onSwipe();
      }
      translateX.value = withSpring(80);
    } else if (dx < -threshold) {
      // Swipe left
      setShowRightActions(true);
      setShowLeftActions(false);
      if (onSwipeLeft) {
        onSwipeLeft();
        advancedHaptics.onSwipe();
      }
      translateX.value = withSpring(-80);
    } else {
      // Reset
      setShowLeftActions(false);
      setShowRightActions(false);
      translateX.value = withSpring(0);
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      translateX.value = gestureState.dx;
    },
    onPanResponderRelease: (evt, gestureState) => {
      handleSwipe(gestureState);
    },
  });

  return (
    <View style={[styles.swipeableContainer, style]}>
      {/* Left Actions */}
      {showLeftActions && (
        <View style={[styles.actionsContainer, styles.leftActions]}>
          {leftActions}
        </View>
      )}
      
      {/* Right Actions */}
      {showRightActions && (
        <View style={[styles.actionsContainer, styles.rightActions]}>
          {rightActions}
        </View>
      )}
      
      {/* Main Content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  longPressIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rippleButton: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  swipeableContainer: {
    position: 'relative',
    flexDirection: 'row',
    marginVertical: 4,
  },
  swipeableContent: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 60,
    justifyContent: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
});
