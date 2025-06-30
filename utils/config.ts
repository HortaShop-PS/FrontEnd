import { Platform } from 'react-native';

class ApiConfig {
  private static instance: ApiConfig;
  
  public readonly BASE_URL: string;
  public readonly GOOGLE_CLIENT_ID: string;
  
  private constructor() {
    // API URL com Platform.select
    this.BASE_URL = Platform.select({
      android: process.env.EXPO_PUBLIC_API_BASE_URL,
      ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
      default: process.env.EXPO_PUBLIC_API_BASE_URL,
    }) || 'http://10.0.2.2:3000';
    
    // Google Client ID
    this.GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
    
    // Log para debug (apenas em desenvolvimento)
    if (__DEV__) {
      console.log('API Config:', {
        platform: Platform.OS,
        baseUrl: this.BASE_URL,
        hasGoogleClientId: !!this.GOOGLE_CLIENT_ID
      });
    }
  }
  
  public static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }
  
  // Método para obter URLs de endpoints
  public getEndpoint(path: string): string {
    return `${this.BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // ✅ NOVO: Método para testar conectividade
  public async testConnectivity(): Promise<{ isConnected: boolean; error?: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      console.log('🔍 Testando conectividade com:', this.BASE_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(`${this.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      console.log(`📡 Resposta recebida em ${responseTime}ms, status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Servidor respondeu:', data);
        return { 
          isConnected: true, 
          responseTime 
        };
      } else {
        console.log('❌ Servidor respondeu com erro:', response.status);
        return { 
          isConnected: false, 
          error: `HTTP ${response.status}`,
          responseTime 
        };
      }
    } catch (error: any) {
      console.error('❌ Erro de conectividade:', error);
      
      if (error.name === 'AbortError') {
        return { 
          isConnected: false, 
          error: 'Timeout - servidor não respondeu em 10 segundos' 
        };
      }
      
      return { 
        isConnected: false, 
        error: error.message || 'Erro de rede desconhecido' 
      };
    }
  }

  // ✅ NOVO: Método para testar upload endpoint especificamente
  public async testUploadEndpoint(): Promise<{ isAvailable: boolean; error?: string }> {
    try {
      console.log('🔍 Testando endpoint de upload...');
      
      const response = await fetch(`${this.BASE_URL}/upload/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Endpoint de upload disponível');
        return { isAvailable: true };
      } else {
        console.log('❌ Endpoint de upload não disponível:', response.status);
        return { 
          isAvailable: false, 
          error: `HTTP ${response.status}` 
        };
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar endpoint de upload:', error);
      return { 
        isAvailable: false, 
        error: error.message || 'Erro de rede' 
      };
    }
  }
}

export const apiConfig = ApiConfig.getInstance();

// Exports para compatibilidade
export const API_BASE_URL = apiConfig.BASE_URL;
export const GOOGLE_CLIENT_ID = apiConfig.GOOGLE_CLIENT_ID;