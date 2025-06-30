import { Platform } from 'react-native';
import { getToken } from './authServices';

const resolvedApiBaseUrl = Platform.select({
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

// Função para obter o ID do usuário do token
const getUserIdFromToken = async (): Promise<number> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }

    // Decodificar o token JWT para obter o user ID
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.id;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    throw new Error('Erro ao obter ID do usuário');
  }
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

  // Buscar endereços do usuário (integrado com o backend)
  getUserAddresses: async (): Promise<Address[]> => {
    try {
      const headers = await getAuthHeaders();
      const userId = await getUserIdFromToken();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/user/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao buscar endereços do usuário');
      }

      const addresses = await response.json();
      return addresses;
    } catch (error: any) {
      console.error('Erro ao buscar endereços:', error);
      throw error;
    }
  }
};