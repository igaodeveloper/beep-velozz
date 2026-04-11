import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Easing as ReEasing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface DeliveryBoyLoadingProps {
  size?: "small" | "medium" | "large";
  duration?: number;
}

const { width: screenWidth } = Dimensions.get("window");

export default function DeliveryBoyLoading({
  size = "medium",
  duration = 3000,
}: DeliveryBoyLoadingProps) {
  // Animation values
  const positionX = useSharedValue(-100);
  const wheelRotation = useSharedValue(0);
  const bodyBounce = useSharedValue(0);
  const shadowScale = useSharedValue(0.8);

  // Size configurations
  const sizeConfig = {
    small: { scale: 0.6, roadHeight: 40 },
    medium: { scale: 1, roadHeight: 50 },
    large: { scale: 1.3, roadHeight: 60 },
  };

  const config = sizeConfig[size];
  const baseSize = 60 * config.scale;

  // Start animations
  useEffect(() => {
    // Horizontal movement
    positionX.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 0 }),
        withTiming(screenWidth + 100, {
          duration: duration,
          easing: ReEasing.bezier(0.4, 0, 0.2, 1),
        }),
      ),
      -1,
      false,
    );

    // Wheel rotation
    wheelRotation.value = withRepeat(
      withTiming(360, {
        duration: duration / 4,
        easing: ReEasing.linear,
      }),
      -1,
      false,
    );

    // Body bounce animation
    bodyBounce.value = withRepeat(
      withSequence(
        withTiming(0, { duration: duration / 8 }),
        withTiming(-5, { duration: duration / 8 }),
        withTiming(0, { duration: duration / 8 }),
      ),
      -1,
      true,
    );

    // Shadow pulse
    shadowScale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: duration / 6 }),
        withTiming(1.2, { duration: duration / 6 }),
      ),
      -1,
      true,
    );
  }, [duration]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: positionX.value }],
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotation.value}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyBounce.value }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: shadowScale.value }],
    opacity: interpolate(shadowScale.value, [0.8, 1.2], [0.3, 0.6]),
  }));

  return (
    <View style={[styles.container, { height: baseSize * 2 }]}>
      {/* Road */}
      <View style={[styles.road, { height: config.roadHeight }]}>
        {/* Road lines */}
        <View style={styles.roadLines}>
          {[...Array(8)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.roadLine,
                {
                  left: index * 60,
                  width: 30,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Delivery Boy Container */}
      <Animated.View style={[styles.deliveryContainer, containerStyle]}>
        {/* Shadow */}
        <Animated.View style={[styles.shadow, shadowStyle]} />

        {/* Motorcycle Body */}
        <Animated.View style={[styles.motorcycleBody, bodyStyle]}>
          {/* Main body */}
          <LinearGradient
            colors={["#FF6B35", "#F7931E", "#FFA500"]}
            style={styles.mainBody}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          {/* Seat */}
          <View style={styles.seat} />

          {/* Handlebars */}
          <View style={styles.handlebars} />

          {/* Front wheel */}
          <Animated.View style={[styles.wheel, styles.frontWheel, wheelStyle]}>
            <View style={styles.wheelRim} />
            <View style={styles.wheelSpoke} />
            <View
              style={[styles.wheelSpoke, { transform: [{ rotate: "120deg" }] }]}
            />
            <View
              style={[styles.wheelSpoke, { transform: [{ rotate: "240deg" }] }]}
            />
          </Animated.View>

          {/* Rear wheel */}
          <Animated.View style={[styles.wheel, styles.rearWheel, wheelStyle]}>
            <View style={styles.wheelRim} />
            <View style={styles.wheelSpoke} />
            <View
              style={[styles.wheelSpoke, { transform: [{ rotate: "120deg" }] }]}
            />
            <View
              style={[styles.wheelSpoke, { transform: [{ rotate: "240deg" }] }]}
            />
          </Animated.View>

          {/* Delivery Box */}
          <View style={styles.deliveryBox}>
            <LinearGradient
              colors={["#FF8C00", "#FF6347"]}
              style={styles.boxGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.boxStrap} />
            <View style={styles.boxHandle} />
          </View>
        </Animated.View>

        {/* Delivery Boy */}
        <View style={styles.deliveryBoy}>
          {/* Helmet */}
          <LinearGradient
            colors={["#FF8C00", "#FFA500"]}
            style={styles.helmet}
          />
          {/* Body */}
          <View style={styles.body} />
          {/* Arms */}
          <View style={[styles.arm, styles.leftArm]} />
          <View style={[styles.arm, styles.rightArm]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  road: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2C2C2C",
    borderTopWidth: 2,
    borderTopColor: "#FF6B35",
  },
  roadLines: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    flexDirection: "row",
    transform: [{ translateY: -2 }],
  },
  roadLine: {
    height: 4,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  deliveryContainer: {
    position: "absolute",
    bottom: 40,
    width: 120,
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  shadow: {
    position: "absolute",
    bottom: -5,
    left: 10,
    width: 80,
    height: 8,
    backgroundColor: "#000",
    borderRadius: 4,
  },
  motorcycleBody: {
    position: "relative",
    width: 80,
    height: 40,
  },
  mainBody: {
    position: "absolute",
    bottom: 5,
    left: 10,
    width: 50,
    height: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  seat: {
    position: "absolute",
    bottom: 18,
    left: 15,
    width: 25,
    height: 8,
    backgroundColor: "#8B4513",
    borderRadius: 4,
  },
  handlebars: {
    position: "absolute",
    bottom: 22,
    right: 5,
    width: 15,
    height: 2,
    backgroundColor: "#333",
    borderRadius: 1,
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1A1A1A",
    borderWidth: 2,
    borderColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  frontWheel: {
    right: 0,
  },
  rearWheel: {
    left: 5,
  },
  wheelRim: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF6B35",
  },
  wheelSpoke: {
    position: "absolute",
    width: 2,
    height: 14,
    backgroundColor: "#FFA500",
    borderRadius: 1,
  },
  deliveryBox: {
    position: "absolute",
    bottom: 20,
    left: 35,
    width: 20,
    height: 18,
    borderRadius: 3,
    overflow: "hidden",
  },
  boxGradient: {
    flex: 1,
    borderRadius: 3,
  },
  boxStrap: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: "#8B4513",
    borderRadius: 1,
  },
  boxHandle: {
    position: "absolute",
    top: -2,
    left: 8,
    width: 4,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  deliveryBoy: {
    position: "absolute",
    bottom: 25,
    right: 15,
    width: 25,
    height: 35,
  },
  helmet: {
    position: "absolute",
    top: 0,
    left: 5,
    width: 15,
    height: 12,
    borderRadius: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  body: {
    position: "absolute",
    top: 10,
    left: 7,
    width: 11,
    height: 15,
    backgroundColor: "#FF6B35",
    borderRadius: 5,
  },
  arm: {
    position: "absolute",
    width: 3,
    height: 10,
    backgroundColor: "#FF8C00",
    borderRadius: 1,
  },
  leftArm: {
    top: 12,
    left: 4,
    transform: [{ rotate: "-20deg" }],
  },
  rightArm: {
    top: 12,
    right: 4,
    transform: [{ rotate: "20deg" }],
  },
});
