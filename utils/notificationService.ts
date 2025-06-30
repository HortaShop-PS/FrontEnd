import messaging from '@react-native-firebase/messaging';
import { getToken } from './authServices';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

import './notificationBackgroundHandler';

// ⚠️ IMPORTANTE: Configurar ANTES de qualquer outra coisa
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // ✅ Mostrar banner/heads-up
    shouldPlaySound: true,    // ✅ Tocar som
    shouldSetBadge: true,     // ✅ Atualizar badge
  }),
});

const resolvedApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!resolvedApiBaseUrl) {
  console.error("❌ API_BASE_URL não está definida. Verifique sua configuração .env");
}

// Interface para notificações
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type?: string;
  data?: any;
}

// Constantes para AuthorizationStatus (API v22)
const AUTHORIZATION_STATUS = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
} as const;

export const notificationService = {
  // Função para obter contagem de notificações não lidas
  async getUnreadCount(): Promise<number> {
    try {
      const token = await getToken();
      if (!token) {
        console.log('Token não encontrado para buscar notificações');
        return 0;
      }

      const response = await fetch(`${resolvedApiBaseUrl}/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Endpoint de contagem não encontrado, retornando 0');
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.log('Endpoint de notificações não implementado no backend ainda');
      return 0;
    }
  },

  // Obter todas as notificações do usuário
  async getUserNotifications(page: number = 1, limit: number = 20): Promise<any> {
    try {
      const token = await getToken();
      if (!token) {
        console.log('Token não encontrado para buscar notificações');
        return { notifications: [], total: 0, page: 1, totalPages: 0 };
      }

      const response = await fetch(`${resolvedApiBaseUrl}/notifications?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Endpoint de notificações não encontrado no backend');
        return { notifications: [], total: 0, page: 1, totalPages: 0 };
      }

      const data = await response.json();
      
      return {
        notifications: data.notifications || [],
        total: data.total || 0,
        page: data.page || page,
        totalPages: data.totalPages || 0
      };
    } catch (error) {
      console.log('Endpoint de notificações não implementado no backend ainda');
      return { notifications: [], total: 0, page: 1, totalPages: 0 };
    }
  },

  // Função para marcar notificação como lida
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) return false;

      const response = await fetch(`${resolvedApiBaseUrl}/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.log('Função de marcar como lida não implementada no backend ainda');
      return false;
    }
  },

  // FUNÇÃO CORRIGIDA: Marcar todas as notificações como lidas
  async markAllAsRead(): Promise<boolean> {
    try {
      console.log('🔄 [markAllAsRead] Iniciando função...');
      const token = await getToken();
      if (!token) {
        console.log('❌ [markAllAsRead] Token não encontrado');
        return false;
      }

      console.log('📤 [markAllAsRead] Fazendo requisição para marcar todas como lidas...');
      const response = await fetch(`${resolvedApiBaseUrl}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ [markAllAsRead] Todas as notificações marcadas como lidas');
        return true;
      } else {
        console.log('❌ [markAllAsRead] Erro ao marcar todas como lidas:', response.status);
        const errorText = await response.text();
        console.log('[markAllAsRead] Resposta do servidor:', errorText);
        return false;
      }
    } catch (error) {
      console.log('❌ [markAllAsRead] Erro de conexão:', error);
      return false;
    }
  },

  // ✅ FUNÇÃO CORRIGIDA: Listener de notificações recebidas
  addNotificationReceivedListener(callback: () => void) {
    try {
      console.log('🔧 Configurando listeners de notificação...');

      // Handler para FOREGROUND (app aberto) - Firebase
      const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
        console.log('📱 Notificação recebida em FOREGROUND:', remoteMessage);
        
        // ✅ CRIAR NOTIFICAÇÃO LOCAL PARA MOSTRAR BANNER
        if (remoteMessage.notification) {
          try {
            console.log('📢 Criando notificação local para foreground...');
            await Notifications.scheduleNotificationAsync({
              content: {
                title: remoteMessage.notification.title || 'Nova Notificação',
                body: remoteMessage.notification.body || '',
                data: remoteMessage.data || {},
                sound: true,
              },
              trigger: null, // Mostrar imediatamente
            });
            console.log('✅ Notificação local criada com sucesso');
          } catch (notifError) {
            console.error('❌ Erro ao criar notificação local:', notifError);
          }
        }
        
        callback();
      });

      // Handler para BACKGROUND (app em background, usuário toca na notificação)
      const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('👆 Notificação aberta (app estava em background):', remoteMessage);
        callback();
      });

      // ✅ ADICIONAR listener para notificações locais do Expo
      const expoSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('📱 Notificação Expo recebida:', notification);
        callback();
      });

      // ✅ ADICIONAR listener para quando usuário toca na notificação Expo
      const expoResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Resposta da notificação Expo:', response);
        callback();
      });

      console.log('✅ Todos os listeners configurados com sucesso');

      return {
        remove: () => {
          console.log('🧹 Removendo listeners de notificação...');
          unsubscribeForeground();
          unsubscribeBackground();
          expoSubscription.remove();
          expoResponseSubscription.remove();
        }
      };
    } catch (error) {
      console.error('❌ Erro ao adicionar listener de notificação:', error);
      return {
        remove: () => {}
      };
    }
  },

  // ✅ FUNÇÃO CORRIGIDA: Solicitar permissão de notificações
  async requestNotificationPermission(): Promise<boolean> {
    try {
      console.log('🔔 Solicitando permissão para notificações...');

      // ✅ PRIMEIRO: Solicitar permissão do Expo Notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      console.log('📱 Status permissão Expo Notifications:', finalStatus);

      if (Platform.OS === 'android') {
        // Para Android 13+ (API 33+), usar PermissionsAndroid
        if (Platform.Version >= 33) {
          console.log('📱 Android 13+ - Solicitando permissão POST_NOTIFICATIONS');
          
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Permissão para Notificações',
              message: 'O HortaShop precisa da sua permissão para enviar notificações sobre seus pedidos e promoções.',
              buttonNeutral: 'Perguntar depois',
              buttonNegative: 'Negar',
              buttonPositive: 'Permitir',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('✅ Permissão Android 13+ concedida');
          } else {
            console.log('❌ Permissão Android 13+ negada');
            return false;
          }
        }

        // ✅ SEGUNDO: Solicitar permissão do Firebase Messaging
        const authorizationStatus = await messaging().requestPermission();
        const firebaseEnabled = authorizationStatus === AUTHORIZATION_STATUS.AUTHORIZED;
        
        console.log('📱 Status permissão Firebase:', firebaseEnabled);
        return firebaseEnabled && finalStatus === 'granted';
        
      } else {
        // Para iOS
        const authorizationStatus = await messaging().requestPermission();
        const firebaseEnabled = authorizationStatus === AUTHORIZATION_STATUS.AUTHORIZED || 
                        authorizationStatus === AUTHORIZATION_STATUS.PROVISIONAL;

        console.log('📱 Status permissão iOS Firebase:', firebaseEnabled);
        return firebaseEnabled && finalStatus === 'granted';
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return false;
    }
  },

  // ✅ FUNÇÃO CORRIGIDA: Verificar permissões existentes
  async checkNotificationPermissions(): Promise<boolean> {
    try {
      console.log('🔍 Verificando permissões de notificação...');
      
      // ✅ PRIMEIRO: Verificar permissão do Expo
      const { status: expoStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Status permissão Expo:', expoStatus);
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          // Android 13+
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('📱 Status permissão Android 13+:', granted);
        }

        // ✅ SEGUNDO: Verificar permissão do Firebase
        const authorizationStatus = await messaging().hasPermission();
        const firebaseHasPermission = authorizationStatus === AUTHORIZATION_STATUS.AUTHORIZED;
        console.log('📱 Status permissão Firebase Android:', firebaseHasPermission);
        
        return firebaseHasPermission && expoStatus === 'granted';
      } else {
        // iOS
        const authorizationStatus = await messaging().hasPermission();
        const firebaseHasPermission = authorizationStatus === AUTHORIZATION_STATUS.AUTHORIZED || 
                             authorizationStatus === AUTHORIZATION_STATUS.PROVISIONAL;
        console.log('📱 Status permissão Firebase iOS:', firebaseHasPermission);
        
        return firebaseHasPermission && expoStatus === 'granted';
      }
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return false;
    }
  },

  // ✅ FUNÇÃO CORRIGIDA: Inicializar Firebase FCM
  async initializeNotifications(): Promise<boolean> {
    try {
      console.log('🚀 Inicializando Firebase FCM...');
      
      // 1. Verificar se já tem permissão
      const hasPermission = await this.checkNotificationPermissions();
      
      if (!hasPermission) {
        console.log('🔔 Permissão não concedida, solicitando...');
        const granted = await this.requestNotificationPermission();
        
        if (!granted) {
          console.log('❌ Usuário negou permissão para notificações');
          return false;
        }
      } else {
        console.log('✅ Permissão já concedida anteriormente');
      }

      // 2. Verificar se há uma notificação que abriu o app (quando estava fechado)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('🚀 App foi aberto por uma notificação (estava fechado):', initialNotification);
        if (initialNotification.data?.type === 'order_update') {
          console.log('📋 Redirecionando para detalhes do pedido:', initialNotification.data.orderId);
        }
      }

      // ✅ 3. Configurar canal de notificação para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'HortaShop Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7ABC00',
          sound: 'default',
        });
        console.log('✅ Canal de notificação Android configurado');
      }

      console.log('✅ Firebase FCM inicializado com sucesso');
      console.log('✅ Background message handler já configurado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase FCM:', error);
      return false;
    }
  },

  // Registrar token FCM (API v22 CORRIGIDA)
  async reRegisterToken() {
    try {
      console.log('🔄 Re-registrando token FCM...');
      
      const fcmToken = await messaging().getToken();
      
      if (!fcmToken) {
        console.log('❌ Não foi possível obter token FCM');
        return null;
      }

      console.log('🔥 TOKEN FCM COMPLETO PARA DEBUG:', fcmToken);
      console.log('📱 Token FCM obtido:', fcmToken.substring(0, 50) + '...');
      
      const authToken = await getToken();
      if (authToken && resolvedApiBaseUrl) {
        try {
          const response = await fetch(`${resolvedApiBaseUrl}/notifications/register-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: fcmToken,
              platform: Platform.OS
            })
          });

          if (response.ok) {
            console.log('✅ Token FCM enviado para o backend com sucesso');
          } else {
            const errorText = await response.text();
            console.log('❌ Erro ao registrar token no backend:', response.status);
            console.log('Resposta:', errorText);
          }
        } catch (error) {
          console.log('❌ Erro de conexão ao registrar token:', error);
        }
      }

      console.log('✅ Token de notificação re-registrado com sucesso');
      return fcmToken;
    } catch (error) {
      console.error('❌ Erro ao obter token FCM:', error);
      return null;
    }
  },

  // Função para lidar com tokens atualizados (API v22)
  onTokenRefresh(callback: (token: string) => void) {
    try {
      return messaging().onTokenRefresh(callback);
    } catch (error) {
      console.error('Erro ao configurar listener de token refresh:', error);
      return () => {};
    }
  },

  // FUNÇÃO: Deletar notificação
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) return false;

      const response = await fetch(`${resolvedApiBaseUrl}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Notificação deletada com sucesso');
        return true;
      } else {
        console.log('❌ Erro ao deletar notificação:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Erro de conexão ao deletar notificação:', error);
      return false;
    }
  },

  // FUNÇÃO: Limpar todas as notificações
  async clearAllNotifications(): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) return false;

      const response = await fetch(`${resolvedApiBaseUrl}/notifications/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Todas as notificações foram limpas');
        return true;
      } else {
        console.log('❌ Erro ao limpar todas as notificações:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Erro de conexão ao limpar notificações:', error);
      return false;
    }
  }
  
};

// DEBUG: Verificar se a função está sendo exportada corretamente
console.log('🔍 [DEBUG] notificationService.markAllAsRead:', typeof notificationService.markAllAsRead);

