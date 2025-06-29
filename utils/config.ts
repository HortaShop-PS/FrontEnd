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
}

export const apiConfig = ApiConfig.getInstance();

// Exports para compatibilidade
export const API_BASE_URL = apiConfig.BASE_URL;
export const GOOGLE_CLIENT_ID = apiConfig.GOOGLE_CLIENT_ID;