import { Platform } from 'react-native';
import { apiConfig } from './config';

// Interfaces para Google Maps Places API
export interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  name?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface GeocodeResult {
  isValid: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  formattedAddress?: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  suggestions?: string[];
}

class GoogleMapsService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = apiConfig.BASE_URL;
  }

  /**
   * Busca sugestões de endereços usando o backend
   */
  async autocompleteAddress(input: string): Promise<PlaceAutocompleteResult[]> {
    if (!input || input.trim().length < 3) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/addresses/autocomplete?input=${encodeURIComponent(input.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Mapear resposta do backend para formato esperado
      return data.map((item: any) => ({
        place_id: item.place_id || '',
        description: item.display_name || '',
        main_text: item.main_text || '',
        secondary_text: item.secondary_text || '',
        structured_formatting: {
          main_text: item.main_text || '',
          secondary_text: item.secondary_text || '',
        },
      }));
    } catch (error) {
      console.error('Erro ao buscar sugestões de endereços:', error);
      return [];
    }
  }

  /**
   * Valida um endereço usando o backend
   */
  async validateAddress(address: string): Promise<AddressValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/addresses/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        isValid: data.isValid || false,
        formattedAddress: data.formattedAddress,
        coordinates: data.coordinates,
        suggestions: data.suggestions,
      };
    } catch (error) {
      console.error('Erro ao validar endereço:', error);
      return {
        isValid: false,
      };
    }
  }

  /**
   * Geocodifica um endereço (obtém coordenadas)
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const validation = await this.validateAddress(address);
      return {
        isValid: validation.isValid,
        coordinates: validation.coordinates,
        formattedAddress: validation.formattedAddress,
      };
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      return {
        isValid: false,
      };
    }
  }

  /**
   * Geocodificação reversa (obtém endereço a partir de coordenadas)
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    try {
      // Implementar se necessário no backend
      return {
        isValid: false,
      };
    } catch (error) {
      console.error('Erro na geocodificação reversa:', error);
      return {
        isValid: false,
      };
    }
  }

  /**
   * Formatar endereço para exibição
   */
  formatAddressForDisplay(address: any): string {
    const parts = [];
    
    if (address.street && address.number) {
      parts.push(`${address.street}, ${address.number}`);
    }
    
    if (address.complement) {
      parts.push(address.complement);
    }
    
    if (address.neighborhood) {
      parts.push(address.neighborhood);
    }
    
    if (address.city && address.state) {
      parts.push(`${address.city} - ${address.state}`);
    }
    
    if (address.zipCode) {
      parts.push(`CEP: ${address.zipCode}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Extrair componentes do endereço a partir da descrição
   */
  parseAddressFromDescription(description: string): any {
    // Implementação básica - pode ser melhorada conforme necessidade
    const parts = description.split(',').map(part => part.trim());
    
    return {
      street: parts[0] || '',
      neighborhood: parts[1] || '',
      city: parts[2]?.split(' - ')[0] || '',
      state: parts[2]?.split(' - ')[1] || '',
      country: 'Brasil',
    };
  }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;