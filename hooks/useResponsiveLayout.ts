import { useState, useEffect } from "react";
import { Dimensions } from "react-native";
import {
  getDeviceInfo,
  getResponsiveValue,
  DeviceInfo,
} from "../utils/orientationUtils";

export const useResponsiveLayout = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo());

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", () => {
      setDeviceInfo(getDeviceInfo());
    });
    return () => subscription?.remove();
  }, []);

  return deviceInfo;
};

export const useResponsiveValue = <T>(values: {
  phone?: T;
  tablet?: T;
  portrait?: T;
  landscape?: T;
  default: T;
}): T => {
  const deviceInfo = useResponsiveLayout();

  if (deviceInfo.isTablet && values.tablet !== undefined) {
    return values.tablet;
  }

  if (deviceInfo.isLandscape && values.landscape !== undefined) {
    return values.landscape;
  }

  if (deviceInfo.isPortrait && values.portrait !== undefined) {
    return values.portrait;
  }

  if (deviceInfo.isPhone && values.phone !== undefined) {
    return values.phone;
  }

  return values.default;
};

export const useResponsiveStyles = <T extends Record<string, any>>(
  baseStyles: T,
  responsiveOverrides?: {
    tablet?: Partial<T>;
    landscape?: Partial<T>;
    portrait?: Partial<T>;
  },
): T => {
  const deviceInfo = useResponsiveLayout();
  let finalStyles = { ...baseStyles };

  if (deviceInfo.isTablet && responsiveOverrides?.tablet) {
    finalStyles = { ...finalStyles, ...responsiveOverrides.tablet };
  }

  if (deviceInfo.isLandscape && responsiveOverrides?.landscape) {
    finalStyles = { ...finalStyles, ...responsiveOverrides.landscape };
  }

  if (deviceInfo.isPortrait && responsiveOverrides?.portrait) {
    finalStyles = { ...finalStyles, ...responsiveOverrides.portrait };
  }

  return finalStyles;
};
