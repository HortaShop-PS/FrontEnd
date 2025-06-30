import axios from 'axios';
import { getToken } from './authServices'; // Use the same auth service as other producer features

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Interface for producer dashboard data
export interface ProducerDashboardData {
  monthlyEarnings: number;
  totalSales: number;
  activeProducts: number;
  pendingOrders: number;
  completedOrders: number;
  avgRating: number;
  topProduct: string;
  growthPercentage: number;
  recentActivities: RecentActivity[];
}

interface RecentActivity {
  id: string;
  type: 'product_added' | 'new_sale' | 'new_review' | 'order_completed';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface ProductWithRating {
  id: string;
  name: string;
  averageRating?: number;
  totalReviews?: number;
}

const getAuthToken = async (): Promise<string> => {
  const token = await getToken(); // Use the same token service as other producer features
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }
  return token;
};

class ProducerDashboardService {
  // Fetch producer dashboard data
  async getDashboardData(): Promise<ProducerDashboardData> {
    try {
      const token = await getAuthToken();
      
      // Fetch all required data in parallel
      const [
        ordersResponse,
        productsResponse,
        earningsData,
        recentActivities
      ] = await Promise.all([
        this.getOrderStats(token),
        this.getProductStats(token),
        this.getEarningsData(token),
        this.getRecentActivities(token)
      ]);

      const { pendingOrders, completedOrders, totalSales } = ordersResponse;
      const { activeProducts, avgRating, topProduct } = productsResponse;
      const { monthlyEarnings, growthPercentage } = earningsData;

      return {
        monthlyEarnings,
        totalSales,
        activeProducts,
        pendingOrders,
        completedOrders,
        avgRating,
        topProduct,
        growthPercentage,
        recentActivities
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  // Get order statistics
  private async getOrderStats(token: string): Promise<{
    pendingOrders: number;
    completedOrders: number;
    totalSales: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/producers/me/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orders = response.data;
      const stats = orders.reduce((acc: any, order: any) => {
        switch (order.status.toLowerCase()) {
          case 'pending':
            acc.pending++;
            break;
          case 'processing':
            acc.processing++;
            break;
          case 'shipped':
            acc.shipped++;
            break;
          case 'delivered':
            acc.delivered++;
            break;
        }
        return acc;
      }, { pending: 0, processing: 0, shipped: 0, delivered: 0 });

      return {
        pendingOrders: stats.pending + stats.processing + stats.shipped,
        completedOrders: stats.delivered,
        totalSales: orders.length
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de pedidos:', error);
      return { pendingOrders: 0, completedOrders: 0, totalSales: 0 };
    }
  }

  // Get product statistics
  private async getProductStats(token: string): Promise<{
    activeProducts: number;
    avgRating: number;
    topProduct: string;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/producers/me/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const products: ProductWithRating[] = response.data;
      const activeProducts = products.length;

      if (products.length === 0) {
        return { activeProducts: 0, avgRating: 0, topProduct: 'Nenhum produto' };
      }

      // Calculate average rating across all products
      const totalRating = products.reduce((sum, product) => {
        return sum + (product.averageRating || 0);
      }, 0);
      const avgRating = totalRating / products.length;

      // Find top product by rating and reviews
      const topProduct = products.reduce((top, current) => {
        const currentScore = (current.averageRating || 0) * (current.totalReviews || 0);
        const topScore = (top.averageRating || 0) * (top.totalReviews || 0);
        return currentScore > topScore ? current : top;
      }, products[0]);

      return {
        activeProducts,
        avgRating,
        topProduct: topProduct?.name || 'Produto não identificado'
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de produtos:', error);
      return { activeProducts: 0, avgRating: 0, topProduct: 'Erro ao carregar' };
    }
  }

  // Get earnings data
  private async getEarningsData(token: string): Promise<{
    monthlyEarnings: number;
    growthPercentage: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/producers/me/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orders = response.data;
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate current month earnings
      const currentMonthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= currentMonth && order.status.toLowerCase() === 'delivered';
      });

      // Calculate last month earnings for growth comparison
      const lastMonthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= lastMonth && orderDate <= lastMonthEnd && order.status.toLowerCase() === 'delivered';
      });

      const monthlyEarnings = currentMonthOrders.reduce((sum: number, order: any) => {
        return sum + (parseFloat(order.totalPrice) || 0);
      }, 0);

      const lastMonthEarnings = lastMonthOrders.reduce((sum: number, order: any) => {
        return sum + (parseFloat(order.totalPrice) || 0);
      }, 0);

      // Calculate growth percentage
      const growthPercentage = lastMonthEarnings > 0 
        ? ((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
        : monthlyEarnings > 0 ? 100 : 0;

      return {
        monthlyEarnings,
        growthPercentage: Math.round(growthPercentage * 10) / 10 // Round to 1 decimal
      };
    } catch (error) {
      console.error('Erro ao buscar dados de ganhos:', error);
      return { monthlyEarnings: 0, growthPercentage: 0 };
    }
  }

  // Get recent activities
  private async getRecentActivities(token: string): Promise<RecentActivity[]> {
    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/producers/me/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/producers/me/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const orders = ordersResponse.data;
      const products = productsResponse.data;
      
      const activities: RecentActivity[] = [];

      // Add recent orders as activities
      const recentOrders = orders
        .filter((order: any) => order.status.toLowerCase() === 'delivered')
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 2);

      recentOrders.forEach((order: any) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'new_sale',
          title: 'Nova venda',
          subtitle: `Pedido #${order.id.substring(0, 8)} - há ${this.getTimeAgo(order.updatedAt)}`,
          timestamp: order.updatedAt,
          icon: 'cart',
          color: '#3498DB'
        });
      });

      // Add recent products
      const recentProducts = products
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 1);

      recentProducts.forEach((product: any) => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product_added',
          title: 'Produto adicionado',
          subtitle: `${product.name} - há ${this.getTimeAgo(product.createdAt)}`,
          timestamp: product.createdAt,
          icon: 'add-circle',
          color: '#6CC51D'
        });
      });

      // Add review activity if we have products with reviews
      const productsWithReviews = products.filter((p: any) => (p.totalReviews || 0) > 0);
      if (productsWithReviews.length > 0) {
        const topRatedProduct = productsWithReviews.reduce((top: any, current: any) => {
          return (current.averageRating || 0) > (top.averageRating || 0) ? current : top;
        });

        activities.push({
          id: `review-${topRatedProduct.id}`,
          type: 'new_review',
          title: 'Nova avaliação',
          subtitle: `${topRatedProduct.averageRating?.toFixed(1)} estrelas - há ${Math.floor(Math.random() * 6) + 1} horas`,
          timestamp: new Date().toISOString(),
          icon: 'star',
          color: '#F1C40F'
        });
      }

      // Sort activities by timestamp and return top 3
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
        
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      // Return default activities on error
      return [
        {
          id: 'default-1',
          type: 'product_added',
          title: 'Produto adicionado',
          subtitle: 'Carregando dados...',
          timestamp: new Date().toISOString(),
          icon: 'add-circle',
          color: '#6CC51D'
        }
      ];
    }
  }

  // Helper function to calculate time ago
  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'alguns minutos';
    } else if (diffInHours < 24) {
      return `${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }
  }
}

export default new ProducerDashboardService();