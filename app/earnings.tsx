import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from '@expo-google-fonts/poppins';
import { showError } from '../utils/alertService';
import deliveryOrderService from '../utils/deliveryOrderService';

// Interface para ganhos diários
interface DailyEarnings {
  date: string;
  totalEarnings: number;
  deliveryCount: number;
  deliveries: DeliveryEarning[];
}

// Interface para uma entrega individual
interface DeliveryEarning {
  id: string;
  orderId: string;
  customerName: string;
  deliveryFee: number;
  distance: number;
  completedAt: string;
  address: string;
}

// Interface para estatísticas gerais
interface EarningsStats {
  totalEarnings: number;
  totalDeliveries: number;
  averageEarningsPerDelivery: number;
  currentMonthEarnings: number;
}

export default function EarningsScreen() {
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_500Medium,
  });

  // Mock data para demonstração - em produção, isso viria da API
  const generateMockEarnings = (): { daily: DailyEarnings[], stats: EarningsStats } => {
    const today = new Date();
    const dailyData: DailyEarnings[] = [];
    let totalEarnings = 0;
    let totalDeliveries = 0;

    // Gerar dados para os últimos 30 dias
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simular entregas aleatórias por dia (0-5 entregas)
      const deliveryCount = Math.floor(Math.random() * 6);
      const deliveries: DeliveryEarning[] = [];
      let dayTotal = 0;

      for (let j = 0; j < deliveryCount; j++) {
        const deliveryFee = 8.5 + (Math.random() * 15); // Taxa base + variação por distância
        const delivery: DeliveryEarning = {
          id: `delivery-${i}-${j}`,
          orderId: `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          customerName: ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima'][j % 5],
          deliveryFee: Number(deliveryFee.toFixed(2)),
          distance: Number((1 + Math.random() * 15).toFixed(1)),
          completedAt: new Date(date.getTime() + j * 3600000).toISOString(), // Espalhar ao longo do dia
          address: ['Rua das Flores, 123', 'Av. Central, 456', 'Rua Nova, 789', 'Praça da Paz, 321', 'Alameda Verde, 654'][j % 5],
        };
        deliveries.push(delivery);
        dayTotal += deliveryFee;
      }

      if (deliveryCount > 0) {
        dailyData.push({
          date: date.toISOString().split('T')[0],
          totalEarnings: Number(dayTotal.toFixed(2)),
          deliveryCount,
          deliveries: deliveries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
        });
      }

      totalEarnings += dayTotal;
      totalDeliveries += deliveryCount;
    }

    // Calcular estatísticas
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEarnings = dailyData
      .filter(day => new Date(day.date) >= currentMonthStart)
      .reduce((sum, day) => sum + day.totalEarnings, 0);

    const stats: EarningsStats = {
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalDeliveries,
      averageEarningsPerDelivery: totalDeliveries > 0 ? Number((totalEarnings / totalDeliveries).toFixed(2)) : 0,
      currentMonthEarnings: Number(currentMonthEarnings.toFixed(2)),
    };

    return { daily: dailyData.reverse(), stats };
  };  const loadEarnings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Usar o service para buscar ganhos
      const data = await deliveryOrderService.getDeliveryEarnings(selectedPeriod);
      
      setDailyEarnings(data.daily);
      setStats(data.stats);
    } catch (error) {
      console.error('Erro ao carregar ganhos:', error);
      showError('Erro', 'Não foi possível carregar os ganhos. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEarnings();
    }, [selectedPeriod])
  );

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodButtonStyle = (period: 'week' | 'month' | 'all') => {
    return [
      styles.periodButton,
      selectedPeriod === period && styles.periodButtonActive
    ];
  };

  const getPeriodTextStyle = (period: 'week' | 'month' | 'all') => {
    return [
      styles.periodButtonText,
      selectedPeriod === period && styles.periodButtonTextActive
    ];
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
          <Text style={styles.loadingText}>Carregando ganhos...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEarnings(true)}
            colors={['#6CC51D']}
            tintColor="#6CC51D"
          />
        }
      >
        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
                <Text style={styles.statLabel}>Total de Ganhos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
                <Text style={styles.statLabel}>Total de Entregas</Text>
              </View>
            </View>
            
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.averageEarningsPerDelivery)}</Text>
                <Text style={styles.statLabel}>Média por Entrega</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.currentMonthEarnings)}</Text>
                <Text style={styles.statLabel}>Mês Atual</Text>
              </View>
            </View>
          </View>
        )}

        {/* Period Filter */}
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={getPeriodButtonStyle('week')}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={getPeriodTextStyle('week')}>7 dias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getPeriodButtonStyle('month')}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={getPeriodTextStyle('month')}>30 dias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={getPeriodButtonStyle('all')}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={getPeriodTextStyle('all')}>Tudo</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Earnings List */}
        <View style={styles.earningsContainer}>
          <Text style={styles.sectionTitle}>Ganhos por Dia</Text>
          
          {dailyEarnings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>Nenhum ganho encontrado</Text>
              <Text style={styles.emptyMessage}>
                Você ainda não possui ganhos no período selecionado.
              </Text>
            </View>
          ) : (
            dailyEarnings.map((day, index) => (
              <View key={day.date} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                  <View style={styles.dayStats}>
                    <Text style={styles.dayEarnings}>{formatCurrency(day.totalEarnings)}</Text>
                    <Text style={styles.dayCount}>{day.deliveryCount} entrega{day.deliveryCount !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                
                {day.deliveries.map((delivery, deliveryIndex) => (
                  <View key={delivery.id} style={styles.deliveryItem}>
                    <View style={styles.deliveryHeader}>
                      <View style={styles.deliveryInfo}>
                        <Text style={styles.deliveryOrderId}>#{delivery.orderId}</Text>
                        <Text style={styles.deliveryTime}>{formatTime(delivery.completedAt)}</Text>
                      </View>
                      <Text style={styles.deliveryFee}>{formatCurrency(delivery.deliveryFee)}</Text>
                    </View>
                    
                    <Text style={styles.deliveryCustomer}>{delivery.customerName}</Text>
                    <Text style={styles.deliveryAddress}>{delivery.address}</Text>
                    <Text style={styles.deliveryDistance}>{delivery.distance} km</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  periodButtonActive: {
    backgroundColor: '#6CC51D',
    borderColor: '#6CC51D',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#7F8C8D',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  earningsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  dayDate: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  dayStats: {
    alignItems: 'flex-end',
  },
  dayEarnings: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  dayCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginTop: 2,
  },
  deliveryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryOrderId: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginRight: 12,
  },
  deliveryTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  deliveryFee: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  deliveryCustomer: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#2C3E50',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  deliveryDistance: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
});
