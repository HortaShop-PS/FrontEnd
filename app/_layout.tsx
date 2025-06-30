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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
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

  // useEffect que executa apenas uma vez quando o app estiver pronto
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Evitar múltiplas execuções
      if (hasCheckedAuth) return;
      
      try {
        const token = await getToken();
        
        if (token) {
          console.log('✅ Token encontrado, verificando tipo de usuário...');
          const userType = await getUserType();
          
          if (userType === 'producer') {
            setIsUserProducer(true);
            
            // Redirecionar apenas se não estiver já na área correta
            if (!segments.includes('(tabsProducers)')) {
              console.log('📍 Redirecionando para área de produtores...');
              router.replace('/(tabsProducers)');
            }
          } else {
            setIsUserProducer(false);
            
            // Redirecionar apenas se não estiver já na área correta
            if (!segments.includes('(tabs)')) {
              console.log('📍 Redirecionando para área de consumidores...');
              router.replace('/(tabs)');
            }
          }
          
          // Re-registrar token FCM quando autenticado
          try {
            await notificationService.reRegisterToken();
          } catch (error) {
            console.error('Erro ao re-registrar token FCM:', error);
          }
        } else {
          console.log('❌ Token não encontrado, usuário não autenticado');
          setIsUserProducer(null);
          
          // Redirecionar para welcome apenas se não estiver já lá
          if (!segments.includes('welcome') && !segments.includes('login') && !segments.includes('register')) {
            console.log('📍 Redirecionando para tela de boas-vindas...');
            router.replace('/welcome');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsUserProducer(null);
        
        // Em caso de erro, redirecionar para welcome
        if (!segments.includes('welcome')) {
          router.replace('/welcome');
        }
      }
      
      setHasCheckedAuth(true);
    };

    // Só verificar se o app estiver pronto e as fontes carregadas
    if (appIsReady && fontsLoaded) {
      checkAuthAndRedirect();
    }
  }, [appIsReady, fontsLoaded, hasCheckedAuth, segments, router]);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  return (
    <AlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="welcome2" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="registerproducer" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(tabsProducers)" />
        <Stack.Screen name="productDetails" />
        <Stack.Screen name="registerProduct" />
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
      </Stack>
      
      {/* Mostrar botão flutuante apenas para consumidores autenticados */}
      {isUserProducer === false && <FloatingCartButton />}
    </AlertProvider>
  );
}
