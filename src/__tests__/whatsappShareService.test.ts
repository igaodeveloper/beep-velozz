/**
 * WhatsApp Share Service Tests
 * Testes unitários para o serviço de compartilhamento WhatsApp
 */

import { whatsappShareService } from "@/services/whatsappShareService";
import { Session, ScannedPackage } from "@/types/session";

// Mock do React Native
jest.mock("react-native", () => ({
  Share: {
    share: jest.fn(),
  },
  Platform: {
    OS: "ios",
  },
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock do expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

// Mock do expo-clipboard
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

describe("WhatsAppShareService", () => {
  const mockSession: Session = {
    id: "test-session-1",
    operatorName: "João Silva",
    driverName: "Motorista Teste",
    declaredCount: 10,
    declaredCounts: {
      shopee: 5,
      mercadoLivre: 3,
      avulso: 2,
    },
    packages: [
      {
        id: "pkg-1",
        code: "BR1234567890123",
        type: "shopee",
        value: 15.50,
        scannedAt: "2024-01-15T10:30:00Z",
      },
      {
        id: "pkg-2",
        code: "200009876543210",
        type: "mercado_livre",
        value: 25.00,
        scannedAt: "2024-01-15T10:31:00Z",
      },
    ],
    startedAt: "2024-01-15T10:00:00Z",
    completedAt: "2024-01-15T11:00:00Z",
    hasDivergence: false,
  };

  const mockPackage: ScannedPackage = {
    id: "pkg-1",
    code: "BR1234567890123",
    type: "shopee",
    value: 15.50,
    scannedAt: "2024-01-15T10:30:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("shareSession", () => {
    it("deve compartilhar sessão com sucesso via WhatsApp", async () => {
      const { Linking } = require("react-native");
      
      // Mock WhatsApp disponível
      Linking.canOpenURL.mockResolvedValue(true);
      Linking.openURL.mockResolvedValue(undefined);

      const result = await whatsappShareService.shareSession(mockSession);

      expect(result.success).toBe(true);
      expect(result.method).toBe("whatsapp");
      expect(Linking.canOpenURL).toHaveBeenCalledWith(
        expect.stringContaining("wa.me/")
      );
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining("wa.me/")
      );
    });

    it("deve usar fallback quando WhatsApp não está disponível", async () => {
      const { Share, Linking } = require("react-native");
      
      // Mock WhatsApp indisponível
      Linking.canOpenURL.mockResolvedValue(false);
      Share.share.mockResolvedValue({ action: "sharedAction" });

      const result = await whatsappShareService.shareSession(mockSession);

      expect(result.success).toBe(true);
      expect(result.method).toBe("general");
      expect(Share.share).toHaveBeenCalledWith({
        message: expect.stringContaining("RELATÓRIO"),
        title: "Relatório Beep Velozz",
      });
    });

    it("deve incluir lista detalhada quando solicitado", async () => {
      const { Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(true);
      Linking.openURL.mockResolvedValue(undefined);

      await whatsappShareService.shareSession(mockSession, {
        includeDetailedList: true,
      });

      const whatsappUrl = Linking.openURL.mock.calls[0][0];
      const message = decodeURIComponent(whatsappUrl.split("text=")[1]);
      
      expect(message).toContain("LISTA DETALHADA DE PACOTES");
      expect(message).toContain("BR1234567890123");
      expect(message).toContain("200009876543210");
    });

    it("deve incluir mensagem customizada quando fornecida", async () => {
      const { Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(true);
      Linking.openURL.mockResolvedValue(undefined);

      const customMessage = "Relatório especial para cliente";
      await whatsappShareService.shareSession(mockSession, {
        customMessage,
      });

      const whatsappUrl = Linking.openURL.mock.calls[0][0];
      const message = decodeURIComponent(whatsappUrl.split("text=")[1]);
      
      expect(message).toContain(customMessage);
      expect(message).toContain("RELATÓRIO");
    });
  });

  describe("sharePackage", () => {
    it("deve compartilhar pacote individual com sucesso", async () => {
      const { Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(true);
      Linking.openURL.mockResolvedValue(undefined);

      const result = await whatsappShareService.sharePackage(mockPackage);

      expect(result.success).toBe(true);
      expect(result.method).toBe("whatsapp");
      
      const whatsappUrl = Linking.openURL.mock.calls[0][0];
      const message = decodeURIComponent(whatsappUrl.split("text=")[1]);
      
      expect(message).toContain("PACOTE ESCANEADO");
      expect(message).toContain("BR1234567890123");
      expect(message).toContain("Shopee");
      expect(message).toContain("R$ 15,50");
    });

    it("deve incluir contexto da sessão quando fornecido", async () => {
      const { Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(true);
      Linking.openURL.mockResolvedValue(undefined);

      const sessionInfo = {
        operatorName: "João Silva",
        driverName: "Motorista Teste",
        startedAt: "2024-01-15T10:00:00Z",
      };

      await whatsappShareService.sharePackage(mockPackage, sessionInfo);

      const whatsappUrl = Linking.openURL.mock.calls[0][0];
      const message = decodeURIComponent(whatsappUrl.split("text=")[1]);
      
      expect(message).toContain("CONTEXTO");
      expect(message).toContain("João Silva");
      expect(message).toContain("Motorista Teste");
    });
  });

  describe("isWhatsAppAvailable", () => {
    it("deve verificar disponibilidade do WhatsApp", async () => {
      const { Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(true);
      
      const isAvailable = await whatsappShareService.isWhatsAppAvailable();
      
      expect(isAvailable).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith("https://wa.me/");
    });

    it("deve retornar false quando WhatsApp não está disponível", async () => {
      const { Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(false);
      
      const isAvailable = await whatsappShareService.isWhatsAppAvailable();
      
      expect(isAvailable).toBe(false);
    });
  });

  describe("tratamento de erros", () => {
    it("deve lidar com erro no compartilhamento", async () => {
      const { Share, Linking } = require("react-native");
      
      Linking.canOpenURL.mockResolvedValue(false);
      Share.share.mockRejectedValue(new Error("Share failed"));

      const result = await whatsappShareService.shareSession(mockSession);

      expect(result.success).toBe(false);
      expect(result.method).toBe("general");
      expect(result.error).toBeDefined();
    });

    it("deve usar clipboard como último recurso", async () => {
      const { Share, Linking } = require("react-native");
      const Clipboard = require("expo-clipboard").default;
      
      Linking.canOpenURL.mockResolvedValue(false);
      Share.share.mockRejectedValue(new Error("Share failed"));
      Clipboard.setStringAsync.mockResolvedValue(undefined);

      const result = await whatsappShareService.shareSession(mockSession);

      expect(result.success).toBe(true);
      expect(result.method).toBe("clipboard");
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
    });
  });
});
