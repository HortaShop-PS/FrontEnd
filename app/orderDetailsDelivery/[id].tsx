import { Text, View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import deliveryOrderService, { DeliveryOrder } from "../../utils/deliveryOrderService";

export default function OrderDetailsDeliveryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      if (typeof id === 'string') {
        const orderData = await deliveryOrderService.getOrderDetails(id);
        setOrder(orderData);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error);
      setError("Não foi possível carregar os detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const handleAcceptOrder = async () => {
    if (!order) return;

    Alert.alert(
      "Aceitar Pedido",
      "Deseja aceitar este pedido para entrega?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Aceitar",
          onPress: async () => {
            try {
              await deliveryOrderService.acceptOrder(order.id, "delivery_user_id");
              Alert.alert("Sucesso", "Pedido aceito com sucesso!", [
                {
                  text: "OK",
                  onPress: () => router.back()
                }
              ]);
            } catch (error) {
              console.error("Erro ao aceitar pedido:", error);
              Alert.alert("Erro", "Não foi possível aceitar o pedido. Tente novamente.");
            }
          }
        }
      ]
    );
  };

  const handleCallCustomer = () => {
    if (order?.customerPhone) {
      const phoneNumber = order.customerPhone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleNavigateToAddress = () => {
    if (order?.shippingAddress) {
      const encodedAddress = encodeURIComponent(order.shippingAddress);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#007AFF';
      case 'shipped':
        return '#32D74B';
      case 'delivered':
        return '#34C759';
      case 'canceled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6CC51D" style={{ flex: 1 }} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>{error || "Pedido não encontrado"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfoCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>#{order.trackingCode}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>
          <Text style={styles.orderValue}>
            R$ {order.totalPrice.toFixed(2).replace('.', ',')}
          </Text>
          {order.estimatedDeliveryTime && (
            <Text style={styles.estimatedTime}>
              Tempo estimado: {order.estimatedDeliveryTime}
            </Text>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.customerCard}>
          <Text style={styles.sectionTitle}>Informações do Cliente</Text>
          
          <View style={styles.customerRow}>
            <Ionicons name="person-outline" size={20} color="#6CC51D" />
            <Text style={styles.customerText}>{order.customerName}</Text>
          </View>

          <View style={styles.customerRow}>
            <Ionicons name="call-outline" size={20} color="#6CC51D" />
            <Text style={styles.customerText}>{order.customerPhone}</Text>
            <TouchableOpacity onPress={handleCallCustomer} style={styles.actionIcon}>
              <Ionicons name="call" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.customerRow}>
            <Ionicons name="location-outline" size={20} color="#6CC51D" />
            <Text style={styles.customerText} numberOfLines={3}>
              {order.shippingAddress}
            </Text>
            <TouchableOpacity onPress={handleNavigateToAddress} style={styles.actionIcon}>
              <Ionicons name="navigate" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {order.specialInstructions && (
            <View style={styles.customerRow}>
              <Ionicons name="information-circle-outline" size={20} color="#FFA500" />
              <Text style={styles.customerText}>{order.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Quantidade: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                R$ {item.price.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              R$ {(order.totalPrice - order.deliveryFee).toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxa de entrega:</Text>
            <Text style={styles.totalValue}>
              R$ {order.deliveryFee.toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={styles.finalTotalLabel}>Total:</Text>
            <Text style={styles.finalTotalValue}>
              R$ {order.totalPrice.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptOrder}>
          <Text style={styles.acceptButtonText}>Aceitar Pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333333",
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#666666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: "#6CC51D",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  orderInfoCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#333333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  orderValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#6CC51D",
    marginBottom: 8,
  },
  estimatedTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
  },
  customerCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#333333",
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  customerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
    flex: 1,
    lineHeight: 20,
  },
  actionIcon: {
    padding: 4,
  },
  itemsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  itemQuantity: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#666666",
  },
  itemPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6CC51D",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
  },
  totalValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333333",
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    marginTop: 8,
    paddingTop: 12,
  },
  finalTotalLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#333333",
  },
  finalTotalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#6CC51D",
  },
  bottomActions: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  acceptButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptButtonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});