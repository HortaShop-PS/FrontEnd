import { Platform } from "react-native";
import Config from 'react-native-config';

export interface Product {
    id: string;
    name: string;
    price: number;
    unit: string;
    imageUrl: string;
    isNew: boolean;
    description?: string;
}

const getApiBaseUrl = () => {
    if (Platform.OS === 'android') {
        return process.env.EXPO_PUBLIC_API_BASE_URL;
    } else if (Platform.OS === 'ios') { 
        return process.env.EXPO_PUBLIC_API_BASE_URL_IOS || process.env.EXPO_PUBLIC_API_BASE_URL;
    }
    return process.env.EXPO_PUBLIC_API_BASE_URL;
};

export const fetchFeaturedProducts = async (): Promise<Product[]> => {
    const API_BASE_URL = getApiBaseUrl();
    try {
        const response = await fetch(`${API_BASE_URL}/products/featured`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server response: ${errorText}`);
            throw new Error(`Failed to fetch featured products: ${response.status}`);
        }

        const featuredProducts: Product[] = await response.json();
        return featuredProducts;
    } catch (error) {
        console.error('Error fetching featured products:', error);
        throw error;
    }
};

export const fetchAllProducts = async (): Promise<Product[]> => {
    const API_BASE_URL = getApiBaseUrl();
    try {
        const response = await fetch(`${API_BASE_URL}/products/all`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server response: ${errorText}`);
            throw new Error(`Failed to fetch all products: ${response.status}`);
        }

        const allProducts: Product[] = await response.json();
        return allProducts;
    } catch (error) {
        console.error('Error fetching all products:', error);
        throw error;
    }
};

export const searchProducts = async (params: {
    name?: string;
    category?: string; 
    minPrice?: number;
    maxPrice?: number;
    isOrganic?: boolean;
    limit?: number;
    
  }): Promise<Product[]> => {
    const API_BASE_URL = getApiBaseUrl();
    try {
      const queryParams = new URLSearchParams();
      if (params.name) queryParams.append('name', params.name);
      if (params.category) queryParams.append('category', params.category);
      if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.isOrganic !== undefined) queryParams.append('isOrganic', params.isOrganic.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/products/search${queryString ? `?${queryString}` : ''}`;
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao buscar produtos: ${response.status}`);
      }
  
      const products: Product[] = await response.json();
      return products;
    } catch (error) {
      throw error;
    }
  };
  
