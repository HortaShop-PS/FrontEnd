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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { notificationService, NotificationData } from '../../utils/notificationService';

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
        // Combinar notificações existentes com novas (sem filtro)
        const combined = [...notifications, ...newNotifications];
        setNotifications(combined);
      } else {
        // Definir notificações diretamente (sem filtro)
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
    // Pode excluir notificações de pedidos entregues
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

  // ✅ FUNÇÃO MELHORADA: Excluir notificação e todas as relacionadas
  const deleteNotificationAndRelated = async (notification: NotificationData) => {
    try {
      const orderId = notification.data?.orderId;
      
      if (!orderId) {
        console.warn('⚠️ Notificação sem orderId, excluindo apenas ela');
        const success = await notificationService.deleteNotification(notification.id);
        if (success) {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }
        return;
      }

      console.log(`🗑️ Iniciando exclusão de notificações para pedido ${orderId}`);
      
      // 1. Coletar todas as notificações relacionadas ao mesmo pedido
      const relatedNotifications = notifications.filter(n => 
        n.data?.orderId === orderId
      );
      
      console.log(`📋 Encontradas ${relatedNotifications.length} notificações relacionadas ao pedido ${orderId}`);
      
      // 2. Excluir todas as notificações relacionadas do backend
      const deletePromises = relatedNotifications.map(async (relatedNotif) => {
        try {
          const success = await notificationService.deleteNotification(relatedNotif.id);
          console.log(`${success ? '✅' : '❌'} Exclusão de notificação ${relatedNotif.type} (${relatedNotif.id}): ${success ? 'sucesso' : 'falhou'}`);
          return { id: relatedNotif.id, success };
        } catch (error) {
          console.error(`❌ Erro ao excluir notificação ${relatedNotif.id}:`, error);
          return { id: relatedNotif.id, success: false };
        }
      });
      
      const results = await Promise.all(deletePromises);
      
      // 3. Remover da lista local apenas as que foram excluídas com sucesso
      const successfullyDeletedIds = results
        .filter(result => result.success)
        .map(result => result.id);
      
      if (successfullyDeletedIds.length > 0) {
        setNotifications(prev => 
          prev.filter(n => !successfullyDeletedIds.includes(n.id))
        );
        
        console.log(`✅ ${successfullyDeletedIds.length} notificações removidas da lista local`);
      }
      
      // 4. Mostrar feedback ao usuário
      if (successfullyDeletedIds.length === relatedNotifications.length) {
        console.log(`✅ Todas as notificações do pedido ${orderId} foram excluídas com sucesso`);
      } else {
        console.warn(`⚠️ Algumas notificações não puderam ser excluídas`);
        Alert.alert('Aviso', 'Algumas notificações não puderam ser excluídas.');
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao excluir notificações:', error);
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
          {/* Icon */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(item.type) }
          ]}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={20} 
              color="#FFFFFF" 
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

        {/* Delete button - Only for delivered orders */}
        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - Flat UI Style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificações</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.8}>
            <Text style={styles.markAllRead}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27AE60" />
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
              colors={['#27AE60']}
              tintColor="#27AE60"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={80} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptySubtitle}>
                Você receberá notificações sobre seus pedidos aqui.
              </Text>
            </View>
          }
          ListFooterComponent={() => (
            hasMore && notifications.length > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#27AE60" />
                <Text style={styles.loadingMoreText}>Carregando mais...</Text>
              </View>
            ) : null
          )}
        />
      )}
    </View>
  );
}

// ...existing styles...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1', // Flat UI background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0, // Remove border for flat design
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#2C3E50',
  },
  markAllRead: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#27AE60',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 12,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 0, // Flat design - no rounded corners
    padding: 20,
    borderLeftWidth: 4, // Flat UI accent
    borderLeftColor: '#ECEFF1',
  },
  unreadCard: {
    borderLeftColor: '#27AE60',
    backgroundColor: '#F8FFF8',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 0, // Flat design - square icon container
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    width: 8,
    height: 8,
    borderRadius: 0, // Flat design - square dot
    backgroundColor: '#27AE60',
    marginLeft: 12,
    marginTop: 6,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 0, // Flat design
    backgroundColor: '#ECEFF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#2C3E50',
    marginTop: 20,
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