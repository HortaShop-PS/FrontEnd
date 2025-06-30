import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3000',
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS || 'http://localhost:3000',
  default: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
});

export interface DeliveryOrder {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  createdAt: string;
  items: DeliveryOrderItem[];
  deliveryFee: number;
  estimatedDeliveryTime?: string;
  specialInstructions?: string;
}

export interface DeliveryOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface DeliveryHistoryItem {
  id: string;
  orderId: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalPrice: number;
  deliveryFee: number;
  distance: number;
  completedAt: string;
  createdAt: string;
  items: DeliveryOrderItem[];
  specialInstructions?: string;
}

export interface DeliveryHistoryResponse {
  deliveries: DeliveryHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class DeliveryOrderService {

  // Métodos auxiliares para cálculos
  private calculateDeliveryFee(address: string): number {
    // Simular cálculo de taxa baseado no endereço
    // Em produção, isso viria do backend ou seria calculado por um serviço de mapas
    if (address.toLowerCase().includes('vila madalena') || address.toLowerCase().includes('consolação')) {
      return 8.50;
    } else if (address.toLowerCase().includes('paulista') || address.toLowerCase().includes('centro')) {
      return 12.50;
    } else {
      return 15.90;
    }
  }

  private calculateEstimatedTime(address: string): string {
    // Simular cálculo de tempo estimado baseado no endereço
    if (address.toLowerCase().includes('vila madalena') || address.toLowerCase().includes('consolação')) {
      return '20-35 min';
    } else if (address.toLowerCase().includes('paulista') || address.toLowerCase().includes('centro')) {
      return '30-45 min';
    } else {
      return '45-60 min';
    }
  }

  // Buscar pedidos disponíveis para entrega
  async getAvailableOrders(): Promise<DeliveryOrder[]> {
    try {
      // Obter token de autenticação
      const token = await SecureStore.getItemAsync('delivery_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer chamada real para a API
      const response = await fetch(`${API_BASE_URL}/delivery-orders/available`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error('Erro ao carregar pedidos disponíveis');
      }

      const data = await response.json();
      
      // Mapear dados do backend para o formato esperado pelo frontend
      const orders: DeliveryOrder[] = data.map((order: any) => ({
        id: order.id,
        trackingCode: order.trackingCode || `HRT${order.id.substring(0, 6).toUpperCase()}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        deliveryFee: this.calculateDeliveryFee(order.shippingAddress), // Simular taxa baseada no endereço
        estimatedDeliveryTime: this.calculateEstimatedTime(order.shippingAddress),
        specialInstructions: order.specialInstructions || '',
        items: order.items.map((item: any) => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      }));

      return orders;
    } catch (error) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      throw new Error('Não foi possível carregar os pedidos disponíveis');
    }
  }

  // Buscar pedidos aceitos pelo entregador
  async getMyOrders(): Promise<DeliveryOrder[]> {
    try {
      // Obter token de autenticação
      const token = await SecureStore.getItemAsync('delivery_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer chamada real para a API
      const response = await fetch(`${API_BASE_URL}/delivery-orders/me/accepted`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error('Erro ao carregar pedidos aceitos');
      }

      const data = await response.json();
      
      // Mapear dados do backend para o formato esperado pelo frontend
      const orders: DeliveryOrder[] = data.map((order: any) => ({
        id: order.id,
        trackingCode: order.trackingCode || `HRT${order.id.substring(0, 6).toUpperCase()}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        deliveryFee: this.calculateDeliveryFee(order.shippingAddress),
        estimatedDeliveryTime: this.calculateEstimatedTime(order.shippingAddress),
        specialInstructions: order.specialInstructions || '',
        items: order.items.map((item: any) => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      }));

      return orders;
    } catch (error) {
      console.error('Erro ao buscar meus pedidos:', error);
      throw new Error('Não foi possível carregar seus pedidos');
    }
  }

  // Aceitar um pedido para entrega
  async acceptOrder(orderId: string): Promise<boolean> {
    try {
      // Obter token de autenticação
      const token = await SecureStore.getItemAsync('delivery_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer chamada real para a API
      const response = await fetch(`${API_BASE_URL}/delivery-orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error('Erro ao aceitar pedido');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      throw new Error('Não foi possível aceitar o pedido');
    }
  }

  // Atualizar status do pedido
  async updateOrderStatus(orderId: string, status: DeliveryOrder['status']): Promise<boolean> {
    try {
      // Obter token de autenticação
      const token = await SecureStore.getItemAsync('delivery_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer chamada real para a API
      const response = await fetch(`${API_BASE_URL}/delivery-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error('Erro ao atualizar status do pedido');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw new Error('Não foi possível atualizar o status do pedido');
    }
  }

  // Buscar detalhes de um pedido específico
  async getOrderDetails(orderId: string): Promise<DeliveryOrder | null> {
    try {
      // Obter token de autenticação
      const token = await SecureStore.getItemAsync('delivery_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer chamada real para a API
      const response = await fetch(`${API_BASE_URL}/delivery-orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 404) {
          return null;
        }
        throw new Error('Erro ao carregar detalhes do pedido');
      }

      const order = await response.json();
      
      // Mapear dados do backend para o formato esperado pelo frontend
      return {
        id: order.id,
        trackingCode: order.trackingCode || `HRT${order.id.substring(0, 6).toUpperCase()}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        deliveryFee: this.calculateDeliveryFee(order.shippingAddress),
        estimatedDeliveryTime: this.calculateEstimatedTime(order.shippingAddress),
        specialInstructions: order.specialInstructions || '',
        items: order.items.map((item: any) => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      };
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      throw new Error('Não foi possível carregar os detalhes do pedido');
    }
  }

  // Buscar ganhos do entregador
  async getDeliveryEarnings(period: 'week' | 'month' | 'all' = 'week') {
    try {
      // Obter token de autenticação
      const token = await SecureStore.getItemAsync('delivery_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Fazer chamada real para a API
      const response = await fetch(`${API_BASE_URL}/delivery-orders/me/earnings?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error('Erro ao carregar ganhos');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar ganhos:', error);
      
      // Em caso de erro, retorna dados mockados como fallback
      console.log('Usando dados mockados como fallback');
      return this.getMockEarningsData(period);
    }
  }

  private getMockEarningsData(period: 'week' | 'month' | 'all') {
    // Simular dados de ganhos baseados no período
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const daily = [];
    let totalEarnings = 0;
    let totalDeliveries = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const deliveryCount = Math.floor(Math.random() * 6);
      const deliveries = [];
      let dayTotal = 0;

      for (let j = 0; j < deliveryCount; j++) {
        const deliveryFee = 8.5 + (Math.random() * 15);
        const delivery = {
          id: `delivery-${i}-${j}`,
          orderId: `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          customerName: ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'][j % 5],
          deliveryFee: Number(deliveryFee.toFixed(2)),
          distance: Number((1 + Math.random() * 15).toFixed(1)),
          completedAt: new Date(date.getTime() + j * 3600000).toISOString(),
          address: ['Rua das Flores, 123', 'Av. Central, 456', 'Rua Nova, 789', 'Praça da Paz, 321', 'Alameda Verde, 654'][j % 5],
        };
        deliveries.push(delivery);
        dayTotal += deliveryFee;
      }

      if (deliveryCount > 0) {
        daily.push({
          date: date.toISOString().split('T')[0],
          totalEarnings: Number(dayTotal.toFixed(2)),
          deliveryCount,
          deliveries: deliveries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
        });
      }

      totalEarnings += dayTotal;
      totalDeliveries += deliveryCount;
    }

    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthEarnings = daily
      .filter(day => new Date(day.date) >= currentMonthStart)
      .reduce((sum, day) => sum + day.totalEarnings, 0);

    const stats = {
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalDeliveries,
      averageEarningsPerDelivery: totalDeliveries > 0 ? Number((totalEarnings / totalDeliveries).toFixed(2)) : 0,
      currentMonthEarnings: Number(currentMonthEarnings.toFixed(2)),
    };

    return { daily: daily.reverse(), stats };
  }

  // Buscar histórico de entregas
  async getDeliveryHistory(page: number = 1, limit: number = 20): Promise<DeliveryHistoryResponse> {
    // Obter token de autenticação
    const token = await SecureStore.getItemAsync('delivery_token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    // Fazer chamada real para a API
    const response = await fetch(`${API_BASE_URL}/delivery-orders/me/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw new Error('Erro ao carregar histórico');
    }

    const data = await response.json();
    return data;
  }

  // Buscar ganhos de hoje
  async getTodaysEarnings(): Promise<number> {
    try {
      const earningsData = await this.getDeliveryEarnings('week');
      const today = new Date().toISOString().split('T')[0];
      const todayData = earningsData.daily.find((day: any) => day.date === today);
      return todayData?.totalEarnings || 0;
    } catch (error) {
      console.error('Erro ao buscar ganhos de hoje:', error);
      return 0;
    }
  }

  // Buscar entrega atual ativa
  async getCurrentActiveDelivery(): Promise<DeliveryOrder | null> {
    try {
      const myOrders = await this.getMyOrders();
      
      // Encontrar entrega ativa (não entregue nem cancelada)
      const activeDelivery = myOrders.find(order => 
        order.status !== 'delivered' && order.status !== 'canceled'
      );
      
      if (activeDelivery) {
        // Buscar detalhes completos da entrega
        return await this.getOrderDetails(activeDelivery.id);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar entrega ativa:', error);
      return null;
    }
  }
}

const deliveryOrderService = new DeliveryOrderService();
export default deliveryOrderService;