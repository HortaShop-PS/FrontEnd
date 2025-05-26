import * as SecureStore from 'expo-secure-store';
import { getToken } from './authServices';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export const checkIsFavorite = async (productId: string): Promise<boolean> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    const response = await fetch(`${API_BASE_URL}/favorites/${productId}/check`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar favorito: ${response.status}`);
    }

    const data = await response.json();
    return data.isFavorite;
  } catch (error) {
    console.error('Erro ao verificar se produto é favorito:', error);
    return false;
  }
};


export const addToFavorites = async (productId: string): Promise<boolean> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao adicionar favorito: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao adicionar produto aos favoritos:', error);
    throw error; // Propagar o erro para tratamento na tela
  }
};


export const removeFromFavorites = async (productId: string): Promise<boolean> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao remover favorito: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao remover produto dos favoritos:', error);
    return false;
  }
};


export const getUserFavorites = async () => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar favoritos: ${response.status}`);
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Erro ao buscar produtos favoritos:', error);
    return { products: [] }; 
  }
};