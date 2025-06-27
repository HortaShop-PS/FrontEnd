import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_500Medium } from '@expo-google-fonts/poppins';
import OrderTimeline from './OrderTimeline';
import LiveMap from './LiveMap';
import trackingService from '../utils/trackingService';
import websocketService from '../utils/websocketService';

interface TrackingData {
  currentStatus: string;
  timeline: any[];
  estimatedTime: string;
  location?: { latitude: number; longitude: number };
}

interface RealTimeTrackerProps {
  orderId: string;
}

export default function RealTimeTracker({ orderId }: RealTimeTrackerProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
  });

  const fetchTracking = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await trackingService.getTracking(orderId);
      setTracking(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tracking:', err);
      setError('Erro ao carregar informações de rastreamento');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!orderId) return;
    
    fetchTracking();

    // Conectar WebSocket para atualizações em tempo real
    const socket = websocketService.connect(orderId, (data) => {
      console.log('Atualização recebida via WebSocket:', data);
      setTracking(data);
    });

    return () => {
      socket?.disconnect();
    };
  }, [orderId]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
        <Text style={styles.loadingText}>Carregando rastreamento...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!tracking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Nenhuma informação de rastreamento encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchTracking(true)}
          colors={['#6CC51D']}
        />
      }
    >
      {/* Status Atual */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status Atual</Text>
        <Text style={styles.currentStatus}>{tracking.currentStatus.toUpperCase()}</Text>
        <Text style={styles.estimatedTime}>{tracking.estimatedTime}</Text>
      </View>

      {/* Timeline do Pedido */}
      <View style={styles.timelineCard}>
        <Text style={styles.cardTitle}>Histórico do Pedido</Text>
        <OrderTimeline 
          timeline={tracking.timeline} 
          currentStatus={tracking.currentStatus} 
        />
      </View>

      {/* Mapa de Localização */}
      <View style={styles.mapCard}>
        <Text style={styles.cardTitle}>Localização</Text>
        <LiveMap location={tracking.location} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  currentStatus: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#2C3E50',
    marginBottom: 8,
  },
  estimatedTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6CC51D',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 16,
  },
});