import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { ThemeName, themePresets } from "@/utils/theme";

export default function ThemeTest() {
  const { themeName, setThemeName, colors, theme } = useAppTheme();

  const themes: ThemeName[] = [
    "light",
    "dark",
    "ocean",
    "forest",
    "sunset",
    "midnight",
    "arctic",
    "volcano",
    "rose",
    "emerald",
    "amber",
  ];

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          color: colors.text,
        }}
      >
        Teste de Temas
      </Text>

      <Text
        style={{
          fontSize: 16,
          marginBottom: 10,
          color: colors.textMuted,
        }}
      >
        Tema atual: {theme?.name || "N/A"}
      </Text>

      <Text
        style={{
          fontSize: 16,
          marginBottom: 20,
          color: colors.textMuted,
        }}
      >
        Cor primária: {colors.primary}
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Clique para mudar o tema:
        </Text>

        {themes.map((theme, themeIndex) => (
          <TouchableOpacity
            key={`theme-${theme}-${themeIndex}`}
            style={{
              backgroundColor: themePresets[theme].colors.primary,
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
              borderWidth: themeName === theme ? 3 : 1,
              borderColor: themeName === theme ? "#000" : "transparent",
            }}
            onPress={() => setThemeName(theme)}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {themePresets[theme].name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Preview do Tema Atual:
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.text }}>Fundo:</Text>
          <View
            style={{
              width: 50,
              height: 20,
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.text }}>Surface:</Text>
          <View
            style={{
              width: 50,
              height: 20,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.text }}>Primary:</Text>
          <View
            style={{
              width: 50,
              height: 20,
              backgroundColor: colors.primary,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.text }}>Texto:</Text>
          <Text style={{ color: colors.text }}>Exemplo</Text>
        </View>
      </View>
    </ScrollView>
  );
}
