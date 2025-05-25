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
export interface Review {
  id: string;
  userId: number;
  userName: string;
  productId: string;
  productName: string;
  rating: number;
  comment?: string;
  producerId?: number;
  producerName?: string;
  producerRating?: number;
  producerComment?: string;
  orderRating?: number;
  orderComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviews {
  productId: string;
  productName: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  comment?: string;
  orderItemId?: string;
  producerId?: number;
  producerRating?: number;
  producerComment?: string;
  orderRating?: number;
  orderComment?: string;
}

// Função para obter o token de autenticação
const getAuthToken = async () => {
  const token = await SecureStore.getItemAsync('userToken');
  return token;
};

// Serviço de avaliações
const reviewService = {
  // Criar uma nova avaliação
  createReview: async (reviewData: CreateReviewData): Promise<Review> => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      throw error;
    }
  },

  // Obter avaliações de um produto
  getProductReviews: async (productId: string): Promise<ProductReviews> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reviews/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar avaliações do produto:', error);
      throw error;
    }
  },

  // Obter avaliações do usuário
  getUserReviews: async (): Promise<Review[]> => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/reviews/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar avaliações do usuário:', error);
      throw error;
    }
  },

  // Deletar uma avaliação
  deleteReview: async (reviewId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error);
      throw error;
    }
  }
};

export default reviewService;