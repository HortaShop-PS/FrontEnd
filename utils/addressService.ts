import { Platform } from 'react-native';
import { getToken } from './authServices';

const resolvedApiBaseUrl = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

if (!resolvedApiBaseUrl) {
  console.error("API_BASE_URL não está definida. Verifique sua configuração .env");
}

export interface Address {
  id: number;
  userId?: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

export interface ValidateAddressData {
  address: string;
}

export interface ValidateAddressResponse {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  suggestions?: string[];
}

export interface AutocompleteResult {
  description: string;
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Função para obter headers de autenticação
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Função para obter o ID do usuário do token
const getUserIdFromToken = async (): Promise<number> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }

    // Decodificar o token JWT para obter o user ID
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.id;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    throw new Error('Erro ao obter ID do usuário');
  }
};

const addressService = {
  // Buscar endereços do usuário
  async getUserAddresses(): Promise<Address[]> {
    try {
      const headers = await getAuthHeaders();
      const userId = await getUserIdFromToken();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/user/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao buscar endereços do usuário');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao buscar endereços do usuário:', error);
      throw error;
    }
  },

  // Criar novo endereço
  async createAddress(addressData: CreateAddressData): Promise<Address> {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao criar endereço');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao criar endereço:', error);
      throw error;
    }
  },

  // Atualizar endereço
  async updateAddress(addressId: number, addressData: UpdateAddressData): Promise<Address> {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/${addressId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao atualizar endereço');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao atualizar endereço:', error);
      throw error;
    }
  },

  // Deletar endereço
  async deleteAddress(addressId: number): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/${addressId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao deletar endereço');
      }
    } catch (error: any) {
      console.error('Erro ao deletar endereço:', error);
      throw error;
    }
  },

  // Buscar endereço por ID
  async getAddressById(addressId: number): Promise<Address> {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/${addressId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao buscar endereço');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao buscar endereço:', error);
      throw error;
    }
  },

  // Validar endereço
  async validateAddress(addressData: ValidateAddressData): Promise<ValidateAddressResponse> {
    try {
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao validar endereço');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao validar endereço:', error);
      throw error;
    }
  },

  // Autocomplete de endereços
  async autocompleteAddress(input: string): Promise<AutocompleteResult[]> {
    try {
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/autocomplete?input=${encodeURIComponent(input)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao buscar sugestões de endereços');
      }

      const result = await response.json();
      
      // Converter o resultado do backend para o formato esperado pelo frontend
      if (Array.isArray(result)) {
        return result.map((item: any) => ({
          description: item.description || item.display_name || item.formattedAddress,
          placeId: item.placeId || item.place_id || String(item.id || Math.random()),
          coordinates: item.coordinates || {
            lat: item.lat || item.latitude,
            lng: item.lng || item.longitude
          }
        }));
      }

      return [];
    } catch (error: any) {
      console.error('Erro ao buscar sugestões de endereços:', error);
      throw error;
    }
  },

  // Definir endereço como padrão
  async setDefaultAddress(addressId: number): Promise<Address> {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${resolvedApiBaseUrl}/addresses/${addressId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Erro ao definir endereço como padrão');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao definir endereço como padrão:', error);
      throw error;
    }
  },
};

export default addressService;