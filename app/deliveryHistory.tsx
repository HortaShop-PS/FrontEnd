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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from '@expo-google-fonts/poppins';
import { showError } from '../utils/alertService';
import deliveryOrderService, { DeliveryHistoryItem, DeliveryHistoryResponse } from '../utils/deliveryOrderService';

export default function DeliveryHistoryScreen() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_500Medium,
  });

  const loadHistory = async (page: number = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const data: DeliveryHistoryResponse = await deliveryOrderService.getDeliveryHistory(page);
      
      if (page === 1) {
        setDeliveries(data.deliveries);
      } else {
        setDeliveries(prev => [...prev, ...data.deliveries]);
      }
      
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      showError('Erro', 'Não foi possível carregar o histórico. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const handleLoadMore = () => {
    if (pagination.hasNext && !loadingMore) {
      loadHistory(pagination.page + 1);
    }
  };

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

  const toggleDeliveryExpansion = (deliveryId: string) => {
    setExpandedDeliveryId(expandedDeliveryId === deliveryId ? null : deliveryId);
  };

  const renderDeliveryItem = ({ item }: { item: DeliveryHistoryItem }) => (
    <View style={styles.deliveryCard}>
      <TouchableOpacity
        style={styles.deliveryHeader}
        onPress={() => toggleDeliveryExpansion(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.deliveryIconContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
        </View>

        <View style={styles.deliveryInfo}>
          <Text style={styles.trackingCode}>#{item.trackingCode}</Text>
          <Text style={styles.deliveryDate}>{formatDate(item.completedAt)}</Text>
          <View style={styles.deliveryDetails}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.deliveryFee}>{formatCurrency(item.deliveryFee)}</Text>
          </View>
        </View>

        <View style={styles.expandIconContainer}>
          <Ionicons
            name={expandedDeliveryId === item.id ? "chevron-up" : "chevron-down"}
            size={20}
            color="#7F8C8D"
          />
        </View>
      </TouchableOpacity>

      {expandedDeliveryId === item.id && (
        <View style={styles.deliveryExpandedContent}>
          <View style={styles.divider} />
          
          {/* Informações da entrega */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#7F8C8D" />
              <Text style={styles.infoText}>Entregue às {formatTime(item.completedAt)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={16} color="#7F8C8D" />
              <Text style={styles.infoText}>{item.customerPhone}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color="#7F8C8D" />
              <Text style={styles.infoText}>{item.shippingAddress}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="navigate-outline" size={16} color="#7F8C8D" />
              <Text style={styles.infoText}>{item.distance} km</Text>
            </View>

            {item.specialInstructions && (
              <View style={styles.infoItem}>
                <Ionicons name="chatbubble-outline" size={16} color="#7F8C8D" />
                <Text style={styles.infoText}>{item.specialInstructions}</Text>
              </View>
            )}
          </View>

          {/* Itens do pedido */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Itens entregues ({item.items.length})</Text>
            {item.items.map((orderItem, index) => (
              <View key={orderItem.id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{orderItem.name}</Text>
                  <Text style={styles.itemQuantity}>Quantidade: {orderItem.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(orderItem.price)}</Text>
              </View>
            ))}
          </View>

          {/* Resumo financeiro */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total do pedido:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(item.totalPrice)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryHighlight]}>
              <Text style={styles.summaryLabelHighlight}>Seus ganhos:</Text>
              <Text style={styles.summaryValueHighlight}>{formatCurrency(item.deliveryFee)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "Histórico de Entregas",
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#2C3E50",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#2C3E50" />
            </TouchableOpacity>
          ),
        }} 
      />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {deliveries.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(1, true)}
              colors={['#6CC51D']}
              tintColor="#6CC51D"
            />
          }
        >
          <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>Nenhuma entrega encontrada</Text>
          <Text style={styles.emptyMessage}>
            Você ainda não realizou nenhuma entrega.{'\n'}
            Aceite pedidos para começar!
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.deliveriesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(1, true)}
              colors={['#6CC51D']}
              tintColor="#6CC51D"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#6CC51D" />
                <Text style={styles.loadingMoreText}>Carregando mais...</Text>
              </View>
            ) : null
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    marginLeft: 8,
    padding: 8,
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
    color: '#7F8C8D',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  deliveriesList: {
    padding: 16,
    paddingBottom: 32,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  deliveryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderRadius: 8,
  },
  deliveryInfo: {
    flex: 1,
  },
  trackingCode: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  deliveryDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  deliveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#34495E',
    flex: 1,
  },
  deliveryFee: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#27AE60',
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryExpandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#ECF0F1',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#34495E',
    marginLeft: 8,
    flex: 1,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#2C3E50',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#34495E',
  },
  summarySection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#34495E',
  },
  summaryHighlight: {
    marginBottom: 0,
  },
  summaryLabelHighlight: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#27AE60',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
});
