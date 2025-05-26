import axios from 'axios';
import { getToken } from './authServices';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

export interface ProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  unit: string;
  imageUrl?: string;
  isOrganic: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  origin?: string;
  harvestSeason?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  unit: string;
  imageUrl?: string;
  isOrganic: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  origin?: string;
  harvestSeason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProductData extends Partial<ProductData> {}

// Registrar novo produto
export const registerProduct = async (productData: ProductData): Promise<ProductResponse> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Registrando produto em: ${API_BASE_URL}/producers/me/products`);
    const response = await axios.post<ProductResponse>(`${API_BASE_URL}/producers/me/products`, productData, {
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

// Buscar produtos do produtor
export const getProducerProducts = async (): Promise<ProductResponse[]> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Buscando produtos em: ${API_BASE_URL}/producers/me/products`);
    const response = await axios.get<ProductResponse[]>(`${API_BASE_URL}/producers/me/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao buscar produtos' : 'Erro desconhecido');
  }
};

// Buscar produto específico do produtor
export const getProducerProduct = async (productId: string): Promise<ProductResponse> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Buscando produto em: ${API_BASE_URL}/producers/me/products/${productId}`);
    const response = await axios.get<ProductResponse>(`${API_BASE_URL}/producers/me/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produto:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao buscar produto' : 'Erro desconhecido');
  }
};

// Atualizar produto
export const updateProduct = async (productId: string, productData: UpdateProductData): Promise<ProductResponse> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Atualizando produto em: ${API_BASE_URL}/producers/me/products/${productId}`);
    const response = await axios.put<ProductResponse>(`${API_BASE_URL}/producers/me/products/${productId}`, productData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar produto:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao atualizar produto' : 'Erro desconhecido');
  }
};

// Deletar produto
export const deleteProduct = async (productId: string): Promise<void> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Deletando produto em: ${API_BASE_URL}/producers/me/products/${productId}`);
    await axios.delete(`${API_BASE_URL}/producers/me/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao deletar produto' : 'Erro desconhecido');
  }
};

// Upload de imagem (mantendo a funcionalidade existente)
export const uploadProductImage = async (imageUri: string): Promise<string | null> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const formData = new FormData();
    const fileUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
    const filename = fileUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const file: any = {
      uri: fileUri,
      name: filename,
      type,
    };

    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Falha ao fazer upload da imagem');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw new Error('Não foi possível fazer upload da imagem');
  }
};