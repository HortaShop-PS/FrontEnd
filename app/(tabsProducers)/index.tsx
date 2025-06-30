import { Text, View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useState, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import producerDashboardService, { ProducerDashboardData } from "../../utils/producerDashboardService";
import producerProfileService, { ProfileStatus } from "../../utils/producerProfileService";
import ProducerProfileWarningModal from "../../components/ProducerProfileWarningModal";

export default function ProducerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<ProducerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profile status states
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  // Quick actions for producers
  const quickActions = [
    { id: 1, nome: "Adicionar Produto", icone: "add-circle-outline", route: "/registerProduct", color: "#6CC51D" },
    { id: 2, nome: "Gerenciar Produtos", icone: "grid-outline", route: "/manageProducts", color: "#3498DB" },
    { id: 3, nome: "Pedidos", icone: "receipt-outline", route: "/profile/producerOrderHistory", color: "#F39C12" },
  ];

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch real data from backend
      const data = await producerDashboardService.getDashboardData();
      setDashboardData(data);
      setError(null);
      
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const checkProfileStatus = async () => {
    try {
      console.log('Verificando status do perfil do produtor...');
      const status = await producerProfileService.getProfileStatus();
      setProfileStatus(status);
      
      // Mostra o modal apenas se o perfil não estiver completo e ainda não foi verificado
      if (!status.isComplete && !profileChecked) {
        setShowProfileWarning(true);
      }
      
      setProfileChecked(true);
    } catch (error) {
      console.error('Erro ao verificar status do perfil:', error);
      // Em caso de erro, não mostra o modal para evitar interrupção
      setProfileChecked(true);
    }
  };

  const onRefresh = () => {
    loadDashboardData(true);
  };

  // Load dashboard data on mount and focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      // Só verifica o perfil se ainda não foi verificado nesta sessão
      if (!profileChecked) {
        checkProfileStatus();
      }
    }, [profileChecked])
  );

  const handleCompleteProfile = () => {
    setShowProfileWarning(false);
    router.push('/complete-profile');
  };

  const handleCloseWarning = () => {
    setShowProfileWarning(false);
    // Não mostra novamente até reiniciar o app
    setProfileChecked(true);
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6CC51D" style={{ flex: 1 }} />;
  }

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dashboardData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboardData()}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Profile Warning Modal 
      <ProducerProfileWarningModal
        visible={showProfileWarning}
        onClose={handleCloseWarning}
        onCompleteProfile={handleCompleteProfile}
        completionPercentage={profileStatus?.completionPercentage || 0}
        missingFields={profileStatus?.missingFields || []}
      />*/}
      
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
          {/* Header modernizado */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerGreeting}>Bem-vindo de volta!</Text>
              <Text style={styles.headerTitle}>Painel do Produtor</Text>
            </View>
            {/*<TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#6CC51D" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>*/}
          </View>

          {/* Profile Completion Warning Banner */}
          {profileStatus && !profileStatus.isComplete && (
            <TouchableOpacity 
              style={styles.profileWarningBanner}
              onPress={() => setShowProfileWarning(true)}
            >
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning" size={20} color="#FF9500" />
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Finalize seu cadastro</Text>
                <Text style={styles.warningText}>
                  {profileStatus.completionPercentage}% completo - Complete para começar a vender
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FF9500" />
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsScrollContent}
            >
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionItem}
                  onPress={() => {
                    // Se o perfil não estiver completo e for tentar registrar produto, mostra o warning
                    if (profileStatus && !profileStatus.isComplete && action.route === "/registerProduct") {
                      setShowProfileWarning(true);
                    } else {
                      router.push(action.route);
                    }
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                    <Ionicons name={action.icone as any} size={26} color={action.color} />
                  </View>
                  <Text style={styles.actionName}>{action.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Earnings Banner */}
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>ESTE MÊS</Text>
                </View>
                <Text style={styles.bannerTitle}>R$ {dashboardData.monthlyEarnings.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.bannerSubtitle}>
                  {dashboardData.growthPercentage > 0 ? '+' : ''}{dashboardData.growthPercentage}% vs mês anterior
                </Text>
                <TouchableOpacity style={styles.bannerButton} onPress={() => router.push('/profile/producerOrderHistory')}>
                  <Text style={styles.bannerButtonText}>Ver pedidos</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
              <View style={styles.bannerImageContainer}>
                <View style={styles.bannerCircle1} />
                <View style={styles.bannerCircle2} />
                <Ionicons name="trending-up" size={60} color="rgba(255, 255, 255, 0.3)" />
              </View>
            </View>
          </View>

          {/* Dashboard Stats */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
            </View>

            <View style={styles.statsContainer}>
              {/* First Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="bag-handle" size={24} color="#6CC51D" />
                  </View>
                  <Text style={styles.statValue}>{dashboardData.totalSales}</Text>
                  <Text style={styles.statLabel}>Vendas Total</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="cube" size={24} color="#3498DB" />
                  </View>
                  <Text style={styles.statValue}>{dashboardData.activeProducts}</Text>
                  <Text style={styles.statLabel}>Produtos Ativos</Text>
                </View>
              </View>

              {/* Second Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="hourglass" size={24} color="#F39C12" />
                  </View>
                  <Text style={styles.statValue}>{dashboardData.pendingOrders}</Text>
                  <Text style={styles.statLabel}>Pedidos Pendentes</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                  </View>
                  <Text style={styles.statValue}>{dashboardData.completedOrders}</Text>
                  <Text style={styles.statLabel}>Pedidos Completos</Text>
                </View>
              </View>

              {/* Third Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="star" size={24} color="#F1C40F" />
                  </View>
                  <Text style={styles.statValue}>{dashboardData.avgRating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Avaliação Média</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="trophy" size={24} color="#E74C3C" />
                  </View>
                  <Text style={styles.statValue} numberOfLines={1}>Top</Text>
                  <Text style={styles.statLabel} numberOfLines={2}>{dashboardData.topProduct}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🕒 Atividade Recente</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/profile/producerOrderHistory')}
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
                <Ionicons name="arrow-forward" size={16} color="#6CC51D" />
              </TouchableOpacity>
            </View>

            <View style={styles.activityContainer}>
              {dashboardData.recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                    <Ionicons name={activity.icon as any} size={20} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6C757D",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#E74C3C",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#E74C3C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  
  // Profile Warning Banner
  profileWarningBanner: {
    backgroundColor: "#FFF9E6",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  warningIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFEBCC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#B8860B",
    marginBottom: 2,
  },
  warningText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#8B7355",
  },

  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#2C3E50",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6CC51D",
  },
  actionsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  actionItem: {
    alignItems: "center",
    width: 80,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#2C3E50",
    textAlign: "center",
    lineHeight: 16,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  banner: {
    backgroundColor: "#6CC51D",
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
  },
  bannerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  bannerBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  bannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  bannerImageContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
  },
  bannerCircle1: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  bannerCircle2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6C757D",
    textAlign: "center",
  },
  activityContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6C757D",
  },
});