import { Platform } from "react-native"

interface Product {
    id: String,
    name: String,
    price: Number,
    unit: String,
    imageUrl: String,
    isNew: Boolean,
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const getApiBaseUrl = () => {
    if (Platform.OS === 'android') {
        return process.env.EXPO_PUBLIC_API_BASE_URL;
    } else if (Platform.OS === 'ios') { 
        return process.env.EXPO_PUBLIC_API_BASE_URL_IOS;
    }
};
  
export const fetchFeaturedProducts = async (): Promise<Product[]> => {
    try {
        console.log(`Attempting to fetch from: ${API_BASE_URL}/products/featured`);
      
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
        console.log('Featured products fetched successfully:', featuredProducts);
        return featuredProducts;
    } catch (error) {
        console.error('Error fetching featured products:', error);
        throw error;
    }
};