import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Session, ScannedPackage } from "../types/session";
import { useAppTheme, ThemeColors } from "../utils/useAppTheme";

interface QualityCheckProps {
  session: Session;
  onApprove: (notes: string) => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}

export default function QualityCheck({
  session,
  onApprove,
  onReject,
  onClose,
}: QualityCheckProps) {
  const { colors } = useAppTheme();
  const [notes, setNotes] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"review" | "approve" | "reject">(
    "review",
  );

  const hasDuplicatePackages = session.packages.some(
    (p: ScannedPackage, i: number) =>
      session.packages.findIndex((x: ScannedPackage) => x.code === p.code) !==
      i,
  );

  const percentage =
    session.declaredCount > 0
      ? ((session.packages.length / session.declaredCount) * 100).toFixed(0)
      : "0";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.surface2,
        }}
      >
        <View>
          <Text
            style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}
          >
            CONTROLE DE QUALIDADE
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
            Avaliação de Sessão
          </Text>
        </View>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <InfoRow label="Operador" value={session.operatorName} />
          <InfoRow label="Motorista" value={session.driverName} />
          <InfoRow
            label="Pacotes"
            value={`${session.packages.length} / ${session.declaredCount}`}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TabButton
            label="Revisar"
            active={activeTab === "review"}
            onPress={() => setActiveTab("review")}
            colors={colors}
          />
          <TabButton
            label="Aprovar"
            active={activeTab === "approve"}
            onPress={() => setActiveTab("approve")}
            colors={colors}
            color={colors.success}
          />
          <TabButton
            label="Rejeitar"
            active={activeTab === "reject"}
            onPress={() => setActiveTab("reject")}
            colors={colors}
            color="#ef4444"
          />
        </View>

        {activeTab === "review" && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <QualityCheckItem label="Códigos legíveis" checked />
            <QualityCheckItem
              label="Sem duplicatas"
              checked={!hasDuplicatePackages}
            />
            <QualityCheckItem label="Documentação" checked={!!session.notes} />

            <Text style={{ marginTop: 16 }}>
              {session.packages.length} conferenciados ({percentage}%)
            </Text>
          </View>
        )}

        {activeTab === "approve" && (
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
            }}
          >
            <TextInput
              style={{
                backgroundColor: colors.surface2,
                padding: 12,
                minHeight: 100,
                borderRadius: 8,
                marginBottom: 16,
              }}
              placeholder="Observações..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              onPress={() => onApprove(notes)}
              style={{
                backgroundColor: colors.success,
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Aprovar Sessão
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "reject" && (
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
            }}
          >
            <TextInput
              style={{
                backgroundColor: colors.surface2,
                padding: 12,
                minHeight: 100,
                borderRadius: 8,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#ef4444",
              }}
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <TouchableOpacity
              disabled={!rejectReason.trim()}
              onPress={() => onReject(rejectReason)}
              style={{
                backgroundColor: rejectReason.trim() ? "#ef4444" : "#ccc",
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Rejeitar Sessão
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
  color?: string;
}

function TabButton({ label, active, onPress, colors, color }: TabButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: active ? color || colors.primary : colors.surface,
      }}
    >
      <Text
        style={{
          textAlign: "center",
          color: active ? "#fff" : colors.text,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface QualityCheckItemProps {
  label: string;
  checked: boolean;
}

function QualityCheckItem({ label, checked }: QualityCheckItemProps) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
    >
      <Text style={{ marginRight: 8 }}>{checked ? "✓" : "✗"}</Text>
      <Text style={{ color: checked ? "#10b981" : "#ef4444" }}>{label}</Text>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
