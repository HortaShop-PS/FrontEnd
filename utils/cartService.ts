import { getToken } from './authServices';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    unit?: string;
  };
}

interface CartResponse {
  id: string;
  userId: number;
  items: CartItem[];
  total: number;
}

// Buscar o carrinho do usuário
export const getCart = async (): Promise<CartResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login para visualizar o carrinho.');
    }

    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { id: '', userId: 0, items: [], total: 0 }; // Carrinho vazio
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao buscar carrinho: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Erro ao carregar carrinho:', error);
    throw error;
  }
};

// Adicionar item ao carrinho
export const addToCart = async (productId: string, quantity: number): Promise<CartResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login para adicionar produtos ao carrinho.');
    }

    const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ao adicionar ao carrinho: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Erro ao adicionar ao carrinho:', error);
    throw error;
  }
};

// Atualizar quantidade de um item no carrinho
export const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<CartResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login para atualizar itens do carrinho.');
    }

    const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar quantidade');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Erro ao atualizar quantidade:', error);
    throw error;
  }
};

// Remover item do carrinho
export const removeCartItem = async (cartItemId: string): Promise<CartResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login para remover itens do carrinho.');
    }

    const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao remover item do carrinho');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Erro ao remover item:', error);
    throw error;
  }
};

// Limpar o carrinho
export const clearCart = async (): Promise<CartResponse> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Usuário não autenticado. Faça login para limpar o carrinho.');
    }

    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao limpar carrinho');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Erro ao limpar carrinho:', error);
    throw error;
  }
};