import axios from 'axios';
import { getToken } from './authServices';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface TrackingResponse {
  currentStatus: string;
  timeline: any[];
  estimatedTime: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface UpdateTrackingData {
  latitude: number;
  longitude: number;
  status: string;
}

const trackingService = {
  getTracking: async (orderId: string): Promise<TrackingResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tracking/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tracking:', error);
      throw error;
    }
  },

  updateTracking: async (orderId: string, data: UpdateTrackingData): Promise<any> => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE_URL}/tracking/${orderId}/update`, 
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tracking:', error);
      throw error;
    }
  }
};

export default trackingService;