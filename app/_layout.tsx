import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AlertProvider from '../components/AlertProvider';
import FloatingCartButton from '../components/FloatingCartButton';

export default function RootLayout() {
  const [isUserProducer, setIsUserProducer] = useState<boolean | null>(null);
  const [isUserDelivery, setIsUserDelivery] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const deliveryToken = await SecureStore.getItemAsync('delivery_token');
        const hasSeenWelcome = await SecureStore.getItemAsync('hasSeenWelcome');
        
        if (!hasSeenWelcome && segments[0] !== 'welcome') {
          console.log('Redirecionando para tela de boas-vindas');
          router.replace('/welcome');
          return;
        }
        
        // Verificar se é entregador
        if (deliveryToken) {
          console.log('Token de entregador encontrado');
          setIsUserDelivery(true);
          setIsUserProducer(false);
          
          const authScreens = ['welcome2', 'login', 'loginDelivery', 'register', 'registerDelivery', 'registerproducer'];
          if (authScreens.includes(segments[0] || '')) {
            console.log('Entregador já autenticado, redirecionando para área de entrega');
            (router as any).replace('/(tabsDelivery)/');
            return;
          }
          
          const inDeliveryGroup = segments[0] === '(tabsDelivery)';
          if (!inDeliveryGroup && segments[0] !== 'deliveryDashboard' && segments[0] !== 'aboutDelivery' && segments[0] !== 'vehicleData' && segments[0] !== 'earnings' && segments[0] !== 'deliveryHistory') {
            console.log('Redirecionando entregador para área de entrega');
            (router as any).replace('/(tabsDelivery)/');
          }
          return;
        }
        
        if (!token) {
          console.log('Nenhum token encontrado, usuário não autenticado');
          setIsUserDelivery(false);
          return; 
        }
        
        const userType = await SecureStore.getItemAsync('userType');
        console.log('Tipo de usuário verificado:', userType);
        setIsUserProducer(userType === 'producer');
        setIsUserDelivery(false);

        const authScreens = ['welcome2', 'login', 'loginDelivery', 'register', 'registerDelivery', 'registerproducer'];
        if (authScreens.includes(segments[0] || '')) {
          console.log('Usuário já autenticado, redirecionando para a tela inicial');
          if (userType === 'producer') {
            router.replace('/(tabsProducers)');
          } else {
            router.replace('/(tabs)');
          }
          return;
        }

        const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(tabsProducers)';
        
        if (inAuthGroup) {
          if (userType === 'producer' && segments[0] !== '(tabsProducers)') {
            console.log('Redirecionando produtor para área de produtor');
            router.replace('/(tabsProducers)');
          } else if (userType !== 'producer' && segments[0] !== '(tabs)') {
            console.log('Redirecionando consumidor para área de consumidor');
            router.replace('/(tabs)');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar tipo de usuário:', error);
      }
    };

    checkUserType();
  }, [segments]);

  // Determinar se deve mostrar o botão flutuante do carrinho
  const shouldShowCartButton = () => {
    // Mostrar o botão apenas na tela inicial para usuários comuns
    // Verificar se estamos na tela inicial (tabs/index)
    const isHomeScreen = segments[0] === '(tabs)' && segments.length <= 1;
    
    // Não mostrar para produtores ou entregadores
    if (isUserProducer || isUserDelivery) return false;
    
    // Mostrar apenas na tela inicial
    return isHomeScreen;
  };

  return (
    <AlertProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} /> 
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="welcome2" options={{ headerShown: false }} /> 
        <Stack.Screen name="login" options={{ headerShown: false }} /> 
        <Stack.Screen name="loginDelivery" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} /> 
        <Stack.Screen name="registerDelivery" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabsProducers)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabsDelivery)" options={{ headerShown: false }} />
        <Stack.Screen name="deliveryDashboard" options={{ headerShown: false }} />
        <Stack.Screen name="registerproducer" options={{ headerShown: false }} /> 
        <Stack.Screen name='about' options={{headerShown: true, headerTitle: "Sobre mim", headerTitleAlign: "center", headerTitleStyle: {fontFamily: "Poppins_400Medium", fontSize: 18}}}/>
        <Stack.Screen name='aboutDelivery' options={{headerShown: true, headerTitle: "Perfil do Entregador", headerTitleAlign: "center", headerTitleStyle: {fontFamily: "Poppins_400Medium", fontSize: 18}}}/>
        <Stack.Screen name='deliveryHistory' options={{headerShown: false}}/>
        <Stack.Screen name='vehicleData' options={{headerShown: true, headerTitle: "Dados do Veículo", headerTitleAlign: "center", headerTitleStyle: {fontFamily: "Poppins_400Medium", fontSize: 18}}}/>
        <Stack.Screen name='earnings' options={{headerShown: true, headerTitle: "Meus Ganhos", headerTitleAlign: "center", headerTitleStyle: {fontFamily: "Poppins_600SemiBold", fontSize: 18}}}/>
        <Stack.Screen name='productDetails' options={{ headerShown: false }} />
        <Stack.Screen name='favorites' options={{ headerShown: false }} />
        <Stack.Screen name='registerProduct' options={{ headerShown: false }} />
        <Stack.Screen name='registerProductsCategories' options={{ headerShown: false }} />
        <Stack.Screen name='search' options={{ headerShown: false }} />
        <Stack.Screen name='cart' options={{ headerShown: false }} />
        <Stack.Screen name='cards' options={{ headerShown: false }} />
        <Stack.Screen name='addCard' options={{ headerShown: false }} />
        <Stack.Screen name='payment' options={{ headerShown: false }} />
        <Stack.Screen name='orderDetails/[id]' options={{ headerShown: false }} />
        <Stack.Screen name='profile/orderHistory' options={{ headerShown: true, headerTitle: "Histórico de Pedidos" }} />
        <Stack.Screen name='profile/producerOrderHistory' options={{ headerShown: true, headerTitle: "Histórico de Pedidos" }} />
        <Stack.Screen name='profile/myReviews' options={{ headerShown: false }} />
        <Stack.Screen name='productReviews/[productId]' options={{ headerShown: false }} />
        <Stack.Screen name='checkout' options={{ headerShown: false}} />
      </Stack>
      {shouldShowCartButton() && <FloatingCartButton />}
    </AlertProvider>
  );
}