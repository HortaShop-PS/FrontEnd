import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import orderService, { OrderDetail } from '../../utils/orderService';
import * as SecureStore from 'expo-secure-store';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProducer, setIsProducer] = useState(false);
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    checkUserType();
    loadOrderDetails();
  }, [id]);

  const checkUserType = async () => {
    const userType = await SecureStore.getItemAsync('userType');
    setIsProducer(userType === 'producer');
  };

  const loadOrderDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await orderService.getOrderDetails(id);
      setOrder(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar detalhes do pedido. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
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

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      await orderService.updateOrderStatus(id, newStatus);
      await loadOrderDetails();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status. Tente novamente.');
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Pedido não encontrado'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrderDetails}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
        <View style={{width: 24}} />
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Pedido:</Text>
          <Text style={styles.orderId}>#{order.id.substring(0, 8)}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Pedido</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data:</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Endereço:</Text>
            <Text style={styles.infoValue}>{order.shippingAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pagamento:</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>
          {order.trackingCode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rastreamento:</Text>
              <Text style={styles.infoValue}>{order.trackingCode}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Image 
                  source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.productImage}` || 'https://via.placeholder.com/60' }} 
                  style={styles.itemImage}
                  defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemProducer}>Produtor: {item.producerName}</Text>
                  <Text style={styles.itemPrice}>
                    R$ {item.unitPrice && typeof item.unitPrice === 'number' 
                      ? item.unitPrice.toFixed(2).replace('.', ',') 
                      : '0,00'} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  R$ {item.totalPrice && typeof item.totalPrice === 'number' 
                    ? item.totalPrice.toFixed(2).replace('.', ',') 
                    : '0,00'}
                </Text>
              </View>
              {item.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Observações:</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total do Pedido:</Text>
          <Text style={styles.totalValue}>
            R$ {order.totalPrice && typeof order.totalPrice === 'number' 
              ? order.totalPrice.toFixed(2).replace('.', ',') 
              : '0,00'}
          </Text>
        </View>

        {isProducer && (
          <View style={styles.actionContainer}>
            {order.status === 'PENDING' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.processButton]}
                onPress={() => handleUpdateStatus('PROCESSING')}
              >
                <Text style={styles.actionButtonText}>Processar Pedido</Text>
              </TouchableOpacity>
            )}
            
            {order.status === 'PROCESSING' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.shipButton]}
                onPress={() => handleUpdateStatus('SHIPPED')}
              >
                <Text style={styles.actionButtonText}>Marcar como Enviado</Text>
              </TouchableOpacity>
            )}
            
            {order.status === 'SHIPPED' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.deliverButton]}
                onPress={() => handleUpdateStatus('DELIVERED')}
              >
                <Text style={styles.actionButtonText}>Marcar como Entregue</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  orderId: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statusLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  statusValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#666666',
    width: '30%',
  },
  infoValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#EEEEEE',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333333',
  },
  itemProducer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  itemTotal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#6CC51D',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  notesLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#666666',
  },
  notesText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#333333',
    marginTop: 4,
  },
  totalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  totalLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  totalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#6CC51D',
  },
  actionContainer: {
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  processButton: {
    backgroundColor: '#3498DB',
  },
  shipButton: {
    backgroundColor: '#9B59B6',
  },
  deliverButton: {
    backgroundColor: '#2ECC71',
  },
  actionButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  retryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  backButton: {
    backgroundColor: '#666666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  backButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});