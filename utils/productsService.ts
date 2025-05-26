import axios from 'axios';
import { getToken, getProfile } from './authServices';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string;
  isNew: boolean;
  category?: string;
  isOrganic: boolean;
}

const handleApiError = (error: unknown, context: string) => {
  if (axios.isAxiosError(error)) {
    console.error(`Erro na API (${context}):`, {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    throw new Error(error.response?.data?.message || `Falha na requisição ${context}`);
  }
  throw new Error(`Erro desconhecido: ${context}`);
};

export const getProducerProducts = async (): Promise<Product[]> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    // Obter o perfil do usuário para pegar o ID do produtor
    const userProfile = await getProfile();
    if (!userProfile || !userProfile.id) {
      throw new Error('ID do produtor não encontrado');
    }
    
    // Usar o ID do usuário em vez do UUID
    const producerId = userProfile.id;
    
    // Construir a URL com o ID do produtor
    const url = `${API_BASE_URL}/products/producer/${producerId}`;
    
    console.log('Requisição para:', url);
    const response = await axios.get<Product[]>(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.map(p => ({
      ...p,
      price: Number(p.price)
    }));
  } catch (error) {
    return handleApiError(error, 'buscar produtos do produtor');
  }
};

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(`${API_BASE_URL}/products/all`);
    return response.data.map(p => ({
      ...p,
      price: Number(p.price)
    }));
  } catch (error) {
    return handleApiError(error, 'buscar todos os produtos');
  }
};