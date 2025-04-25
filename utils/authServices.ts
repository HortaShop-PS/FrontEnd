import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking'

// --- Tipos (ajuste conforme seus DTOs) ---
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  // Adicione 'phone' se for parte do registro
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

// --- Configuração da API ---
const API_BASE_URL = Platform.select({
  // Use o IP da sua máquina local se estiver testando no Android físico/emulador
  // ou no iOS físico. 'localhost' geralmente funciona no simulador iOS.
  // Verifique seu .env em limbo/FrontEnd/.env
  android: process.env.EXPO_PUBLIC_API_BASE_URL, // Ex: 'http://192.168.1.10:3000'
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS, // Ex: 'http://localhost:3000'
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

const AUTH_TOKEN_KEY = 'authToken'; // Chave para armazenar o token

// --- Funções de Armazenamento Seguro ---
async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    console.log('Token salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar o token:', error);
  }
}

async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    // console.log('Token recuperado:', token ? 'Sim' : 'Não');
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

// --- Funções de API ---

/**
 * Realiza o login do usuário.
 * @param credentials Email e senha.
 * @returns A resposta da API com o token de acesso.
 */
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
    // Lança o erro para ser tratado na tela
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro de login' : 'Erro desconhecido');
  }
};

/**
 * Registra um novo usuário.
 * @param userData Dados do usuário para registro.
 * @returns Os dados do usuário criado (sem senha).
 */
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

/**
 * Busca o perfil do usuário autenticado.
 * Requer um token JWT válido.
 * @returns Os dados do perfil do usuário.
 */
export const getProfile = async (): Promise<UserProfile> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    console.log(`Buscando perfil em: ${API_BASE_URL}/auth/profile`);
    const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`, // Adiciona o token ao cabeçalho
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar perfil:', axios.isAxiosError(error) ? error.response?.data : error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token inválido ou expirado, força logout
      await logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao buscar perfil' : 'Erro desconhecido');
  }
};

/**
 * Realiza o logout do usuário (remove o token).
 */
export const logout = async (): Promise<void> => {
  await removeToken();
  // Aqui você pode adicionar lógica para limpar qualquer estado global, se necessário.
};

/**
 * Verifica se existe um token armazenado.
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token; // Retorna true se token não for null/undefined/vazio
};

// Exporta funções de gerenciamento de token se precisar usá-las diretamente
export const authUtils = {
  saveToken,
  getToken,
  removeToken,
};

/**
 * Processa a URL de callback recebida do fluxo OAuth.
 * Extrai o token JWT do parâmetro 'token'.
 * @param url A URL de callback (ex: 'hortashopapp://auth/callback?token=xyz')
 * @returns O token JWT extraído ou null se não encontrado.
 */
export const handleOAuthCallback = async (url: string): Promise<string | null> => {
    const { queryParams } = Linking.parse(url);
    const token = queryParams?.token as string | undefined;

    if (token) {
        console.log('Token recebido do callback OAuth:', token ? 'Sim' : 'Não');
        await saveToken(token);
        return token;
    } else {
        console.error('Nenhum token encontrado na URL de callback:', url);
        await removeToken(); // Garante limpeza se falhar
        return null;
    }
};
