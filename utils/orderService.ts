import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Definição da URL da API seguindo o padrão do projeto
const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

// Interfaces para os tipos de dados
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  producerId: number;
  producerName: string;
  notes?: string;
  reviewed?: boolean;
}

export interface OrderSummary {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  items?: OrderItem[];
  readyForPickup?: boolean; // ← ADICIONAR ESTA PROPRIEDADE
}

export interface OrderDetail {
  id: string;
  userId: number;
  status: string;
  totalPrice: number;
  shippingAddress: string;
  paymentMethod: string;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// Função para obter o token de autenticação
const getAuthToken = async () => {
  // Alterando para usar SecureStore em vez de AsyncStorage para manter consistência com o resto do projeto
  const token = await SecureStore.getItemAsync('userToken');
  return token;
};

// Serviço de pedidos
const orderService = {
  // Obter pedidos do cliente
  getMyOrders: async (): Promise<OrderSummary[]> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/orders/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  },

  // Obter pedidos do produtor
  getProducerOrders: async (): Promise<OrderSummary[]> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/producers/me/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pedidos do produtor:', error);
      throw error;
    }
  },

  // Obter detalhes de um pedido específico (para clientes)
  getOrderDetails: async (orderId: string): Promise<OrderDetail> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do pedido ${orderId}:`, error);
      throw error;
    }
  },

  // Obter detalhes de um pedido específico (para produtores)
  getProducerOrderDetails: async (orderId: string): Promise<OrderDetail> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/producers/me/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do pedido do produtor ${orderId}:`, error);
      throw error;
    }
  },

  // Atualizar status do pedido (para produtores)
  updateOrderStatus: async (orderId: string, statusData: { status: string; notes?: string }): Promise<any> => {
    try {
      const token = await getAuthToken();
      const response = await axios.put(
        `${API_BASE_URL}/producers/me/orders/${orderId}/status`,
        statusData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${orderId}:`, error);
      throw error;
    }
  }
};

export default orderService;
