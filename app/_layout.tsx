import { Stack, useSegments, useRouter } from "expo-router";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { getToken, getUserType } from "../utils/authServices";
import { notificationService } from "../utils/notificationService";

// IMPORTANTE: Importar o background handler o mais cedo possível
import '../utils/notificationBackgroundHandler';

import AlertProvider from '../components/AlertProvider';
import FloatingCartButton from '../components/FloatingCartButton';

// Evitar que a splash screen desapareça automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isUserProducer, setIsUserProducer] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🚀 Inicializando sistema de notificações...');
        await notificationService.initializeNotifications();
        console.log('✅ Sistema de notificações inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar notificações (não crítico):', error);
      }
    };

    initializeNotifications();
  }, []);

  // useEffect simplificado - apenas para definir o tipo de usuário
  useEffect(() => {
    const checkUserType = async () => {
      // Só fazer isso se estiver numa área autenticada
      if (segments.includes('(tabs)') || segments.includes('(tabsProducers)')) {
        try {
          const token = await getToken();
          if (token) {
            const userType = await getUserType();
            setIsUserProducer(userType === 'producer');
            
            // Re-registrar token FCM quando autenticado
            try {
              await notificationService.reRegisterToken();
            } catch (error) {
              console.error('Erro ao re-registrar token FCM:', error);
            }
          } else {
            setIsUserProducer(null);
          }
        } catch (error) {
          console.error('Erro ao verificar tipo de usuário:', error);
          setIsUserProducer(null);
        }
      }
    };

    if (appIsReady && fontsLoaded) {
      checkUserType();
    }
  }, [appIsReady, fontsLoaded, segments]);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  // Determinar se deve mostrar o botão flutuante do carrinho
  // Apenas para consumidores autenticados e apenas na tela home (index)
  const shouldShowFloatingCartButton = () => {
    if (isUserProducer !== false) return false; // Não é consumidor
    
    // Verificar se está na tela home dos consumidores
    const isOnConsumerHome = segments.includes('(tabs)') && 
                            (segments[segments.length - 1] === 'index' || 
                             (segments.length === 1 && segments[0] === '(tabs)'));
    
    return isOnConsumerHome;
  };

  return (
    <AlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="welcome2" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="registerproducer" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(tabsProducers)" />
        <Stack.Screen name="productDetails" />
        <Stack.Screen name="registerProduct" />
        <Stack.Screen name="(tabsDelivery)" />
        <Stack.Screen name="loginDelivery" />
        <Stack.Screen name="registerDelivery" />
        <Stack.Screen name="deliveryDashboard" />
        <Stack.Screen name="deliveryHistory" />
        <Stack.Screen name="aboutDelivery" />
        <Stack.Screen name="vehicleData" />
        <Stack.Screen name="earnings" />
        <Stack.Screen name="orderDetailsDelivery/[id]" />
        <Stack.Screen name="registerProductsCategories" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="addCard" />
        <Stack.Screen name="cards" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="search" />
        <Stack.Screen name="about" />
        <Stack.Screen name="loadingIndicator" />
        <Stack.Screen name="editProduct/[id]" />
        <Stack.Screen name="orderDetails/[id]" />
        <Stack.Screen name="productReviews/[productId]" />
        <Stack.Screen name="profile/editProfile" />
        <Stack.Screen name="profile/editPhone" />
        <Stack.Screen name="profile/editAddress" />
        <Stack.Screen name="profile/changePassword" />
        <Stack.Screen name="profile/orderHistory" />
        <Stack.Screen name="addresses/index" />
        <Stack.Screen name="addresses/[id]" />
        <Stack.Screen name="addresses/new" />
      </Stack>
      
      {/* Botão flutuante do carrinho - apenas para consumidores na home */}
      {shouldShowFloatingCartButton() && <FloatingCartButton />}
    </AlertProvider>
  );
}
