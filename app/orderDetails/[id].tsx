import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import orderService, { OrderDetail } from '../../utils/orderService';
import * as SecureStore from 'expo-secure-store';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import ReviewModal from '../../components/ReviewModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProducer, setIsProducer] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{productId: string, productName: string, orderItemId: string, producerId: number, producerName: string} | null>(null);
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_500Medium,
  });

  useEffect(() => {
    checkUserType();
    loadOrderDetails();
  }, [id]);

  const checkUserType = async () => {
    try {
      const userType = await SecureStore.getItemAsync('userType');
      setIsProducer(userType === 'producer');
    } catch (error) {
      setIsProducer(false);
    }
  };

  const loadOrderDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      let data;
      if (isProducer) {
        data = await orderService.getProducerOrderDetails(id);
      } else {
        data = await orderService.getOrderDetails(id);
      }
      setOrder(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar detalhes do pedido:', err);
      setError('Erro ao carregar detalhes do pedido. Tente novamente.');
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
      pending: 'Pendente',
      processing: 'Em processamento',
      shipped: 'Enviado',
      delivered: 'Entregue',
      canceled: 'Cancelado'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#F39C12',
      processing: '#3498DB',
      shipped: '#9B59B6',
      delivered: '#27AE60',
      canceled: '#E74C3C'
    };
    return colorMap[status.toLowerCase()] || '#34495E';
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      await orderService.updateOrderStatus(id, newStatus);
      await loadOrderDetails();
    } catch (err) {
      setError('Erro ao atualizar status. Tente novamente.');
      setLoading(false);
    }
  };

  const handleReviewProduct = (productId: string, productName: string, orderItemId: string, producerId: number, producerName: string) => {
    setSelectedItem({ productId, productName, orderItemId, producerId, producerName });
    setReviewModalVisible(true);
  };

  const handleReviewModalClose = () => {
    setReviewModalVisible(false);
    setSelectedItem(null);
  };

  const handleReviewSubmitted = async () => {
    try {
      await loadOrderDetails();
    } catch (error) {}
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#E74C3C" />
        <Text style={styles.errorTitle}>Ops!</Text>
        <Text style={styles.errorMessage}>{error || 'Pedido não encontrado'}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadOrderDetails}>
          <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
        <View style={{width: 24}} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdSection}>
            <Text style={styles.orderLabel}>PEDIDO</Text>
            <Text style={styles.orderNumber}>#{order.id.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status).toUpperCase()}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>INFORMAÇÕES</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#7F8C8D" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data do pedido</Text>
              <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#7F8C8D" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Endereço de entrega</Text>
              <Text style={styles.infoValue}>{order.shippingAddress}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={20} color="#7F8C8D" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Forma de pagamento</Text>
              <Text style={styles.infoValue}>{order.paymentMethod}</Text>
            </View>
          </View>

          {order.trackingCode && (
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={20} color="#7F8C8D" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Código de rastreamento</Text>
                <Text style={styles.infoValue}>{order.trackingCode}</Text>
              </View>
            </View>
          )}
        </View>
        {/* Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.cardTitle}>ITENS DO PEDIDO</Text>
          
          {order.items.map((item, index) => (
            <View key={item.id} style={[styles.itemContainer, index > 0 && styles.itemBorder]}>
              <View style={styles.itemMain}>
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ 
                      uri: item.productImage 
                        ? (item.productImage.startsWith('http') 
                            ? item.productImage 
                            : `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.productImage}`)
                        : 'https://via.placeholder.com/60' 
                    }} 
                    style={styles.itemImage}
                    defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
                  />
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemProducer}>{item.producerName}</Text>
                  <View style={styles.itemPricing}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <Text style={styles.itemPrice}>
                      R$ {item.unitPrice 
                        ? (typeof item.unitPrice === 'number' 
                            ? item.unitPrice.toFixed(2).replace('.', ',')
                            : parseFloat(String(item.unitPrice)).toFixed(2).replace('.', ',')) 
                        : '0,00'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.itemTotal}>
                  R$ {item.totalPrice 
                    ? (typeof item.totalPrice === 'number' 
                        ? item.totalPrice.toFixed(2).replace('.', ',')
                        : parseFloat(String(item.totalPrice)).toFixed(2).replace('.', ',')) 
                    : '0,00'}
                </Text>
              </View>

              {item.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Observações:</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              )}
              
              {/* Review Button */}
              {(() => {
                const isDelivered = order.status.toLowerCase() === 'delivered';
                const shouldShowReviewButton = !isProducer && isDelivered && !item.reviewed;
                return shouldShowReviewButton;
              })() && (
                <TouchableOpacity 
                  style={styles.reviewButton}
                  onPress={() => handleReviewProduct(item.productId, item.productName, item.id, item.producerId, item.producerName)}
                >
                  <Ionicons name="star" size={16} color="#FFFFFF" />
                  <Text style={styles.reviewButtonText}>AVALIAR PRODUTO</Text>
                </TouchableOpacity>
              )}
              
              {/* Reviewed Indicator */}
              {!isProducer && order.status.toLowerCase() === 'delivered' && item.reviewed && (
                <View style={styles.reviewedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  <Text style={styles.reviewedText}>PRODUTO AVALIADO</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>
            R$ {order.totalPrice 
              ? (typeof order.totalPrice === 'number' 
                  ? order.totalPrice.toFixed(2).replace('.', ',')
                  : parseFloat(String(order.totalPrice)).toFixed(2).replace('.', ',')) 
              : '0,00'}
          </Text>
        </View>

        {/* Producer Actions */}
        {isProducer && (
          <View style={styles.actionsCard}>
            {order.status.toLowerCase() === 'pending' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
                onPress={() => handleUpdateStatus('PROCESSING')}
              >
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>PROCESSAR PEDIDO</Text>
              </TouchableOpacity>
            )}
            
            {order.status.toLowerCase() === 'processing' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#9B59B6' }]}
                onPress={() => handleUpdateStatus('SHIPPED')}
              >
                <Ionicons name="airplane" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>MARCAR COMO ENVIADO</Text>
              </TouchableOpacity>
            )}
            
            {order.status.toLowerCase() === 'shipped' && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#27AE60' }]}
                onPress={() => handleUpdateStatus('DELIVERED')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>MARCAR COMO ENTREGUE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Review Modal */}
      {selectedItem && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={handleReviewModalClose}
          productId={selectedItem.productId}
          productName={selectedItem.productName}
          producerId={selectedItem.producerId}
          producerName={selectedItem.producerName}
          orderItemId={selectedItem.orderItemId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1000,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#2C3E50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  // Order Header
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  orderIdSection: {
    flex: 1,
  },
  orderLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#7F8C8D',
    letterSpacing: 1,
  },
  orderNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#2C3E50',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Cards
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
    totalCard: {
    backgroundColor: '#2ECC71',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  totalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 12,
    letterSpacing: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoContent: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#7F8C8D',
  },
  infoValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#2C3E50',
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 12,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2C3E50',
  },
  itemProducer: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  itemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#2C3E50',
    marginRight: 8,
  },
  itemPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#2ECC71',
  },
  itemTotal: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#2ECC71',
    minWidth: 80,
    textAlign: 'right',
  },
  notesSection: {
    marginTop: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    padding: 8,
  },
  notesLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  notesText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#2C3E50',
  },
  reviewButton: {
    marginTop: 12,
    backgroundColor: '#F39C12',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: 44,
  },
  reviewButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  reviewedIndicator: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  reviewedText: {
    color: '#27AE60',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginLeft: 6,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 6,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECF0F1',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2ECC71',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#E74C3C',
    marginTop: 10,
  },
  errorMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#ECF0F1',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2C3E50',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
