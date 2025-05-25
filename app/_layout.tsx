import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AlertProvider from '../components/AlertProvider';
import FloatingCartButton from '../components/FloatingCartButton';

export default function RootLayout() {
  const [isUserProducer, setIsUserProducer] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const hasSeenWelcome = await SecureStore.getItemAsync('hasSeenWelcome');
        
        if (!hasSeenWelcome && segments[0] !== 'welcome') {
          console.log('Redirecionando para tela de boas-vindas');
          router.replace('/welcome');
          return;
        }
        
        if (!token) {
          console.log('Nenhum token encontrado, usuário não autenticado');
          return; 
        }
        
        const userType = await SecureStore.getItemAsync('userType');
        console.log('Tipo de usuário verificado:', userType);
        setIsUserProducer(userType === 'producer');

        const authScreens = ['welcome2', 'login', 'register', 'registerproducer'];
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
    
    // Não mostrar para produtores
    if (isUserProducer) return false;
    
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
        <Stack.Screen name="register" options={{ headerShown: false }} /> 
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabsProducers)" options={{ headerShown: false }} />
        <Stack.Screen name="registerproducer" options={{ headerShown: false }} /> 
        <Stack.Screen name='about' options={{headerShown: true, headerTitle: "Sobre mim", headerTitleAlign: "center", headerTitleStyle: {fontFamily: "Poppins_400Medium", fontSize: 18}}}/>
        <Stack.Screen name='productDetails' options={{ headerShown: false }} />
        <Stack.Screen name='favorites' options={{ headerShown: false }} />
        <Stack.Screen name='registerProduct' options={{ headerShown: false }} />
        <Stack.Screen name='registerProductsCategories' options={{ headerShown: false }} />
        <Stack.Screen name='search' options={{ headerShown: false }} />
        <Stack.Screen name='cart' options={{ headerShown: false }} />
        <Stack.Screen name='cards' options={{ headerShown: false }} />
        <Stack.Screen name='addCard' options={{ headerShown: false }} />
        <Stack.Screen name='payment' options={{ headerShown: false }} />
      </Stack>
      {shouldShowCartButton() && <FloatingCartButton />}
    </AlertProvider>
  );
}
