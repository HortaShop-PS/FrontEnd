import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import orderService, { OrderSummary } from '../../utils/orderService';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useFocusEffect } from 'expo-router';

export default function ProducerOrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getProducerOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar pedidos. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendente',
      PROCESSING: 'Em processamento',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: '#FFA500',
      PROCESSING: '#3498DB',
      SHIPPED: '#9B59B6',
      DELIVERED: '#2ECC71',
      CANCELLED: '#E74C3C'
    };
    return colorMap[status] || '#000000';
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/orderDetails/${orderId}`);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      // Atualizar a lista após a mudança de status
      loadOrders();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status. Tente novamente.');
    }
  };

  if (!fontsLoaded || (loading && !refreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos Recebidos</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.orderCard}
            onPress={() => handleOrderPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{item.id.substring(0, 8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.orderDetails}>
              <View style={styles.orderInfo}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>{formatDate(item.createdAt)}</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Ionicons name="cube-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>{item.itemCount} {item.itemCount === 1 ? 'item' : 'itens'}</Text>
              </View>
              
              <View style={styles.orderInfo}>
                <Ionicons name="cash-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  R$ {item.totalPrice && typeof item.totalPrice === 'number' 
                    ? item.totalPrice.toFixed(2).replace('.', ',') 
                    : '0,00'}
                </Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              {item.status === 'PENDING' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.processButton]}
                  onPress={() => handleUpdateStatus(item.id, 'PROCESSING')}
                >
                  <Ionicons name="construct-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Processar</Text>
                </TouchableOpacity>
              )}
              
              {item.status === 'PROCESSING' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.shipButton]}
                  onPress={() => handleUpdateStatus(item.id, 'SHIPPED')}
                >
                  <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Marcar como Enviado</Text>
                </TouchableOpacity>
              )}
              
              {item.status === 'SHIPPED' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deliverButton]}
                  onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Marcar como Entregue</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => handleOrderPress(item.id)}
              >
                <Ionicons name="eye-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>Ver Detalhes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#6CC51D"]}
            tintColor="#6CC51D"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Você ainda não recebeu pedidos</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabsProducers)')}
            >
              <Text style={styles.browseButtonText}>Voltar para o início</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  actionButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    fontSize: 12,
  },
  viewButton: {
    backgroundColor: '#3498DB',
  },
  processButton: {
    backgroundColor: '#F39C12',
  },
  shipButton: {
    backgroundColor: '#9B59B6',
  },
  deliverButton: {
    backgroundColor: '#2ECC71',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 80,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
});