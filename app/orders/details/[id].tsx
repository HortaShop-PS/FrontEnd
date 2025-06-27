import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import deliveryOrderService, { DeliveryOrder } from '../../../utils/deliveryOrderService';

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrderDetails = async () => {
    try {
      if (typeof id === 'string') {
        const orderDetails = await deliveryOrderService.getOrderDetails(id);
        setOrder(orderDetails);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar detalhes do pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const handleCallCustomer = () => {
    if (order?.customerPhone) {
      const phoneNumber = order.customerPhone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Aviso', 'Telefone do cliente não disponível');
    }
  };

  const handleOpenMaps = () => {
    if (order?.shippingAddress) {
      const address = encodeURIComponent(order.shippingAddress);
      const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Aviso', 'Endereço de entrega não disponível');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#e74c3c" />
        <Text style={styles.errorTitle}>Pedido não encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do Pedido */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informações do Pedido</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: deliveryOrderService.getStatusColor(order.status) }
            ]}>
              <Text style={styles.statusText}>
                {deliveryOrderService.getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID do Pedido:</Text>
            <Text style={styles.infoValue}>#{order.id.slice(-8)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data do Pedido:</Text>
            <Text style={styles.infoValue}>
              {deliveryOrderService.formatDate(order.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor Total:</Text>
            <Text style={[styles.infoValue, styles.totalPrice]}>
              {deliveryOrderService.formatCurrency(order.totalPrice)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Forma de Pagamento:</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod || 'Não informado'}
            </Text>
          </View>

          {order.trackingCode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código de Rastreamento:</Text>
              <Text style={styles.infoValue}>{order.trackingCode}</Text>
            </View>
          )}
        </View>

        {/* Informações do Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Cliente</Text>

          <View style={styles.customerInfo}>
            <View style={styles.customerRow}>
              <Ionicons name="person-outline" size={20} color="#27ae60" />
              <Text style={styles.customerText}>{order.customerName}</Text>
            </View>

            {order.customerPhone && (
              <TouchableOpacity
                style={styles.customerRow}
                onPress={handleCallCustomer}
              >
                <Ionicons name="call-outline" size={20} color="#27ae60" />
                <Text style={[styles.customerText, styles.linkText]}>
                  {order.customerPhone}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color="#27ae60" />
              </TouchableOpacity>
            )}

            {order.shippingAddress && (
              <TouchableOpacity
                style={styles.customerRow}
                onPress={handleOpenMaps}
              >
                <Ionicons name="location-outline" size={20} color="#27ae60" />
                <Text style={[styles.customerText, styles.linkText]} numberOfLines={3}>
                  {order.shippingAddress}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color="#27ae60" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Itens do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Itens do Pedido ({order.items.length})
          </Text>

          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemPrice}>
                  {deliveryOrderService.formatCurrency(item.price)}
                </Text>
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>
                  Quantidade: {item.quantity}
                </Text>
                <Text style={styles.itemSubtotal}>
                  Subtotal: {deliveryOrderService.formatCurrency(item.subtotal)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          {order.customerPhone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCallCustomer}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Ligar para Cliente</Text>
            </TouchableOpacity>
          )}

          {order.shippingAddress && (
            <TouchableOpacity
              style={[styles.actionButton, styles.mapsButton]}
              onPress={handleOpenMaps}
            >
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Abrir no Maps</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  customerInfo: {
    gap: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  linkText: {
    color: '#27ae60',
    textDecorationLine: 'underline',
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  itemSubtotal: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  mapsButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});