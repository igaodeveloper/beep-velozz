/**
 * Smart Suggestions Overlay
 * Componente para exibir sugestões inteligentes durante o scanning
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/utils/useAppTheme";
import { SmartSuggestion } from "@/types/aiPatternRecognition";
import { smartSuggestionsService } from "@/services/smartSuggestionsService";
import { ScannedPackage } from "@/types/session";

interface SmartSuggestionsOverlayProps {
  visible: boolean;
  recentPackages: ScannedPackage[];
  operatorId?: string;
  onSuggestionSelected: (suggestion: SmartSuggestion) => void;
  onDismiss: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function SmartSuggestionsOverlay({
  visible,
  recentPackages,
  operatorId,
  onSuggestionSelected,
  onDismiss,
}: SmartSuggestionsOverlayProps) {
  const { colors } = useAppTheme();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null,
  );

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);
  const scaleValue = useSharedValue(0.8);

  // Generate suggestions when packages change
  useEffect(() => {
    if (visible && recentPackages.length > 0) {
      const newSuggestions = smartSuggestionsService.generateSmartSuggestions(
        recentPackages,
        operatorId,
      );
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [recentPackages, operatorId, visible]);

  // Animate overlay visibility
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      scaleValue.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(screenHeight, { duration: 200 });
      scaleValue.value = withTiming(0.8, { duration: 200 });
      setSelectedSuggestion(null);
    }
  }, [visible]);

  // Handle suggestion selection
  const handleSuggestionPress = useCallback(
    (suggestion: SmartSuggestion) => {
      setSelectedSuggestion(suggestion.id);

      // Haptic feedback
      if (Platform.OS !== "web") {
        // Add haptic feedback here if needed
      }

      // Register feedback for learning
      smartSuggestionsService.registerSuggestionFeedback(suggestion.id, true);

      // Call parent callback
      onSuggestionSelected(suggestion);

      // Auto-dismiss after selection
      setTimeout(() => {
        onDismiss();
      }, 500);
    },
    [onSuggestionSelected, onDismiss],
  );

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  // Render suggestion item
  const renderSuggestion = useCallback(
    ({ item, index }: { item: SmartSuggestion; index: number }) => {
      const isSelected = selectedSuggestion === item.id;
      const priorityColors = {
        high: colors.success,
        medium: colors.warning,
        low: colors.text,
      };

      const sourceIcons = {
        pattern: "analytics-outline",
        history: "time-outline",
        ml_model: "brain-outline",
        sequential: "arrow-forward-outline",
        operator_habit: "person-outline",
      };

      return (
        <TouchableOpacity
          style={[
            styles.suggestionItem,
            {
              backgroundColor: isSelected
                ? colors.primary + "20"
                : colors.background,
              borderColor: isSelected ? colors.primary : colors.border,
              borderLeftColor: priorityColors[item.priority],
              borderLeftWidth: 4,
            },
          ]}
          onPress={() => handleSuggestionPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionHeader}>
            <View style={styles.suggestionIconContainer}>
              <Ionicons
                name={sourceIcons[item.source] as any}
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.suggestionContent}>
              <Text style={[styles.suggestionCode, { color: colors.text }]}>
                {item.code}
              </Text>
              <Text
                style={[
                  styles.suggestionReason,
                  { color: colors.textSecondary },
                ]}
              >
                {item.reason}
              </Text>
            </View>

            <View style={styles.suggestionMeta}>
              <Text
                style={[
                  styles.confidenceText,
                  { color: priorityColors[item.priority] },
                ]}
              >
                {Math.round(item.confidence * 100)}%
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </View>

          {/* Confidence bar */}
          <View
            style={[styles.confidenceBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.confidenceFill,
                {
                  backgroundColor: priorityColors[item.priority],
                  width: `${item.confidence * 100}%`,
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [colors, selectedSuggestion, handleSuggestionPress],
  );

  // Memoized suggestions list
  const suggestionsList = useMemo(() => suggestions, [suggestions]);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      />

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 100 : 80}
          style={styles.blurContainer}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <Ionicons name="bulb-outline" size={24} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Sugestões Inteligentes
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.background },
              ]}
              onPress={onDismiss}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Suggestions List */}
          <FlatList
            data={suggestionsList}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />
            )}
          />

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              💡 Baseado em padrões detectados e histórico
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  blurContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionCode: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  suggestionReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionMeta: {
    alignItems: "center",
    gap: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  confidenceBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 8,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 1,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});
