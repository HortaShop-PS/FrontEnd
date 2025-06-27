import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { DeliveryOrder } from "../../utils/deliveryOrderService";
import deliveryOrderService from "../../utils/deliveryOrderService";

export default function CurrentDeliveryScreen() {
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_500Medium,
  });

  const [currentDelivery, setCurrentDelivery] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const getCurrentDelivery = async () => {
    try {
      setLoading(true);
      const activeDelivery = await deliveryOrderService.getCurrentActiveDelivery();
      setCurrentDelivery(activeDelivery);
    } catch (error) {
      console.error('Erro ao carregar entrega atual:', error);
      setCurrentDelivery(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getCurrentDelivery();
    }, [])
  );

  const handleCallCustomer = () => {
    if (currentDelivery?.customerPhone) {
      const phoneNumber = currentDelivery.customerPhone.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleNavigate = () => {
    if (currentDelivery?.shippingAddress) {
      const address = encodeURIComponent(currentDelivery.shippingAddress);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
      Linking.openURL(url);
    }
  };

  const handleCompleteDelivery = () => {
    Alert.alert(
      "Confirmar Entrega",
      "Confirma que a entrega foi realizada com sucesso?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Confirmar",
          onPress: async () => {
            if (currentDelivery) {
              try {
                setUpdating(true);
                await deliveryOrderService.updateOrderStatus(currentDelivery.id, 'delivered');
                Alert.alert(
                  "Sucesso!",
                  "Entrega marcada como concluída com sucesso!",
                  [{ text: "OK", onPress: () => getCurrentDelivery() }]
                );
              } catch (error) {
                console.error('Erro ao marcar entrega como concluída:', error);
                Alert.alert("Erro", "Não foi possível marcar a entrega como concluída");
              } finally {
                setUpdating(false);
              }
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Aguardando Coleta',
      processing: 'Sendo Preparado',
      shipped: 'Em Rota de Entrega',
      delivered: 'Entregue',
      canceled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: '#FFA500',
      processing: '#007AFF',
      shipped: '#6CC51D',
      delivered: '#28a745',
      canceled: '#FF3B30'
    };
    return colorMap[status] || '#666666';
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6CC51D" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentDelivery ? "Entrega Atual" : "Sem Entregas"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      ) : currentDelivery ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: getStatusColor(currentDelivery.status) }]}>
            <Ionicons name="information-circle" size={24} color="#FFFFFF" />
            <Text style={styles.statusText}>{getStatusText(currentDelivery.status)}</Text>
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do Cliente</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#6CC51D" />
              <Text style={styles.infoText}>{currentDelivery.customerName}</Text>
            </View>
            
            <TouchableOpacity style={styles.infoRow} onPress={handleCallCustomer}>
              <Ionicons name="call" size={20} color="#6CC51D" />
              <Text style={styles.infoText}>{currentDelivery.customerPhone}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999999" />
            </TouchableOpacity>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
            
            <TouchableOpacity style={styles.addressContainer} onPress={handleNavigate}>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={20} color="#6CC51D" />
                <Text style={styles.addressText}>{currentDelivery.shippingAddress}</Text>
              </View>
              <Ionicons name="navigate" size={24} color="#6CC51D" />
            </TouchableOpacity>
            
            {currentDelivery.estimatedDeliveryTime && (
              <View style={styles.estimateContainer}>
                <Ionicons name="time" size={16} color="#666666" />
                <Text style={styles.estimateText}>
                  Tempo estimado: {currentDelivery.estimatedDeliveryTime}
                </Text>
              </View>
            )}
          </View>

          {/* Order Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes do Pedido</Text>
            
            <View style={styles.orderInfo}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Código:</Text>
                <Text style={styles.orderValue}>{currentDelivery.trackingCode}</Text>
              </View>
              
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Total:</Text>
                <Text style={styles.orderValue}>{formatCurrency(currentDelivery.totalPrice)}</Text>
              </View>
              
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Taxa de Entrega:</Text>
                <Text style={styles.orderValue}>{formatCurrency(currentDelivery.deliveryFee)}</Text>
              </View>
            </View>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens ({currentDelivery.items.length})</Text>
            
            {currentDelivery.items.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity}x {formatCurrency(item.price)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Special Instructions */}
          {currentDelivery.specialInstructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instruções Especiais</Text>
              <View style={styles.instructionsContainer}>
                <Ionicons name="document-text" size={20} color="#6CC51D" />
                <Text style={styles.instructionsText}>{currentDelivery.specialInstructions}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Ligar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Navegar</Text>
            </TouchableOpacity>

            {(currentDelivery.status === 'shipped' || currentDelivery.status === 'processing') && (
              <TouchableOpacity 
                style={[styles.completeButton, updating && styles.buttonDisabled]} 
                onPress={handleCompleteDelivery}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Entregar</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Nenhuma Entrega Ativa</Text>
          <Text style={styles.emptySubtitle}>
            Você não possui entregas em andamento no momento
          </Text>
          <Text style={styles.emptyHint}>
            Aceite pedidos na aba "Pedidos" para começar
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#333333",
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
  content: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#333333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#333333",
    flex: 1,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  addressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#333333",
    flex: 1,
    lineHeight: 20,
  },
  estimateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  estimateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#666666",
  },
  orderInfo: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
  },
  orderValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333333",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  itemDetails: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#666666",
  },
  instructionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  instructionsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#333333",
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: "#FFFFFF",
    marginTop: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: "#6CC51D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#F8F9FA",
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#333333",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  emptyHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    fontStyle: "italic",
  },
});