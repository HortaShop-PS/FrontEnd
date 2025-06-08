import { Text, View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { DeliveryOrder } from "../../utils/deliveryOrderService";
import deliveryOrderService from "../../utils/deliveryOrderService";

export default function DeliveryIndex() {
  const router = useRouter();
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [allAvailableOrders, setAllAvailableOrders] = useState<DeliveryOrder[]>([]); // Para armazenar todos os pedidos
  const [myOrders, setMyOrders] = useState<DeliveryOrder[]>([]);
  const [allMyOrders, setAllMyOrders] = useState<DeliveryOrder[]>([]); // Para armazenar todos os meus pedidos
  const [todaysEarnings, setTodaysEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Função para filtrar pedidos baseado na pesquisa
  const filterOrders = (orders: DeliveryOrder[], query: string) => {
    if (!query.trim()) {
      if (activeTab === 'available') {
        setAvailableOrders(orders);
      } else {
        setMyOrders(orders);
      }
      return;
    }

    const filteredOrders = orders.filter(order => {
      const searchTerm = query.toLowerCase().trim();
      return (
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.trackingCode.toLowerCase().includes(searchTerm) ||
        order.shippingAddress.toLowerCase().includes(searchTerm) ||
        order.customerPhone.includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm)
      );
    });

    if (activeTab === 'available') {
      setAvailableOrders(filteredOrders);
    } else {
      setMyOrders(filteredOrders);
    }
  };

  // Função para lidar com mudanças na pesquisa
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (activeTab === 'available') {
      filterOrders(allAvailableOrders, text);
    } else {
      filterOrders(allMyOrders, text);
    }
  };

  const loadAvailableOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const orders = await deliveryOrderService.getAvailableOrders();
      setAllAvailableOrders(orders); // Armazenar todos os pedidos
      filterOrders(orders, searchQuery); // Aplicar filtro atual
      setError(null);
    } catch (error) {
      console.error("Erro ao carregar pedidos disponíveis:", error);
      if (!isRefresh) {
        setError("Não foi possível carregar os pedidos disponíveis");
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMyOrders = async () => {
    try {
      const orders = await deliveryOrderService.getMyOrders();
      setAllMyOrders(orders); // Armazenar todos os meus pedidos
      filterOrders(orders, searchQuery); // Aplicar filtro atual
    } catch (error) {
      console.error("Erro ao carregar meus pedidos:", error);
    }
  };

  const loadTodaysEarnings = async () => {
    try {
      const earnings = await deliveryOrderService.getTodaysEarnings();
      setTodaysEarnings(earnings);
    } catch (error) {
      console.error("Erro ao carregar ganhos de hoje:", error);
    }
  };

  // Função para lidar com mudanças de aba
  const handleTabChange = (tab: 'available' | 'my') => {
    setActiveTab(tab);
    // Reaplicar o filtro de pesquisa para a nova aba
    if (tab === 'available') {
      filterOrders(allAvailableOrders, searchQuery);
    } else {
      filterOrders(allMyOrders, searchQuery);
    }
  };

  const onRefresh = () => {
    loadAvailableOrders(true);
    loadMyOrders();
    loadTodaysEarnings();
  };

  const handleAcceptOrder = async (orderId: string) => {
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
              const success = await deliveryOrderService.acceptOrder(orderId);
              if (success) {
                Alert.alert("Sucesso", "Pedido aceito com sucesso!");
                // Recarregar as listas
                loadAvailableOrders();
                loadMyOrders();
              }
            } catch (error) {
              console.error("Erro ao aceitar pedido:", error);
              Alert.alert("Erro", "Não foi possível aceitar o pedido. Tente novamente.");
            }
          }
        }
      ]
    );
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

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadAvailableOrders(),
        loadMyOrders(),
        loadTodaysEarnings()
      ]);
    };
    loadData();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6CC51D" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        style={styles.mainContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6CC51D']}
            tintColor="#6CC51D"
          />
        }
      >
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>HortaShop Delivery</Text>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          {/* Barra de pesquisa */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#9E9E9E" />
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar por cliente, código, endereço..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholderTextColor="#9E9E9E"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => handleSearchChange('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Estatísticas rápidas */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="cube-outline" size={24} color="#6CC51D" />
              <Text style={styles.statNumber}>{availableOrders.length}</Text>
              <Text style={styles.statLabel}>Disponíveis</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#32D74B" />
              <Text style={styles.statNumber}>{myOrders.length}</Text>
              <Text style={styles.statLabel}>Minhas Entregas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>R$ {todaysEarnings.toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.statLabel}>Hoje</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'available' && styles.activeTab]}
              onPress={() => handleTabChange('available')}
            >
              <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                Pedidos Disponíveis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'my' && styles.activeTab]}
              onPress={() => handleTabChange('my')}
            >
              <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
                Minhas Entregas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo das tabs */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6CC51D" />
              <Text style={styles.loadingText}>Carregando pedidos...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadAvailableOrders()}>
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ordersContainer}>
              {/* Indicador de pesquisa ativa */}
              {searchQuery.trim().length > 0 && (
                <View style={styles.searchIndicator}>
                  <Ionicons name="search" size={16} color="#6CC51D" />
                  <Text style={styles.searchIndicatorText}>
                    Resultados para "{searchQuery}"
                  </Text>
                  <TouchableOpacity onPress={() => handleSearchChange('')}>
                    <Text style={styles.clearSearchText}>Limpar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'available' ? (
                availableOrders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={60} color="#CCCCCC" />
                    <Text style={styles.emptyTitle}>Nenhum pedido disponível</Text>
                    <Text style={styles.emptySubtitle}>
                      Novos pedidos aparecerão aqui quando estiverem prontos para entrega
                    </Text>
                  </View>
                ) : (
                  availableOrders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderNumber}>#{order.trackingCode}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                          </View>
                        </View>
                        <Text style={styles.orderValue}>
                          R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>

                      <View style={styles.customerInfo}>
                        <View style={styles.customerRow}>
                          <Ionicons name="person-outline" size={16} color="#666666" />
                          <Text style={styles.customerText}>{order.customerName}</Text>
                        </View>
                        <View style={styles.customerRow}>
                          <Ionicons name="call-outline" size={16} color="#666666" />
                          <Text style={styles.customerText}>{order.customerPhone}</Text>
                        </View>
                        <View style={styles.customerRow}>
                          <Ionicons name="location-outline" size={16} color="#666666" />
                          <Text style={styles.customerText} numberOfLines={2}>
                            {order.shippingAddress}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.orderActions}>
                        <TouchableOpacity 
                          style={styles.detailsButton}
                          onPress={() => router.push(`/orderDetailsDelivery/${order.id}`)}
                        >
                          <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.acceptButton}
                          onPress={() => handleAcceptOrder(order.id)}
                        >
                          <Text style={styles.acceptButtonText}>Aceitar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )
              ) : (
                myOrders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={60} color="#CCCCCC" />
                    <Text style={styles.emptyTitle}>Nenhuma entrega em andamento</Text>
                    <Text style={styles.emptySubtitle}>
                      Seus pedidos aceitos aparecerão aqui
                    </Text>
                  </View>
                ) : (
                  myOrders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderNumber}>#{order.trackingCode}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                          </View>
                        </View>
                        <Text style={styles.orderValue}>
                          R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>

                      <View style={styles.customerInfo}>
                        <View style={styles.customerRow}>
                          <Ionicons name="person-outline" size={16} color="#666666" />
                          <Text style={styles.customerText}>{order.customerName}</Text>
                        </View>
                        <View style={styles.customerRow}>
                          <Ionicons name="call-outline" size={16} color="#666666" />
                          <Text style={styles.customerText}>{order.customerPhone}</Text>
                        </View>
                        <View style={styles.customerRow}>
                          <Ionicons name="location-outline" size={16} color="#666666" />
                          <Text style={styles.customerText} numberOfLines={2}>
                            {order.shippingAddress}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.orderActions}>
                        <TouchableOpacity 
                          style={styles.detailsButton}
                          onPress={() => router.push(`/orderDetailsDelivery/${order.id}`)}
                        >
                          <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deliveredButton}
                          onPress={() => {
                            Alert.alert(
                              "Marcar como Entregue",
                              "Confirma que este pedido foi entregue?",
                              [
                                { text: "Cancelar", style: "cancel" },
                                { 
                                  text: "Confirmar", 
                                  onPress: async () => {
                                    try {
                                      await deliveryOrderService.updateOrderStatus(order.id, 'delivered');
                                      Alert.alert("Sucesso", "Pedido marcado como entregue!");
                                      // Recarregar as listas
                                      loadAvailableOrders();
                                      loadMyOrders();
                                    } catch (error) {
                                      console.error("Erro ao marcar como entregue:", error);
                                      Alert.alert("Erro", "Não foi possível marcar como entregue. Tente novamente.");
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Text style={styles.deliveredButtonText}>Entregue</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 1,
    paddingBottom: 15,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#6CC51D",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#333333",
    marginTop: 8,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  activeTabText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#333333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
    paddingVertical: 60,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333333",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  ordersContainer: {
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#333333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#FFFFFF",
  },
  orderValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#6CC51D",
  },
  customerInfo: {
    marginBottom: 16,
    gap: 8,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  orderActions: {
    flexDirection: "row",
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  detailsButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333333",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#6CC51D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  deliveredButton: {
    flex: 1,
    backgroundColor: "#32D74B",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deliveredButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  // Estilos da barra de pesquisa
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#333333",
    marginLeft: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  searchIndicatorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6CC51D",
    marginLeft: 8,
    flex: 1,
  },
  clearSearchText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#6CC51D",
    textDecorationLine: "underline",
  },
});