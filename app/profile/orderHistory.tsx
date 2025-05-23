import { useState, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import orderService, { type OrderSummary } from "../../utils/orderService"
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins"

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const router = useRouter()

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await orderService.getMyOrders()
      setOrders(data)

      // Expandir o primeiro pedido por padrão se houver pedidos
      if (data.length > 0 && data[0].status !== "DELIVERED") {
        setExpandedOrderId(data[0].id)
      }

      setError(null)
    } catch (err) {
      setError("Erro ao carregar pedidos. Tente novamente.")
      console.error(err)
    } finally {
      setLoading(false)
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

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={60} color="#CCCCCC" />
        <Text style={styles.emptyText}>Você ainda não tem pedidos</Text>
        <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.browseButtonText}>Explorar produtos</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meu Pedido</Text>

        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <TouchableOpacity
              style={styles.orderHeader}
              onPress={() => toggleOrderExpansion(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderIconContainer}>
                <Ionicons name="cube-outline" size={28} color="#6CC51D" />
              </View>

              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>Pedido #{item.id.substring(0, 5)}</Text>
                <Text style={styles.orderDate}>Realizado em {formatDate(item.createdAt)}</Text>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderItems}>Itens: {item.itemCount}</Text>
                  <Text style={styles.orderTotal}>
                    Itens: R$
                    {item.totalPrice && typeof item.totalPrice === "number"
                      ? item.totalPrice.toFixed(2).replace(".", ",")
                      : "0,00"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.expandButton} onPress={() => toggleOrderExpansion(item.id)}>
                <Ionicons
                  name={expandedOrderId === item.id ? "chevron-up-circle" : "chevron-down-circle"}
                  size={24}
                  color="#6CC51D"
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {expandedOrderId === item.id && item.status !== "DELIVERED" && (
              <View style={styles.orderStatusContainer}>
                {renderStatusItem("PENDING", "Efetuado", formatDate(item.createdAt), true, false)}
                {renderStatusItem(
                  "PROCESSING",
                  "Confirmado",
                  formatDate(item.createdAt),
                  ["PROCESSING", "SHIPPED"].includes(item.status),
                  false,
                )}
                {renderStatusItem(
                  "SHIPPED",
                  "Em rota de entrega",
                  item.status === "SHIPPED" ? formatDate(item.createdAt) : "pendente",
                  item.status === "SHIPPED",
                  false,
                )}
                {renderStatusItem("DELIVERED", "Entregue", "pendente", false, true)}
              </View>
            )}

            {item.status === "DELIVERED" && (
              <View style={styles.deliveredContainer}>
                <View style={styles.deliveredStatus}>
                  <View style={styles.statusDotPending} />
                  <Text style={styles.deliveredText}>Pedido entregue</Text>
                </View>
                <Text style={styles.deliveredDate}>{formatDateDayMonth(item.createdAt)}</Text>
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
    backgroundColor: "#F5F5F8",
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
    padding: 20,
    backgroundColor: "#F5F5F8",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F8",
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  filterButton: {
    padding: 8,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  orderIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  orderDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#888888",
    marginBottom: 6,
  },
  orderDetails: {
    flexDirection: "row",
  },
  orderItems: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#333333",
    marginRight: 16,
  },
  orderTotal: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#333333",
  },
  expandButton: {
    padding: 8,
  },
  orderStatusContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statusLeftContainer: {
    width: 24,
    alignItems: "center",
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    zIndex: 1,
  },
  statusDotCompleted: {
    backgroundColor: "#6CC51D",
  },
  statusDotPending: {
    backgroundColor: "#DDDDDD",
  },
  statusLine: {
    position: "absolute",
    width: 2,
    top: 16,
    bottom: -8,
    left: 7,
  },
  statusLineCompleted: {
    backgroundColor: "#6CC51D",
  },
  statusLinePending: {
    backgroundColor: "#DDDDDD",
  },
  statusContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    fontWeight: "500",
  },
  statusLabelCompleted: {
    color: "#000000",
  },
  statusLabelPending: {
    color: "#888888",
  },
  statusDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#888888",
  },
  deliveredContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deliveredStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveredText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#888888",
    marginLeft: 12,
  },
  deliveredDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#888888",
  },
})
