import { getToken } from './authServices';
import { API_BASE_URL } from './config';

interface ProfileStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

interface CompleteProfileData {
  cnpj: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  bankDetails: {
    bankName: string;
    agency: string;
    accountNumber: string;
  };
  businessDescription: string;
}

class ProducerProfileService {
  
  /**
   * Verifica o status do perfil do produtor no backend
   */
  async getProfileStatus(): Promise<ProfileStatus> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      console.log('Verificando status do perfil do produtor...');
      
      const response = await fetch(`${API_BASE_URL}/producers/profile-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor:', errorText);
        throw new Error(`Erro ao verificar status do perfil: ${response.status}`);
      }

      const profileStatus = await response.json();
      console.log('Status do perfil recebido:', profileStatus);
      
      return profileStatus;
    } catch (error) {
      console.error('Erro ao verificar status do perfil:', error);
      throw error;
    }
  }

  /**
   * Completa o perfil do produtor
   */
  async completeProfile(profileData: CompleteProfileData): Promise<void> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      console.log('Completando perfil do produtor...');
      
      const response = await fetch(`${API_BASE_URL}/producers/complete-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor:', errorText);
        
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      console.log('Perfil completado com sucesso');
    } catch (error) {
      console.error('Erro ao completar perfil:', error);
      throw error;
    }
  }
}

export default new ProducerProfileService();
export type { ProfileStatus, CompleteProfileData };