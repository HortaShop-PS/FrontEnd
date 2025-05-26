import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import orderService, { type OrderSummary } from "../../utils/orderService"
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { useFocusEffect } from 'expo-router';

export default function ProducerOrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  })

  useFocusEffect(
    React.useCallback(() => {
      loadOrders()
    }, [])
  );

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const data = await orderService.getProducerOrders() // Use getProducerOrders
      setOrders(data)

      // Expandir o primeiro pedido por padrão se houver pedidos
      if (data.length > 0 && data[0].status.toLowerCase() !== "delivered") {
        setExpandedOrderId(data[0].id)
      }

      setError(null)
    } catch (err) {
      if (!isRefresh) {
        setError("Erro ao carregar pedidos. Tente novamente.")
      }
      console.error(err)
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  const formatDateDayMonth = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const handleOrderPress = (orderId: string) => {
    router.push(`/orderDetails/${orderId}`)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      loadOrders(true); // Refresh orders after status update
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status. Tente novamente.');
    }
  };

  // Renderiza um item de status
  const renderStatusItem = (status: string, label: string, date: string, isCompleted: boolean, isLast: boolean) => (
    <View style={styles.statusItem} key={status}>
      <View style={styles.statusLeftContainer}>
        <View style={[styles.statusDot, isCompleted ? styles.statusDotCompleted : styles.statusDotPending]} />
        {!isLast && (
          <View style={[styles.statusLine, isCompleted ? styles.statusLineCompleted : styles.statusLinePending]} />
        )}
      </View>
      <View style={styles.statusContent}>
        <Text style={[styles.statusLabel, isCompleted ? styles.statusLabelCompleted : styles.statusLabelPending]}>
          {label}
        </Text>
        <Text style={styles.statusDate}>{date}</Text>
      </View>
    </View>
  )

  // Renderizar Stack.Screen sempre, independente do estado
  const renderStackScreen = () => (
    <Stack.Screen
      options={{
        headerTitle: "Pedidos Recebidos", // Changed title for producer
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerShadowVisible: false,
        headerTintColor: "#000000",
        headerTitleStyle: {
          fontWeight: "500",
          fontSize: 18,
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        ),
      }}
    />
  );

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders()}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
          </View>
          <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
          <Text style={styles.emptySubtitle}>Você ainda não recebeu nenhum pedido</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/(tabsProducers)")}>
            <Text style={styles.browseButtonText}>Voltar para o início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            colors={['#6CC51D']}
            tintColor="#6CC51D"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <TouchableOpacity
              style={styles.orderHeader}
              onPress={() => toggleOrderExpansion(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.orderIconContainer}>
                <Ionicons name="cube" size={24} color="#FFFFFF" />
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderItems}>{item.itemCount} itens</Text>
                  <Text style={styles.orderTotal}>
                    Total: R$ {typeof item.totalPrice === "number" && !isNaN(item.totalPrice)
                      ? item.totalPrice.toFixed(2).replace(".", ",")
                      : "0,00"}
                  </Text>
                </View>
              </View>

              <View style={styles.expandIconContainer}>
                <Ionicons
                  name={expandedOrderId === item.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#7F8C8D"
                />
              </View>
            </TouchableOpacity>

            {expandedOrderId === item.id && item.status.toLowerCase() !== "delivered" && (
              <View style={styles.orderStatusContainer}>
                <View style={styles.statusDivider} />
                {renderStatusItem("PENDING", "Pedido Efetuado", formatDate(item.createdAt), true, false)}
                {renderStatusItem(
                  "PROCESSING",
                  "Pedido Confirmado",
                  item.status.toLowerCase() === "processing" || item.status.toLowerCase() === "shipped" ? formatDate(item.createdAt) : "Aguardando",
                  ["processing", "shipped"].includes(item.status.toLowerCase()),
                  false,
                )}
                {renderStatusItem(
                  "SHIPPED",
                  "Em Rota de Entrega",
                  item.status.toLowerCase() === "shipped" ? formatDate(item.createdAt) : "Aguardando",
                  item.status.toLowerCase() === "shipped",
                  false,
                )}
                {renderStatusItem("delivered", "Pedido Entregue", "Aguardando", false, true)}

                {/* Producer Action Buttons */}
                <View style={styles.producerActionButtons}>
                  {item.status.toLowerCase() === 'pending' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.processButton]}
                      onPress={() => handleUpdateStatus(item.id, 'PROCESSING')}
                    >
                      <Ionicons name="construct-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.actionButtonText}>Processar</Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.status.toLowerCase() === 'processing' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.shipButton]}
                      onPress={() => handleUpdateStatus(item.id, 'SHIPPED')}
                    >
                      <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.actionButtonText}>Marcar como Enviado</Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.status.toLowerCase() === 'shipped' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deliverButton]}
                      onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.actionButtonText}>Marcar como Entregue</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {item.status.toLowerCase() === "delivered" && (
              <View style={styles.deliveredContainer}>
                <View style={styles.statusDivider} />
                <View style={styles.deliveredContent}>
                  <View style={styles.deliveredStatus}>
                    <View style={styles.deliveredDot} />
                    <View>
                      <Text style={styles.deliveredText}>Pedido Entregue</Text>
                      <Text style={styles.deliveredDate}>{formatDateDayMonth(item.createdAt)}</Text>
                    </View>
                  </View>
                    <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => handleOrderPress(item.id)}
                  >
                    <Text style={styles.viewDetailsText}>Detalhes</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2ECC71" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f5f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F8",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F5F5F8",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#E74C3C",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F5F5F8",
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  browseButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 2,
    borderBottomColor: "#F5F5F8",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#2C3E50",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ordersList: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#6CC51D",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderRadius: 4,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  orderDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderItems: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#34495E",
  },
  orderTotal: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#2C3E50",
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  orderStatusContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusDivider: {
    height: 2,
    backgroundColor: "#F5F5F8",
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statusLeftContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  statusDotCompleted: {
    backgroundColor: "#6CC51D",
  },
  statusDotPending: {
    backgroundColor: "#BDC3C7",
  },
  statusLine: {
    position: "absolute",
    width: 2,
    top: 12,
    bottom: -16,
    left: 5,
  },
  statusLineCompleted: {
    backgroundColor: "#6CC51D",
  },
  statusLinePending: {
    backgroundColor: "#BDC3C7",
  },
  statusContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  statusLabelCompleted: {
    color: "#2C3E50",
  },
  statusLabelPending: {
    color: "#7F8C8D",
  },
  statusDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
  },
  deliveredContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deliveredContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveredStatus: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deliveredDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6CC51D",
    marginRight: 16,
  },
  deliveredText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 2,
  },
  deliveredDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  viewDetailsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#6CC51D",
    marginRight: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  producerActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F8',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    fontSize: 12,
  },
  processButton: {
    backgroundColor: '#F39C12',
  },
  shipButton: {
    backgroundColor: '#9B59B6',
  },
  deliverButton: {
    backgroundColor: '#27AE60',
  },
});
