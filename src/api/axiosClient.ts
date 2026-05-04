// src/api/axiosClient.ts

import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { Platform } from "react-native";
import { API_CONFIG } from "../config/apiConfig";

// Warn if token is missing
if (!API_CONFIG.TOKEN) {
  console.warn(
    "⚠️ WARNING: API_TOKEN is not configured. API requests may fail.",
  );
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT, // 30 segundos
  headers: {
    "Content-Type": "application/json",
    "User-Agent": `BeepVelozz/${Platform.OS}/${require("../../package.json").version}`,
  },
});

// Add Authorization header dynamically if token exists
axiosClient.interceptors.request.use(
  (config) => {
    // Add token to header if available
    if (API_CONFIG.TOKEN) {
      config.headers.Authorization = `Bearer ${API_CONFIG.TOKEN}`;
    }

    if (__DEV__) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        data: config.data,
        hasAuth: !!API_CONFIG.TOKEN,
      });
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error("❌ Request Error:", error);
    }
    return Promise.reject(error);
  },
);

// Interceptor de resposta para logs e tratamento de erros
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error("❌ Response Error:", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Tratamento específico de erros
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      console.error("🔐 Erro de autenticação - Token inválido");
    } else if (error.response?.status === 404) {
      // Pedido não encontrado
      console.warn("📦 Pedido não encontrado");
    } else if (error.response && error.response.status >= 500) {
      // Erro do servidor
      console.error("🖥️ Erro interno do servidor");
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      console.error("⏰ Timeout da requisição");
    } else if (!error.response) {
      // Erro de rede
      console.error("🌐 Erro de conexão de rede");
    }

    return Promise.reject(error);
  },
);

// Função para retry automático
export const retryRequest = async (
  fn: () => Promise<any>,
  retries: number = API_CONFIG.RETRY_ATTEMPTS,
  delay: number = 1000,
): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    const axiosError = error as AxiosError;
    if (retries > 0 && axiosError.code !== "ECONNABORTED") {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export default axiosClient;
