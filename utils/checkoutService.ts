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

// Interfaces para o checkout
export interface CheckoutItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CheckoutSummary {
  id: string;
  orderId: string;
  cartId: number;
  items: CheckoutItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface InitiateCheckoutData {
  cartId: number;
}

export interface CalculateTotalData {
  orderId: string;
  addressId: number;
  deliveryMethod: 'delivery' | 'pickup';
  couponCode?: string;
}

export interface UpdateAddressDeliveryData {
  orderId: string;
  addressId: number;
  deliveryMethod: 'delivery' | 'pickup';
}

export interface CalculateTotalResponse {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

// Função para obter headers de autenticação
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

// Serviço de checkout
export const checkoutService = {
  // Iniciar checkout
  initiateCheckout: async (data: InitiateCheckoutData): Promise<CheckoutSummary> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${resolvedApiBaseUrl}/checkout/initiate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao iniciar checkout');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      throw error;
    }
  },

  // Calcular total
  calculateTotal: async (data: CalculateTotalData): Promise<CalculateTotalResponse> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${resolvedApiBaseUrl}/checkout/calculate-total`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao calcular total');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao calcular total:', error);
      throw error;
    }
  },

  // Atualizar endereço e método de entrega
  updateAddressAndDelivery: async (data: UpdateAddressDeliveryData): Promise<CheckoutSummary> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${resolvedApiBaseUrl}/checkout/address-delivery`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar endereço e entrega');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao atualizar endereço e entrega:', error);
      throw error;
    }
  },

  // Buscar endereços do usuário (mock - você pode implementar no backend)
  getUserAddresses: async (): Promise<Address[]> => {
    try {
      // Mock de endereços - substitua pela chamada real da API quando implementada
      return [
        {
          id: 1,
          street: "Rua das Flores",
          number: "123",
          complement: "Apto 45",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
          isDefault: true
        },
        {
          id: 2,
          street: "Avenida Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          zipCode: "01310-100",
          isDefault: false
        }
      ];
    } catch (error: any) {
      console.error('Erro ao buscar endereços:', error);
      throw error;
    }
  }
};