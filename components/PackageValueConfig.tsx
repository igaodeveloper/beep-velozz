import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { packagePricingService } from "@/services/packagePricingService";

interface PackageValues {
  shopee: string;
  mercadoLivre: string;
  avulso: string;
}

export default function PackageValueConfig({ onClose }: { onClose: () => void }) {
  const { colors } = useAppTheme();
  const [values, setValues] = useState<PackageValues>({
    shopee: "6.00",
    mercadoLivre: "8.00",
    avulso: "8.00",
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar valores atuais
  useEffect(() => {
    const loadCurrentValues = () => {
      try {
        const pricing = packagePricingService.getPricing();
        const currentValues: PackageValues = {
          shopee: "0.00",
          mercadoLivre: "0.00",
          avulso: "0.00",
        };

        pricing.forEach((pkg) => {
          if (pkg.type === "shopee") {
            currentValues.shopee = pkg.value.toFixed(2);
          } else if (pkg.type === "mercado_livre") {
            currentValues.mercadoLivre = pkg.value.toFixed(2);
          } else if (pkg.type === "avulso") {
            currentValues.avulso = pkg.value.toFixed(2);
          }
        });

        setValues(currentValues);
      } catch (error) {
        console.error("Erro ao carregar valores:", error);
      }
    };

    loadCurrentValues();
  }, []);

  // Validar valor monetário
  const validateMonetaryValue = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 9999.99;
  };

  // Formatar valor para monetário
  const formatMonetaryValue = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  // Handle input change
  const handleValueChange = (field: keyof PackageValues, value: string) => {
    // Permitir apenas números e ponto
    const cleanValue = value.replace(/[^0-9.]/g, "");
    
    // Permitir apenas um ponto decimal
    const parts = cleanValue.split(".");
    if (parts.length > 2) return;
    
    // Limitar a 2 casas decimais
    if (parts[1] && parts[1].length > 2) return;

    setValues((prev) => ({ ...prev, [field]: cleanValue }));
    setHasChanges(true);
  };

  // Salvar valores
  const handleSave = async () => {
    // Validar todos os valores
    const validation = Object.entries(values).map(([key, value]) => ({
      field: key,
      valid: validateMonetaryValue(value),
    }));

    const invalidFields = validation.filter((v) => !v.valid);
    if (invalidFields.length > 0) {
      Alert.alert(
        "Valores Inválidos",
        "Por favor, informe valores válidos para todos os pacotes (entre R$ 0,00 e R$ 9.999,99)."
      );
      return;
    }

    setLoading(true);
    try {
      // Preparar valores para salvar
      const formattedValues = {
        shopee: parseFloat(values.shopee),
        mercado_livre: parseFloat(values.mercadoLivre),
        avulso: parseFloat(values.avulso),
      };

      // Salvar usando o serviço de precificação
      await packagePricingService.updatePackageValues(formattedValues);

      Alert.alert(
        "Valores Atualizados",
        `Valores atualizados com sucesso:\n\n🛒 Shopee: R$ ${values.shopee}\n📦 Mercado Livre: R$ ${values.mercadoLivre}\n📦 Avulso: R$ ${values.avulso}`,
        [
          {
            text: "OK",
            onPress: () => {
              setHasChanges(false);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Erro ao salvar valores:", error);
      Alert.alert("Erro", "Não foi possível salvar os valores. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Resetar para valores padrão
  const handleReset = () => {
    Alert.alert(
      "Redefinir Valores",
      "Deseja redefinir todos os valores para os padrões do sistema?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Redefinir",
          style: "destructive",
          onPress: () => {
            setValues({
              shopee: "6.00",
              mercadoLivre: "8.00",
              avulso: "8.00",
            });
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const packageConfigs = [
    {
      key: "shopee",
      label: "Shopee",
      icon: "🛒",
      color: "#ff5722",
      description: "Pacotes da plataforma Shopee",
    },
    {
      key: "mercadoLivre",
      label: "Mercado Livre",
      icon: "📦",
      color: "#ffe600",
      description: "Pacotes do Mercado Livre",
    },
    {
      key: "avulso",
      label: "Avulsos",
      icon: "📦",
      color: "#22c55e",
      description: "Pacotes avulsos/outros",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 8,
          }}
        >
          Configurar Valores dos Pacotes
        </Text>
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          Defina o valor unitário para cada tipo de pacote. Estas configurações serão
          aplicadas em toda a aplicação.
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {packageConfigs.map((config) => (
          <View
            key={config.key}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: config.color + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>{config.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  {config.label}
                </Text>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {config.description}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface2,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 16,
                  fontWeight: "600",
                  marginRight: 12,
                }}
              >
                R$
              </Text>
              <TextInput
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "700",
                  paddingVertical: 0,
                }}
                value={values[config.key as keyof PackageValues]}
                onChangeText={(value) =>
                  handleValueChange(config.key as keyof PackageValues, value)
                }
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        ))}

        {/* Informações importantes */}
        <View
          style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            ⚠️ Informações Importantes
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            • Os valores devem ser informados em reais (BRL)\n
            • Use ponto como separador decimal (ex: 6.50)\n
            • Valores são aplicados a novas sessões\n
            • Valores vazios serão considerados como R$ 0,00
          </Text>
        </View>
      </ScrollView>

      {/* Footer com botões */}
      <View
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !hasChanges}
          style={{
            backgroundColor: hasChanges ? colors.primary : colors.surface2,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            opacity: hasChanges && !loading ? 1 : 0.6,
          }}
        >
          <Text
            style={{
              color: hasChanges ? colors.secondary : colors.textMuted,
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            {loading ? "Salvando..." : "Salvar Valores"}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={handleReset}
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Redefinir Padrão
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
