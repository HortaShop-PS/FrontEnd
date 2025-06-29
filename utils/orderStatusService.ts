import axios from 'axios';
import { getToken } from './authServices';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface OrderStatusHistory {
  id: string;
  status: string;
  previousStatus: string;
  notes?: string;
  updatedBy: string;
  createdAt: string;
}

export interface UpdateStatusData {
  status: string; // ← Deve ser: 'pending', 'processing', 'shipped', 'delivered', 'canceled'
  notes?: string;
}

export interface NotifyReadyData {
  message?: string; // ← CORRIGIDO: deve ser 'message', não 'notes'
}

export const orderStatusService = {
  updateOrderStatus: async (orderId: string, statusData: UpdateStatusData): Promise<any> => {
    try {
      const token = await getToken();
      
      console.log('Enviando atualização de status:', {
        orderId,
        status: statusData.status,
        notes: statusData.notes
      });
      
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
      console.error('Erro ao atualizar status:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Dados inválidos para atualização do status');
        }
        if (error.response?.status === 404) {
          throw new Error('Pedido não encontrado');
        }
        if (error.response?.status === 403) {
          throw new Error('Você não tem permissão para atualizar este pedido');
        }
      }
      throw error;
    }
  },

  getStatusHistory: async (orderId: string): Promise<OrderStatusHistory[]> => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${API_BASE_URL}/producers/me/orders/${orderId}/status-history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  },

  notifyReadyForPickup: async (orderId: string, notifyData: NotifyReadyData): Promise<any> => {
    try {
      const token = await getToken();
      
      console.log('Enviando notificação de pronto para coleta:', {
        orderId,
        message: notifyData.message
      });
      
      const response = await axios.post(
        `${API_BASE_URL}/producers/me/orders/${orderId}/notify-ready`,
        notifyData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao notificar coleta:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Dados inválidos para notificação');
        }
        if (error.response?.status === 404) {
          throw new Error('Pedido não encontrado');
        }
        if (error.response?.status === 403) {
          throw new Error('Você não tem permissão para notificar este pedido');
        }
      }
      throw error;
    }
  }
};

export default orderStatusService;