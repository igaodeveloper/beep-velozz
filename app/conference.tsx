import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppTheme } from "@/utils/useAppTheme";
import { useResponsive } from "@/utils/useResponsive";
import { MaterialIcons } from "@expo/vector-icons";
import { Driver } from "@/services/firestore";
import DriversSelector from "@/components/DriversSelector";
import { advancedHaptics } from "@/utils/advancedHaptics";
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  getFirestore 
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

// Firebase config from app.json
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevelopment",
  authDomain: "beep-velozz.firebaseapp.com",
  projectId: "beep-velozz",
  storageBucket: "beep-velozz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

export default function ConferenceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();
  const responsive = useResponsive();

  const [operatorName, setOperatorName] = useState("");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [shopeeCount, setShopeeCount] = useState("");
  const [mercadoLivreCount, setMercadoLivreCount] = useState("");
  const [avulsoCount, setAvulsoCount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!operatorName.trim()) newErrors.operatorName = "Campo obrigatório";
    if (!driverId) newErrors.driverName = "Campo obrigatório";

    const shopee = Number(shopeeCount) || 0;
    const mercadoLivre = Number(mercadoLivreCount) || 0;
    const avulso = Number(avulsoCount) || 0;
    const total = shopee + mercadoLivre + avulso;

    if (total < 1) {
      newErrors.total = "Informe pelo menos um pacote";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    await advancedHaptics.trigger({ type: "heavy" });

    try {
      const driverName = drivers.find((d) => d.id === driverId)?.name || "";
      const declaredCounts = {
        shopee: Number(shopeeCount) || 0,
        mercadoLivre: Number(mercadoLivreCount) || 0,
        avulso: Number(avulsoCount) || 0,
      };

      // Initialize Firebase and create session
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      const sessionData = {
        operatorName: operatorName.trim(),
        driverName,
        driverId: driverId || undefined,
        declaredCounts,
        startTime: serverTimestamp(),
        status: "active",
      };
      
      const sessionRef = await addDoc(collection(db, "sessions"), sessionData);
      const sessionId = sessionRef.id;

      // Store session data globally
      if (typeof global !== 'undefined') {
        (global as any).currentSession = {
          id: sessionId,
          operatorName: operatorName.trim(),
          driverName,
          driverId,
          declaredCounts,
          startTime: new Date(),
          status: "active" as const,
        };
      }

      await advancedHaptics.trigger({ type: "success" });
      
      // Navigate back or to scanner
      if (params.returnTo) {
        router.back();
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      Alert.alert("Erro", "Não foi possível iniciar a conferência. Tente novamente.");
      await advancedHaptics.trigger({ type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = async () => {
    await advancedHaptics.trigger({ type: "light" });
    router.back();
  };

  useEffect(() => {
    async function loadDrivers() {
      setLoadingDrivers(true);
      try {
        const { fetchDriversWithCache } = await import("@/services/firestore");
        const list = await fetchDriversWithCache();
        setDrivers(list);
      } catch (e) {
        console.warn("failed load drivers", e);
      } finally {
        setLoadingDrivers(false);
      }
    }
    loadDrivers();
  }, []);

  const handleAddDriver = async (name: string) => {
    try {
      const { upsertDriver, fetchDriversWithCache } =
        await import("@/services/firestore");
      await upsertDriver({ name: name.trim(), active: true });
      const updated = await fetchDriversWithCache();
      setDrivers(updated);
      await advancedHaptics.trigger({ type: "success" });
    } catch (e) {
      console.warn("failed to add driver", e);
      await advancedHaptics.trigger({ type: "error" });
      throw e;
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      const { deleteDriver, fetchDriversWithCache } =
        await import("@/services/firestore");
      await deleteDriver(driverId);
      const updated = await fetchDriversWithCache();
      setDrivers(updated);
      await advancedHaptics.trigger({ type: "success" });
    } catch (e) {
      console.warn("failed to delete driver", e);
      await advancedHaptics.trigger({ type: "error" });
      throw e;
    }
  };

  const totalPackages = (Number(shopeeCount) || 0) + 
                        (Number(mercadoLivreCount) || 0) + 
                        (Number(avulsoCount) || 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: responsive.padding.lg,
          paddingVertical: responsive.padding.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{
            padding: responsive.spacing.sm,
            marginRight: responsive.spacing.md,
          }}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text
          style={{
            color: colors.text,
            fontSize: responsive.fontSize.xl,
            fontWeight: "700",
            flex: 1,
          }}
        >
          Iniciar Conferência
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: responsive.padding.lg,
            paddingBottom: responsive.padding.xxl,
          }}
        >
          {/* Hero Section */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={{
              alignItems: "center",
              marginVertical: responsive.spacing.xl,
            }}
          >
            <View
              style={{
                width: responsive.isTablet ? 160 : 140,
                height: responsive.isTablet ? 160 : 140,
                borderRadius: responsive.borderRadius.xxl,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: responsive.padding.lg,
                borderWidth: 2,
                borderColor: colors.primary + "40",
              }}
            >
              <Image
                source={require("../assets/images/session.png")}
                style={{ 
                  width: "80%", 
                  height: "80%", 
                  resizeMode: "contain" 
                }}
              />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: responsive.fontSize.xxxl,
                fontWeight: "800",
                letterSpacing: 1,
                marginBottom: responsive.spacing.sm,
              }}
            >
              beep velozz
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: responsive.fontSize.md,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Preencha os dados abaixo para iniciar uma nova sessão de conferência
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: responsive.borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: responsive.padding.xl,
              marginBottom: responsive.spacing.xl,
            }}
          >
            {/* Operator Name */}
            <View style={{ marginBottom: responsive.padding.xl }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: responsive.fontSize.xs,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  marginBottom: responsive.spacing.sm,
                  textTransform: "uppercase",
                }}
              >
                Nome do Operador
              </Text>
              <TextInput
                value={operatorName}
                onChangeText={setOperatorName}
                placeholder="Digite seu nome"
                placeholderTextColor={colors.textSubtle}
                style={{
                  backgroundColor: colors.surface2,
                  borderWidth: 1,
                  borderColor: errors.operatorName
                    ? colors.danger
                    : colors.border2,
                  borderRadius: responsive.borderRadius.md,
                  padding: responsive.padding.md,
                  color: colors.text,
                  fontSize: responsive.fontSize.md,
                  fontWeight: "500",
                }}
                autoCapitalize="words"
              />
              {errors.operatorName && (
                <Text
                  style={{ 
                    color: colors.danger, 
                    fontSize: responsive.fontSize.sm, 
                    marginTop: responsive.spacing.xs 
                  }}
                >
                  {errors.operatorName}
                </Text>
              )}
            </View>

            {/* Driver Selector */}
            <View style={{ marginBottom: responsive.padding.xl }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: responsive.fontSize.xs,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  marginBottom: responsive.spacing.sm,
                  textTransform: "uppercase",
                }}
              >
                Motorista
              </Text>
              <DriversSelector
                drivers={drivers}
                selectedDriverId={driverId}
                onSelectionChange={setDriverId}
                onAddDriver={handleAddDriver}
                onDeleteDriver={handleDeleteDriver}
                loadingDrivers={loadingDrivers}
              />
              {errors.driverName && (
                <Text
                  style={{ 
                    color: colors.danger, 
                    fontSize: responsive.fontSize.sm, 
                    marginTop: responsive.spacing.xs 
                  }}
                >
                  {errors.driverName}
                </Text>
              )}
            </View>

            {/* Declared Counts */}
            <View style={{ marginBottom: responsive.padding.xl }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: responsive.fontSize.xs,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  marginBottom: responsive.padding.md,
                  textTransform: "uppercase",
                }}
              >
                Quantidade Declarada
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: responsive.spacing.md,
                  marginBottom: responsive.padding.lg,
                }}
              >
                {/* Shopee */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#fb923c",
                      fontSize: responsive.fontSize.xs,
                      fontWeight: "600",
                      marginBottom: responsive.spacing.sm,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    Shopee
                  </Text>
                  <TextInput
                    value={shopeeCount}
                    onChangeText={setShopeeCount}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.surface2,
                      borderWidth: 1,
                      borderColor: errors.shopee
                        ? colors.danger
                        : colors.border2,
                      borderRadius: responsive.borderRadius.md,
                      padding: responsive.padding.md,
                      color: colors.text,
                      fontSize: responsive.fontSize.xl,
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  />
                </View>

                {/* Mercado Livre */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#ffe600",
                      fontSize: responsive.fontSize.xs,
                      fontWeight: "600",
                      marginBottom: responsive.spacing.sm,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    Mercado Livre
                  </Text>
                  <TextInput
                    value={mercadoLivreCount}
                    onChangeText={setMercadoLivreCount}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.surface2,
                      borderWidth: 1,
                      borderColor: errors.mercadoLivre
                        ? colors.danger
                        : colors.border2,
                      borderRadius: responsive.borderRadius.md,
                      padding: responsive.padding.md,
                      color: colors.text,
                      fontSize: responsive.fontSize.xl,
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  />
                </View>

                {/* Avulso */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.success,
                      fontSize: responsive.fontSize.xs,
                      fontWeight: "600",
                      marginBottom: responsive.spacing.sm,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    Avulso
                  </Text>
                  <TextInput
                    value={avulsoCount}
                    onChangeText={setAvulsoCount}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.surface2,
                      borderWidth: 1,
                      borderColor: errors.avulso
                        ? colors.danger
                        : colors.border2,
                      borderRadius: responsive.borderRadius.md,
                      padding: responsive.padding.md,
                      color: colors.text,
                      fontSize: responsive.fontSize.xl,
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  />
                </View>
              </View>

              {/* Total */}
              <View
                style={{
                  backgroundColor: colors.primary + "10",
                  borderRadius: responsive.borderRadius.md,
                  padding: responsive.padding.lg,
                  borderWidth: 2,
                  borderColor: colors.primary + "30",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: responsive.fontSize.sm,
                    fontWeight: "600",
                    marginBottom: responsive.spacing.xs,
                  }}
                >
                  TOTAL DE PACOTES
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: responsive.fontSize.xxxl,
                    fontWeight: "800",
                  }}
                >
                  {totalPackages}
                </Text>
              </View>

              {errors.total && (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: responsive.fontSize.sm,
                    marginTop: responsive.spacing.sm,
                    textAlign: "center",
                  }}
                >
                  {errors.total}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Start Button */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(400)}
          >
            <TouchableOpacity
              onPress={handleStart}
              disabled={isSubmitting}
              activeOpacity={0.85}
              style={{
                backgroundColor: isSubmitting ? colors.surface2 : colors.primary,
                borderRadius: responsive.borderRadius.md,
                padding: responsive.padding.xl,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: responsive.spacing.md,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator 
                  size="small" 
                  color={colors.text} 
                />
              ) : (
                <MaterialIcons
                  name="play-arrow"
                  size={24}
                  color={colors.secondary}
                />
              )}
              <Text
                style={{
                  color: colors.secondary,
                  fontSize: responsive.fontSize.xl,
                  fontWeight: "800",
                  letterSpacing: 1,
                }}
              >
                {isSubmitting ? "Iniciando..." : "Iniciar Conferência"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
