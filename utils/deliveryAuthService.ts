import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3000',
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS || 'http://localhost:3000',
  default: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
});

export interface DeliveryMan {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnhNumber: string;
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDeliveryData {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  cnhNumber: string;
}

export interface LoginDeliveryData {
  email: string;
  password: string;
}

export interface UpdateDeliveryProfileData {
  name?: string;
  email?: string;
  phone?: string;
  isAvailable?: boolean;
}

export interface UpdateVehicleData {
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
}

export interface LoginResponse {
  token: string;
  user: DeliveryMan;
}

class DeliveryAuthService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('delivery_token');
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  private async setAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('delivery_token', token);
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  private async removeAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('delivery_token');
    } catch (error) {
      console.error('Erro ao remover token:', error);
    }
  }

  async register(data: RegisterDeliveryData): Promise<DeliveryMan> {
    try {
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Tentando registrar entregador em:', `${API_BASE_URL}/delivery-auth/register`);
      console.log('Dados enviados:', data);

      const response = await fetch(`${API_BASE_URL}/delivery-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error data:', errorData);
        throw new Error(errorData.message || 'Erro ao cadastrar entregador');
      }

      const result = await response.json();
      console.log('Registro bem-sucedido:', result);
      return result;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  async login(data: LoginDeliveryData): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer login');
      }

      const loginResponse: LoginResponse = await response.json();
      await this.setAuthToken(loginResponse.token);
      
      return loginResponse;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async getProfile(): Promise<DeliveryMan> {
    try {
      const token = await this.getAuthToken();
      console.log('Token encontrado:', token ? 'Sim' : 'Não');
      
      if (!token) {
        throw new Error('Token não encontrado');
      }

      console.log('Fazendo requisição para:', `${API_BASE_URL}/delivery-auth/profile`);
      console.log('Com token:', token.substring(0, 20) + '...');

      const response = await fetch(`${API_BASE_URL}/delivery-auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status da resposta:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Erro da resposta:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Erro ao obter perfil');
        } catch (parseError) {
          throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Erro ao obter perfil'}`);
        }
      }

      const profileData = await response.json();
      console.log('Perfil obtido com sucesso:', profileData);
      return profileData;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  }

  async updateProfile(data: UpdateDeliveryProfileData): Promise<DeliveryMan> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/delivery-auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar perfil');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  async updateVehicle(data: UpdateVehicleData): Promise<DeliveryMan> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/delivery-auth/vehicle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar dados do veículo');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar dados do veículo:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.removeAuthToken();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('Nenhum token encontrado, usuário não autenticado');
        return false;
      }
      
      // Valida o token com o backend fazendo uma requisição para o perfil
      try {
        await this.getProfile();
        return true;
      } catch (error) {
        console.log('Token inválido ou expirado');
        await this.removeAuthToken();
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }
}

export default new DeliveryAuthService();