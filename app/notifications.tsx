import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { notificationService, NotificationData } from '../utils/notificationService';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await notificationService.getUserNotifications(pageNum, 20);
      
      let newNotifications = response.notifications;
      
      if (append) {
        const combined = [...notifications, ...newNotifications];
        setNotifications(combined);
      } else {
        setNotifications(newNotifications);
      }
      
      setHasMore(response.notifications.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1, true);
    }
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navegar conforme o tipo da notificação
    switch (notification.type) {
      case 'order':
      case 'order_shipped':
      case 'order_delivered':
        if (notification.data?.orderId) {
          router.push(`/orderDetails/${notification.data.orderId}`);
        }
        break;
      case 'product':
        if (notification.data?.productId) {
          router.push(`/productDetails?id=${notification.data.productId}`);
        }
        break;
      default:
        Alert.alert(notification.title, notification.body);
    }
  };

  const handleDeleteNotification = (notification: NotificationData) => {
    const canDelete = notification.type === 'order_delivered' || 
                     (notification.data?.status === 'delivered');

    if (!canDelete) {
      Alert.alert(
        'Ação não permitida',
        'Você só pode excluir notificações de pedidos já entregues.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    Alert.alert(
      'Excluir Notificação',
      'Tem certeza que deseja excluir esta notificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteNotificationAndRelated(notification),
        },
      ]
    );
  };

  const deleteNotificationAndRelated = async (notification: NotificationData) => {
    try {
      const orderId = notification.data?.orderId;
      
      if (!orderId) {
        const success = await notificationService.deleteNotification(notification.id);
        if (success) {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }
        return;
      }

      const relatedNotifications = notifications.filter(n => 
        n.data?.orderId === orderId
      );
      
      const deletePromises = relatedNotifications.map(async (relatedNotif) => {
        try {
          const success = await notificationService.deleteNotification(relatedNotif.id);
          return { id: relatedNotif.id, success };
        } catch (error) {
          return { id: relatedNotif.id, success: false };
        }
      });
      
      const results = await Promise.all(deletePromises);
      
      const successfullyDeletedIds = results
        .filter(result => result.success)
        .map(result => result.id);
      
      if (successfullyDeletedIds.length > 0) {
        setNotifications(prev => 
          prev.filter(n => !successfullyDeletedIds.includes(n.id))
        );
      }
      
    } catch (error) {
      console.error('Erro ao excluir notificações:', error);
      Alert.alert('Erro', 'Não foi possível excluir a notificação.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'bag-outline';
      case 'order_shipped':
        return 'airplane-outline';
      case 'order_delivered':
        return 'checkmark-circle-outline';
      case 'product':
        return 'pricetag-outline';
      case 'promotion':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#3498DB';
      case 'order_shipped':
        return '#9B59B6';
      case 'order_delivered':
        return '#2ECC71';
      case 'product':
        return '#E67E22';
      case 'promotion':
        return '#E74C3C';
      default:
        return '#7F8C8D';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Agora há pouco';
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderNotification = ({ item }: { item: NotificationData }) => {
    const canDelete = item.type === 'order_delivered' || 
                     (item.data?.status === 'delivered');
    
    return (
      <View style={[
        styles.notificationCard,
        !item.read && styles.unreadCard
      ]}>
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.8}
        >
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={20} 
              color={getNotificationColor(item.type)} 
            />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              !item.read && styles.unreadTitle
            ]}>
              {item.title}
            </Text>
            
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
            
            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Unread indicator */}
          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>

        {/* Delete button */}
        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header modernizado (igual ao index.tsx) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>Suas Atualizações 🔔</Text>
          <Text style={styles.headerTitle}>Notificações</Text>
        </View>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Container */}
      <View style={styles.mainContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2ECC71" />
            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#2ECC71']}
                tintColor="#2ECC71"
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="notifications-off-outline" size={64} color="#2ECC71" />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                <Text style={styles.emptySubtitle}>
                  Você receberá notificações sobre seus pedidos aqui.
                </Text>
              </View>
            }
            ListFooterComponent={() => (
              hasMore && notifications.length > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#2ECC71" />
                  <Text style={styles.loadingMoreText}>Carregando mais...</Text>
                </View>
              ) : null
            )}
          />
        )}
      </View>
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
  
  // Header modernizado (igual ao index.tsx)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2ECC71",
  },
  markAllButton: {
    backgroundColor: "#E8F8F5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  markAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#2ECC71",
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 12,
  },
  
  // List Container
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  
  // Notification Cards (seguindo o padrão do index.tsx)
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    flexDirection: "row",
    overflow: "hidden",
  },
  unreadCard: {
    borderColor: "#2ECC71",
    backgroundColor: "#F8FFF8",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  
  // Icon Container (seguindo o padrão do index.tsx)
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  
  // Text Content
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#2C3E50",
    marginBottom: 4,
  },
  unreadTitle: {
    color: "#1A1A1A",
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#95A5A6",
  },
  
  // Unread indicator
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
    alignSelf: "flex-start",
    marginTop: 8,
    marginRight: 16,
  },
  
  // Delete Button
  deleteButton: {
    width: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  
  // Empty State (seguindo o padrão do index.tsx)
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#2C3E50",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Loading More
  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 8,
  },
});