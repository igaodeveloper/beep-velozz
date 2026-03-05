// src/hooks/usePedidoScanner.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { PedidosService } from '../services/pedidosService';
import { ScannerParser, ParsedCode } from '../utils/scannerParser';
import { Pedido, PedidoResponse } from '../types/Pedido';

interface UsePedidoScannerState {
  loading: boolean;
  pedido: Pedido | null;
  erro: string | null;
  parsedCode: ParsedCode | null;
}

interface UsePedidoScannerOptions {
  debounceMs?: number;
  autoSearch?: boolean;
}

export const usePedidoScanner = (options: UsePedidoScannerOptions = {}) => {
  const { debounceMs = 500, autoSearch = true } = options;

  const [state, setState] = useState<UsePedidoScannerState>({
    loading: false,
    pedido: null,
    erro: null,
    parsedCode: null,
  });

  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortController = useRef<AbortController | undefined>(undefined);
  const lastSearchedCode = useRef<string>('');

  // Função para cancelar requisição atual
  const cancelCurrentRequest = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = undefined;
    }
  }, []);

  // Função para limpar debounce
  const clearDebounce = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = undefined;
    }
  }, []);

  // Função principal de busca
  const searchPedido = useCallback(async (codigo: string) => {
    if (!codigo || codigo === lastSearchedCode.current) {
      return;
    }

    lastSearchedCode.current = codigo;

    // Cancelar requisição anterior
    cancelCurrentRequest();

    // Criar novo AbortController
    abortController.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      erro: null,
      pedido: null,
    }));

    try {
      const parsedCode = ScannerParser.parseCode(codigo);

      setState(prev => ({
        ...prev,
        parsedCode,
      }));

      if (!parsedCode.valido) {
        setState(prev => ({
          ...prev,
          loading: false,
          erro: parsedCode.mensagem || 'Código inválido',
        }));
        return;
      }

      const response: PedidoResponse = await PedidosService.buscarPedidoPorCodigo(parsedCode.codigo);

      if (abortController.current?.signal.aborted) {
        return; // Requisição foi cancelada
      }

      if (response.encontrado && response.pedido) {
        setState(prev => ({
          ...prev,
          loading: false,
          pedido: response.pedido,
          erro: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          pedido: null,
          erro: response.mensagem || 'Pedido não encontrado',
        }));
      }
    } catch (error: any) {
      if (abortController.current?.signal.aborted) {
        return; // Requisição foi cancelada
      }

      let errorMessage = 'Erro desconhecido ao buscar pedido';

      if (error.name === 'AbortError') {
        return; // Ignorar erros de cancelamento
      }

      if (error.response) {
        // Erro da API
        switch (error.response.status) {
          case 401:
            errorMessage = 'Erro de autenticação. Token inválido.';
            break;
          case 404:
            errorMessage = 'Pedido não encontrado na base de dados.';
            break;
          case 429:
            errorMessage = 'Muitas requisições. Aguarde um momento.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente.';
            break;
          default:
            errorMessage = `Erro da API: ${error.response.status}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout da requisição. Verifique sua conexão.';
      } else if (!error.response) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        pedido: null,
        erro: errorMessage,
      }));
    }
  }, [cancelCurrentRequest]);

  // Função com debounce para busca automática
  const debouncedSearch = useCallback((codigo: string) => {
    clearDebounce();

    if (!codigo) {
      setState({
        loading: false,
        pedido: null,
        erro: null,
        parsedCode: null,
      });
      lastSearchedCode.current = '';
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchPedido(codigo);
    }, debounceMs);
  }, [debounceMs, searchPedido, clearDebounce]);

  // Função para busca manual (sem debounce)
  const manualSearch = useCallback((codigo: string) => {
    clearDebounce();
    searchPedido(codigo);
  }, [searchPedido, clearDebounce]);

  // Função para limpar estado
  const clearState = useCallback(() => {
    cancelCurrentRequest();
    clearDebounce();
    lastSearchedCode.current = '';
    setState({
      loading: false,
      pedido: null,
      erro: null,
      parsedCode: null,
    });
  }, [cancelCurrentRequest, clearDebounce]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      cancelCurrentRequest();
      clearDebounce();
    };
  }, [cancelCurrentRequest, clearDebounce]);

  return {
    ...state,
    searchPedido: autoSearch ? debouncedSearch : manualSearch,
    manualSearch,
    clearState,
    cancelCurrentRequest,
  };
};