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
  Animated,
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
      
      if (append) {
        setNotifications(prev => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
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
    // Verificar se a notificação é de um pedido finalizado
    const isOrderFinalized = notification.type === 'order_delivered' || 
                            (notification.data?.status === 'delivered');

    if (!isOrderFinalized) {
      Alert.alert(
        'Ação não permitida',
        'Você só pode excluir notificações de pedidos já finalizados.',
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
          onPress: () => deleteNotification(notification.id),
        },
      ]
    );
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        Alert.alert('Erro', 'Não foi possível excluir a notificação.');
      }
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
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
        return '#27AE60';
      case 'product':
        return '#E67E22';
      case 'promotion':
        return '#E74C3C';
      default:
        return '#95A5A6';
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
    const isOrderFinalized = item.type === 'order_delivered' || 
                           (item.data?.status === 'delivered');
    
    return (
      <Animated.View style={[
        styles.notificationCard,
        !item.read && styles.unreadCard
      ]}>
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* Icon */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) + '20' }
          ]}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={24} 
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

        {/* Delete button - Only for finalized orders */}
        {isOrderFinalized && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notificações</Text>
        
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
            <Text style={styles.markAllRead}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
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
              colors={['#6CC51D']}
              tintColor="#6CC51D"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptySubtitle}>
                Você receberá notificações sobre seus pedidos e produtos aqui.
              </Text>
            </View>
          }
          ListFooterComponent={() => (
            hasMore && notifications.length > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#6CC51D" />
                <Text style={styles.loadingMoreText}>Carregando mais...</Text>
              </View>
            ) : null
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  markAllRead: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#6CC51D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    borderColor: '#6CC51D',
    borderWidth: 1,
    backgroundColor: '#F8FFF8',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#1A1A1A',
  },
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#95A5A6',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6CC51D',
    marginLeft: 8,
    marginTop: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 8,
  },
});