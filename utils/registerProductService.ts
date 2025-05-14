import axios from 'axios';
import { getToken } from './authServices';
import { Platform } from 'react-native';
import Config from 'react-native-config';

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});


export interface ProductData {
  nome: string;
  descricao: string;
  preco: number;
  categoriaId: number;
  estoque?: number;
  imagemUrl?: string;
}

export interface ProductResponse {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoriaId: number;
  estoque?: number;
  imagemUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const registerProduct = async (productData: ProductData): Promise<ProductResponse> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Registrando produto em: ${API_BASE_URL}/products`);
    const response = await axios.post<ProductResponse>(`${API_BASE_URL}/products`, productData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao registrar produto:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao registrar produto' : 'Erro desconhecido');
  }
};