import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking'

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

interface AuthResponse {
  access_token: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL, // Ex: 'http://192.168.1.10:3000'
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS, // Ex: 'http://localhost:3000'
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

const AUTH_TOKEN_KEY = 'authToken';

async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    console.log('Token salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar o token:', error);
  }
}

 export async  function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Erro ao recuperar o token:', error);
    return null;
  }
}

async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    console.log('Token removido com sucesso.');
  } catch (error) {
    console.error('Erro ao remover o token:', error);
  }
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log(`Tentando login em: ${API_BASE_URL}/auth/login`);
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);

    if (response.data.access_token) {
      await saveToken(response.data.access_token);
    } else {
      throw new Error('Token não recebido na resposta de login.');
    }
    return response.data;
  } catch (error) {
    console.error('Erro no login:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro de login' : 'Erro desconhecido');
  }
};

export const register = async (userData: RegisterData): Promise<UserProfile> => {
  try {
    console.log(`Tentando registrar em: ${API_BASE_URL}/auth/register`);
    const response = await axios.post<UserProfile>(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Erro no registro:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro no registro' : 'Erro desconhecido');
  }
};

export const getProfile = async (): Promise<UserProfile> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Buscando perfil em: ${API_BASE_URL}/auth/profile`);
    const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil:', axios.isAxiosError(error) ? error.response?.data : error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao buscar perfil' : 'Erro desconhecido');
  }
};

export const logout = async (): Promise<void> => {
  await removeToken();
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

export const authUtils = {
  saveToken,
  getToken,
  removeToken,
};

export const handleOAuthCallback = async (url: string): Promise<string | null> => {
    const { queryParams } = Linking.parse(url);
    const token = queryParams?.token as string | undefined;

    if (token) {
        console.log('Token recebido do callback OAuth:', token ? 'Sim' : 'Não');
        await saveToken(token);
        return token;
    } else {
        console.error('Nenhum token encontrado na URL de callback:', url);
        await removeToken();
        return null;
    }
};

export const updateProfile = async (userId: number, userData: Partial<UserProfile>): Promise<UserProfile> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Atualizando perfil em: ${API_BASE_URL}/users/${userId}`);
    const response = await axios.patch<UserProfile>(`${API_BASE_URL}/users/${userId}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', axios.isAxiosError(error) ? error.response?.data : error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao atualizar perfil' : 'Erro desconhecido');
  }
};


export const updatePassword = async (userId: number, passwordData: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Atualizando senha em: ${API_BASE_URL}/users/${userId}/password`);
    const response = await axios.patch<{ message: string }>(`${API_BASE_URL}/users/${userId}/password`, passwordData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar senha:', axios.isAxiosError(error) ? error.response?.data : error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao atualizar senha' : 'Erro desconhecido');
  }
};
