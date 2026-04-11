import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeOutDown,
  SlideInLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { useAppTheme } from "@/utils/useAppTheme";
import { Driver } from "@/services/firestore";

interface DriversSelectorProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelectionChange: (driverId: string | null) => void;
  onAddDriver: (name: string) => Promise<void>;
  onDeleteDriver: (driverId: string) => Promise<void>;
  loadingDrivers?: boolean;
  savingDriver?: boolean;
}

export default function DriversSelector({
  drivers,
  selectedDriverId,
  onSelectionChange,
  onAddDriver,
  onDeleteDriver,
  loadingDrivers = false,
  savingDriver = false,
}: DriversSelectorProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [newDriverName, setNewDriverName] = useState("");
  const [showNewDriver, setShowNewDriver] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState("");

  const handleAddDriver = async () => {
    if (!newDriverName.trim()) return;
    try {
      await onAddDriver(newDriverName.trim());
      setNewDriverName("");
      setShowNewDriver(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível adicionar o motorista");
    }
  };

  const handleDeleteDriver = (driverId: string, driverName: string) => {
    Alert.alert(
      "Remover Motorista",
      `Tem certeza que deseja remover ${driverName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingDriverId(driverId);
              await onDeleteDriver(driverId);
              if (selectedDriverId === driverId) {
                onSelectionChange(null);
              }
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover o motorista");
            } finally {
              setDeletingDriverId(null);
            }
          },
        },
      ],
    );
  };

  const sortedDrivers = useMemo(
    () =>
      [...drivers].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      ),
    [drivers],
  );

  const filteredDrivers = useMemo(
    () =>
      sortedDrivers.filter((d) =>
        d.name.toLowerCase().includes(driverSearch.trim().toLowerCase()),
      ),
    [sortedDrivers, driverSearch],
  );

  const selectedDriver = sortedDrivers.find((d) => d.id === selectedDriverId);

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Label */}
      <Text
        style={{
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.5,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        🚗 Motorista
      </Text>

      {loadingDrivers ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <>
          {/* Selected Driver Card */}
          <TouchableOpacity
            onPress={() => setExpandedDrivers(!expandedDrivers)}
            activeOpacity={0.75}
            style={{
              backgroundColor: selectedDriver
                ? colors.primary
                : colors.surface2,
              borderWidth: 1,
              borderColor: selectedDriver ? colors.primary : colors.border2,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              shadowColor: selectedDriver ? colors.primary : "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: selectedDriver ? 0.15 : 0,
              shadowRadius: 4,
              elevation: selectedDriver ? 3 : 0,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: selectedDriver
                    ? colors.secondary
                    : colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: selectedDriver ? "transparent" : colors.border,
                }}
              >
                <Text style={{ fontSize: 20 }}>🚗</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: selectedDriver ? colors.secondary : colors.textMuted,
                    fontSize: 12,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Selecionado
                </Text>
                <Text
                  style={{
                    color: selectedDriver ? colors.secondary : colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {selectedDriver
                    ? selectedDriver.name
                    : "Selecione um motorista"}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name={expandedDrivers ? "expand-less" : "expand-more"}
              size={24}
              color={selectedDriver ? colors.secondary : colors.text}
            />
          </TouchableOpacity>

          {/* Drivers List - Expandable */}
          {expandedDrivers && (
            <Animated.View
              entering={FadeInDown.duration(250)}
              exiting={FadeOutDown.duration(200)}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 10,
                maxHeight: width > 480 ? 300 : 250,
              }}
            >
              <>
                {/* Search input inside list */}
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    paddingBottom: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <TextInput
                    value={driverSearch}
                    onChangeText={setDriverSearch}
                    placeholder="Buscar motorista pelo nome..."
                    placeholderTextColor={colors.textSubtle}
                    style={{
                      backgroundColor: colors.surface2,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border2,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.text,
                      fontSize: 13,
                    }}
                  />
                </View>

                <ScrollView
                  style={{ maxHeight: width > 480 ? 300 : 250 }}
                  nestedScrollEnabled={true}
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  bounces={false}
                >
                  {filteredDrivers.length > 0 ? (
                    filteredDrivers.map((driver, index) => {
                      const isSelected = driver.id === selectedDriverId;
                      return (
                        <Animated.View
                          key={driver.id}
                          entering={SlideInLeft.delay(index * 30)}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              onSelectionChange(driver.id);
                              setExpandedDrivers(false);
                            }}
                            activeOpacity={0.7}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 12,
                              paddingHorizontal: 14,
                              backgroundColor: isSelected
                                ? colors.primary
                                : "transparent",
                              borderBottomWidth:
                                index < drivers.length - 1 ? 1 : 0,
                              borderBottomColor: colors.border2,
                            }}
                          >
                            {/* Checkbox */}
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                borderWidth: 2,
                                borderColor: isSelected
                                  ? colors.secondary
                                  : colors.border2,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: isSelected
                                  ? colors.secondary
                                  : "transparent",
                                marginRight: 12,
                              }}
                            >
                              {isSelected && (
                                <MaterialIcons
                                  name="check"
                                  size={16}
                                  color={colors.primary}
                                />
                              )}
                            </View>

                            {/* Driver Name */}
                            <Text
                              style={{
                                flex: 1,
                                color: isSelected
                                  ? colors.secondary
                                  : colors.text,
                                fontSize: 15,
                                fontWeight: isSelected ? "700" : "500",
                              }}
                              numberOfLines={1}
                            >
                              {driver.name}
                            </Text>

                            {/* Delete Button */}
                            <TouchableOpacity
                              onPress={() =>
                                handleDeleteDriver(driver.id, driver.name)
                              }
                              disabled={deletingDriverId === driver.id}
                              style={{
                                padding: 6,
                                marginLeft: 8,
                                opacity:
                                  deletingDriverId === driver.id ? 0.5 : 1,
                              }}
                            >
                              {deletingDriverId === driver.id ? (
                                <ActivityIndicator
                                  size="small"
                                  color={colors.danger}
                                />
                              ) : (
                                <MaterialIcons
                                  name="delete-outline"
                                  size={18}
                                  color={colors.danger}
                                />
                              )}
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })
                  ) : (
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                        {drivers.length === 0
                          ? "Nenhum motorista cadastrado"
                          : "Nenhum motorista encontrado para essa busca"}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            </Animated.View>
          )}

          {/* Add New Driver Button */}
          <TouchableOpacity
            onPress={() => setShowNewDriver(!showNewDriver)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 11,
              paddingHorizontal: 16,
              backgroundColor: colors.surface2,
              borderWidth: 2,
              borderColor: colors.primary,
              borderStyle: "dashed",
              borderRadius: 10,
              marginBottom: showNewDriver ? 10 : 0,
            }}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text
              style={{
                color: colors.primary,
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              Novo Motorista
            </Text>
          </TouchableOpacity>

          {/* New Driver Input Form */}
          {showNewDriver && (
            <Animated.View
              entering={FadeInDown.duration(250)}
              exiting={FadeOutDown.duration(200)}
              style={{
                marginTop: 10,
                borderRadius: 12,
                backgroundColor: colors.surface,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.primary,
                borderStyle: "dashed",
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 1,
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}
              >
                Nome do Motorista
              </Text>
              <TextInput
                value={newDriverName}
                onChangeText={setNewDriverName}
                placeholder="Digite o nome completo"
                placeholderTextColor={colors.textSubtle}
                editable={!savingDriver}
                style={{
                  backgroundColor: colors.surface2,
                  borderWidth: 1,
                  borderColor: colors.border2,
                  borderRadius: 10,
                  padding: 12,
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: "500",
                  marginBottom: 10,
                }}
              />

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowNewDriver(false);
                    setNewDriverName("");
                  }}
                  disabled={savingDriver}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border2,
                    alignItems: "center",
                    opacity: savingDriver ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddDriver}
                  disabled={savingDriver || !newDriverName.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    opacity: savingDriver || !newDriverName.trim() ? 0.65 : 1,
                  }}
                >
                  {savingDriver ? (
                    <ActivityIndicator color={colors.secondary} size="small" />
                  ) : (
                    <Text
                      style={{
                        color: colors.secondary,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      Adicionar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}
