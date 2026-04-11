// components/PedidoScannerExample.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { usePedidoScanner } from "../src/hooks/usePedidoScanner";
import { ScannerParser } from "../src/utils/scannerParser";

export const PedidoScannerExample: React.FC = () => {
  const [codigoInput, setCodigoInput] = useState("");
  const {
    loading,
    pedido,
    erro,
    parsedCode,
    searchPedido,
    manualSearch,
    clearState,
  } = usePedidoScanner({ debounceMs: 800 });

  const handleInputChange = (text: string) => {
    setCodigoInput(text);
    searchPedido(text);
  };

  const handleManualSearch = () => {
    if (codigoInput.trim()) {
      manualSearch(codigoInput.trim());
    } else {
      Alert.alert("Erro", "Digite um código válido");
    }
  };

  const handleClear = () => {
    setCodigoInput("");
    clearState();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Scanner de Pedidos</Text>
      <Text style={styles.subtitle}>
        Digite ou escaneie um código de pedido
      </Text>

      {/* Input do código */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={codigoInput}
          onChangeText={handleInputChange}
          placeholder="Digite o código do pedido..."
          placeholderTextColor="#999"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.searchButton]}
            onPress={handleManualSearch}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Buscando..." : "Buscar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status do parsing */}
      {parsedCode && (
        <View style={styles.parsedCodeContainer}>
          <Text style={styles.parsedCodeLabel}>Código analisado:</Text>
          <Text style={styles.parsedCodeValue}>
            {ScannerParser.formatCodeForDisplay(parsedCode.codigo)}
          </Text>
          <Text
            style={[
              styles.parsedCodeType,
              { color: parsedCode.valido ? "#4CAF50" : "#F44336" },
            ]}
          >
            Tipo: {parsedCode.tipo} {parsedCode.valido ? "✓" : "✗"}
          </Text>
          {parsedCode.mensagem && (
            <Text style={styles.parsedCodeMessage}>{parsedCode.mensagem}</Text>
          )}
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Consultando pedido...</Text>
        </View>
      )}

      {/* Erro */}
      {erro && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Erro</Text>
          <Text style={styles.errorMessage}>{erro}</Text>
        </View>
      )}

      {/* Resultado do pedido */}
      {pedido && !loading && !erro && (
        <View style={styles.pedidoContainer}>
          <Text style={styles.pedidoTitle}>📦 Pedido Encontrado</Text>

          <View style={styles.pedidoInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código:</Text>
              <Text style={styles.infoValue}>{pedido.codigo}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{pedido.tipo}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{pedido.cliente.nome}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{pedido.status.nome}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data:</Text>
              <Text style={styles.infoValue}>
                {formatDate(pedido.dataCriacao)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valor Total:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(pedido.valorTotal)}
              </Text>
            </View>

            {pedido.entrega.transportadora && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transportadora:</Text>
                <Text style={styles.infoValue}>
                  {pedido.entrega.transportadora}
                </Text>
              </View>
            )}

            {pedido.entrega.codigoRastreamento && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rastreamento:</Text>
                <Text style={styles.infoValue}>
                  {pedido.entrega.codigoRastreamento}
                </Text>
              </View>
            )}
          </View>

          {/* Endereço de entrega */}
          <View style={styles.enderecoContainer}>
            <Text style={styles.enderecoTitle}>🏠 Endereço de Entrega</Text>
            <Text style={styles.enderecoText}>{pedido.entrega.endereco}</Text>
            <Text style={styles.enderecoText}>
              {pedido.entrega.cidade} - {pedido.entrega.estado}
            </Text>
            <Text style={styles.enderecoText}>CEP: {pedido.entrega.cep}</Text>
          </View>

          {/* Itens do pedido */}
          {pedido.itens && pedido.itens.length > 0 && (
            <View style={styles.itensContainer}>
              <Text style={styles.itensTitle}>📋 Itens do Pedido</Text>
              {pedido.itens.map((item, index) => (
                <View key={`item-${index}-${item.nome}`} style={styles.itemRow}>
                  <Text style={styles.itemNome}>{item.nome}</Text>
                  <Text style={styles.itemQuantidade}>
                    Qtd: {item.quantidade}
                  </Text>
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Exemplos de códigos */}
      <View style={styles.exemplosContainer}>
        <Text style={styles.exemplosTitle}>💡 Exemplos de Códigos</Text>
        {Object.entries(ScannerParser.getExamples()).map(([tipo, codigos]) => (
          <View key={tipo} style={styles.exemploTipo}>
            <Text style={styles.exemploTipoNome}>{tipo}:</Text>
            {codigos.map((codigo, index) => (
              <TouchableOpacity
                key={`codigo-${tipo}-${index}`}
                style={styles.exemploCodigo}
                onPress={() => setCodigoInput(codigo)}
              >
                <Text style={styles.exemploCodigoText}>{codigo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  searchButton: {
    backgroundColor: "#007AFF",
  },
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  parsedCodeContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  parsedCodeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  parsedCodeValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  parsedCodeType: {
    fontSize: 14,
    fontWeight: "600",
  },
  parsedCodeMessage: {
    fontSize: 14,
    color: "#F44336",
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F44336",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#333",
  },
  pedidoContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  pedidoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 16,
    textAlign: "center",
  },
  pedidoInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    flex: 2,
    textAlign: "right",
  },
  enderecoContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  enderecoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  enderecoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  itensContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  itensTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemNome: {
    fontSize: 14,
    color: "#333",
    flex: 2,
  },
  itemQuantidade: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  exemplosContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  exemplosTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  exemploTipo: {
    marginBottom: 12,
  },
  exemploTipoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  exemploCodigo: {
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  exemploCodigoText: {
    fontSize: 14,
    color: "#007AFF",
    fontFamily: "monospace",
  },
});
