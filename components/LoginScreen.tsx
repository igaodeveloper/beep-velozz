import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { loginOperator, onAuthStateChange } from "@/services/firestore";
import { useAppTheme } from "@/utils/useAppTheme";

interface LoginScreenProps {
  onLoggedIn: (uid: string) => void;
}

export default function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      if (user) {
        onLoggedIn(user.uid);
      }
    });
    return unsub;
  }, [onLoggedIn]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await loginOperator(email.trim(), password);
      onLoggedIn(user.uid);
    } catch (e: any) {
      setError(e.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.text, fontSize: 22, marginBottom: 24 }}>
        Entrar
      </Text>
      {error ? (
        <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>
      ) : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          { borderColor: colors.border2, color: colors.text },
        ]}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          { borderColor: colors.border2, color: colors.text },
        ]}
        secureTextEntry
      />
      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.button, { backgroundColor: colors.primary }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={{ color: colors.surface, fontWeight: "700" }}>
            Entrar
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
