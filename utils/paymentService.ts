import { Platform } from 'react-native';
import { getToken } from './authServices';

let API_BASE_URL_FROM_ENV: string | undefined;
try {
  const env = require('@env');
  API_BASE_URL_FROM_ENV = env.API_BASE_URL;
} catch (e) {
  console.warn("Falha ao carregar API_BASE_URL de @env. Usando process.env.");
}

const resolvedApiBaseUrl = API_BASE_URL_FROM_ENV || Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

if (!resolvedApiBaseUrl) {
  console.error("API_BASE_URL não está definida. Verifique sua configuração .env");
}

const PAYMENTS_API_PATH = '/payments';

// Interfaces para PIX
export interface ProcessPixPaymentDto {
  orderId: number;
  amount: number;
}

export interface PixPaymentResponseDto {
  qrCodeUrl: string;
  copyPasteCode: string;
  expiresAt: Date;
}

// Interfaces para Cartão
export interface ProcessCardPaymentDto {
  orderId: number;
  amount: number;
  cardDetails: {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
  };
}

export interface CardPaymentResponseDto {
  status: string;
  transactionId: string;
}

// Interface para atualização de status
export interface UpdatePaymentStatusDto {
  paymentId: string;
  status: string;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const paymentService = {
  async processPixPayment(payload: ProcessPixPaymentDto): Promise<PixPaymentResponseDto> {
    const headers = await getAuthHeaders();
    if (!headers.Authorization && resolvedApiBaseUrl) {
      console.warn("Tentando processar pagamento PIX sem token de autorização.");
    }

    const response = await fetch(`${resolvedApiBaseUrl}${PAYMENTS_API_PATH}/pix`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      console.error("Erro ao processar pagamento PIX:", errorData);
      throw new Error(errorData.message || 'Falha ao processar pagamento PIX');
    }

    const data = await response.json();
    // Converter a string de data para Date object
    return {
      ...data,
      expiresAt: new Date(data.expiresAt),
    };
  },

  async processCardPayment(payload: ProcessCardPaymentDto): Promise<CardPaymentResponseDto> {
    const headers = await getAuthHeaders();
    if (!headers.Authorization && resolvedApiBaseUrl) {
      console.warn("Tentando processar pagamento com cartão sem token de autorização.");
    }

    const response = await fetch(`${resolvedApiBaseUrl}${PAYMENTS_API_PATH}/card`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      console.error("Erro ao processar pagamento com cartão:", errorData);
      throw new Error(errorData.message || 'Falha ao processar pagamento com cartão');
    }

    return response.json();
  },

  async updatePaymentStatus(payload: UpdatePaymentStatusDto): Promise<{ message: string; status: string }> {
    const headers = await getAuthHeaders();
    if (!headers.Authorization && resolvedApiBaseUrl) {
      console.warn("Tentando atualizar status do pagamento sem token de autorização.");
    }

    const response = await fetch(`${resolvedApiBaseUrl}${PAYMENTS_API_PATH}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      console.error("Erro ao atualizar status do pagamento:", errorData);
      throw new Error(errorData.message || 'Falha ao atualizar status do pagamento');
    }

    return response.json();
  },
};