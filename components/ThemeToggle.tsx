import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useTheme } from "@/utils/themeContext";
import { useAppTheme } from "@/utils/useAppTheme";

export default function ThemeToggle() {
  const { colorScheme, setColorScheme } = useTheme();
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={() => setColorScheme(colorScheme === "light" ? "dark" : "light")}
      style={{
        padding: 8,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {colorScheme === "light" ? (
          <>
            <Moon size={20} color={colors.text} />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Escuro
            </Text>
          </>
        ) : (
          <>
            <Sun size={20} color={colors.primary} />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Claro</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
