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

// Função para processar pagamento via PIX
export async function processPixPayment(paymentData: ProcessPixPaymentDto) {
  const token = await getToken();
  const response = await fetch(`${resolvedApiBaseUrl}/payments/pix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    throw new Error('Erro ao processar pagamento PIX');
  }

  return response.json();
}

// Função para processar pagamento via cartão
export async function processCardPayment(paymentData: ProcessCardPaymentDto) {
  const token = await getToken();
  const response = await fetch(`${resolvedApiBaseUrl}/payments/card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    throw new Error('Erro ao processar pagamento com cartão');
  }

  return response.json();
}

// Função para atualizar status do pagamento
export async function updatePaymentStatus(statusData: UpdatePaymentStatusDto) {
  const token = await getToken();
  const response = await fetch(`${resolvedApiBaseUrl}/payments/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(statusData),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar status do pagamento');
  }

  return response.json();
}