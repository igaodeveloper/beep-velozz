// src/utils/scannerParser.ts

import { PEDIDO_TYPES, PedidoType } from "../config/apiConfig";

export type TipoPedido = PedidoType;

export interface ParsedCode {
  codigo: string;
  tipo: TipoPedido;
  valido: boolean;
  mensagem?: string;
}

/**
 * Parser inteligente para identificar o tipo de código escaneado
 * Baseado em padrões conhecidos dos marketplaces
 */
export class ScannerParser {
  // Padrões de regex para identificar tipos de códigos
  private static readonly PATTERNS = {
    SHOPEE: /^SPXBR\d{8,12}$/i, // SPXBR12345678
    // Mercado Livre agora aceita apenas códigos que começam com 20000
    MERCADO_LIVRE: /^20000\d*$/i,
    LOGMANAGER: /^BR\d{10,12}$/i, // BR1234567890
    AVULSO: /^[A-Z0-9]{8,20}$/i, // Códigos internos genéricos
  };

  /**
   * Analisa um código escaneado e determina seu tipo
   */
  static parseCode(codigo: string): ParsedCode {
    if (!codigo || typeof codigo !== "string") {
      return {
        codigo,
        tipo: "AVULSO",
        valido: false,
        mensagem: "Código inválido ou vazio",
      };
    }

    // Extrai id de JSON quando presente (alguns scanners enviam objeto serializado)
    let input = codigo;
    if (input.startsWith("{") && input.endsWith("}")) {
      try {
        const obj = JSON.parse(input);
        if (obj && typeof obj.id === "string") {
          input = obj.id;
        }
      } catch {
        // se não for JSON válido, manter o original
      }
    }

    // Remover espaços e caracteres especiais
    let cleanCode = input.trim().replace(/[^A-Z0-9]/gi, "");

    // Se o código não começa com ML mas contém um fragmento válido (pode
    // ocorrer em QR codes que retornam um URL ou payload maior), extraímos
    // o primeiro trecho que iniciam com 20000 ou 46. Isso permite capturar o
    // valor real mesmo quando o scanner lê uma URL completa.
    if (!/^(20000|46)/.test(cleanCode)) {
      const frag = cleanCode.match(/(ID)?(20000|46)[0-9]+/);
      if (frag) {
        const before = cleanCode;
        cleanCode = frag[0];
        console.debug(
          `[ScannerParser] extracted ML fragment from "${before}" → "${cleanCode}"`,
        );
      }
    }

    // Alguns pacotes Mercado Livre podem vir com apenas o prefixo numérico
    // e comprimento reduzido; por isso a validação de tamanho mínimo é
    // relaxada nesses casos. Códigos ML numéricos precisam apenas ter 5
    // caracteres (20000) ou 2 caracteres (46) para serem reconhecidos abaixo.
    if (cleanCode.length < 8 && !/^(20000|46)/.test(cleanCode)) {
      return {
        codigo: cleanCode,
        tipo: "AVULSO",
        valido: false,
        mensagem: "Código muito curto (mínimo 8 caracteres)",
      };
    }

    if (cleanCode.length > 20) {
      return {
        codigo: cleanCode,
        tipo: "AVULSO",
        valido: false,
        mensagem: "Código muito longo (máximo 20 caracteres)",
      };
    }

    // Verificar padrões específicos
    if (this.PATTERNS.SHOPEE.test(cleanCode)) {
      return {
        codigo: cleanCode,
        tipo: PEDIDO_TYPES.SHOPEE,
        valido: true,
      };
    }

    // reconhecimento de Mercado Livre: apenas códigos que começam com 20000
    if (this.PATTERNS.MERCADO_LIVRE.test(cleanCode)) {
      return {
        codigo: cleanCode,
        tipo: PEDIDO_TYPES.MERCADO_LIVRE,
        valido: true,
      };
    }

    if (this.PATTERNS.LOGMANAGER.test(cleanCode)) {
      return {
        codigo: cleanCode,
        tipo: PEDIDO_TYPES.LOGMANAGER,
        valido: true,
      };
    }

    // Se não corresponde a nenhum padrão específico, considerar como AVULSO
    if (this.PATTERNS.AVULSO.test(cleanCode)) {
      return {
        codigo: cleanCode,
        tipo: "AVULSO",
        valido: true,
      };
    }

    return {
      codigo: cleanCode,
      tipo: "AVULSO",
      valido: false,
      mensagem: "Formato de código não reconhecido",
    };
  }

  /**
   * Valida se um código é válido para consulta
   */
  static isValidCode(codigo: string): boolean {
    const parsed = this.parseCode(codigo);
    return parsed.valido;
  }

  /**
   * Obtém o tipo de pedido baseado no código
   */
  static getTipoPedido(codigo: string): TipoPedido {
    const parsed = this.parseCode(codigo);
    return parsed.tipo;
  }

  /**
   * Formata um código para exibição
   */
  static formatCodeForDisplay(codigo: string): string {
    const parsed = this.parseCode(codigo);
    if (!parsed.valido) return codigo;

    // Adicionar formatação baseada no tipo
    switch (parsed.tipo) {
      case "SHOPEE":
        return `SPX-BR-${parsed.codigo.slice(5)}`;
      case "MERCADO_LIVRE":
        // códigos numéricos começando com 20000 são retornados "raw"
        return parsed.codigo;
      case "LOGMANAGER":
        return `BR-${parsed.codigo.slice(2)}`;
      default:
        return parsed.codigo;
    }
  }

  /**
   * Exemplos de códigos válidos para cada tipo
   */
  static getExamples(): Record<TipoPedido, string[]> {
    return {
      SHOPEE: ["SPXBR12345678", "SPXBR87654321"],
      MERCADO_LIVRE: ["20000987654321", "20000123456789"],
      LOGMANAGER: ["BR1234567890", "BR0987654321"],
      AVULSO: ["PEDIDO001", "AVULSO123", "INTERNO456"],
    };
  }
}
