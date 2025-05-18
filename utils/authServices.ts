import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  userType: string;
  user: UserProfile;
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
  producerUuid?: string; 
}

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

const AUTH_TOKEN_KEY = 'userToken';

async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    console.log('Token salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar o token:', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    // Usando a chave consistente para armazenamento do token
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Erro ao recuperar o token:', error);
    return null;
  }
}

export const login = async (credentials: LoginData): Promise<UserProfile> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, credentials);
    
    // Armazenamento inconsistente entre token e userType
    await SecureStore.setItemAsync('userToken', response.data.access_token);
    await SecureStore.setItemAsync('userType', response.data.userType || 'consumer');
    
    // Adicionar verificação de armazenamento
    const storedUserType = await SecureStore.getItemAsync('userType');
    if (!storedUserType) {
      throw new Error('Falha ao armazenar tipo de usuário');
    }
    
    return response.data.user;
  } catch (error) {
    console.error('Erro ao fazer login:', axios.isAxiosError(error) ? error.response?.data : error);
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Credenciais inválidas' : 'Erro desconhecido');
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
    console.error('Token não encontrado no armazenamento seguro');
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Buscando perfil em: ${API_BASE_URL}/auth/profile com token: ${token.substring(0, 10)}...`);
    const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Perfil recebido:', JSON.stringify(response.data));
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

// Remover a duplicação da função logout
export const logout = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userType');
    console.log('Logout realizado com sucesso');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
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

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    console.log('Token removido com sucesso.');
  } catch (error) {
    console.error('Erro ao remover o token:', error);
  }
}
