import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        // Aguardar um pouco para garantir que tudo está carregado
        await new Promise(resolve => setTimeout(resolve, 100));

        const hasSeenWelcome = await SecureStore.getItemAsync('hasSeenWelcome');
        const userToken = await SecureStore.getItemAsync('userToken');

        console.log('🔍 Verificação inicial:', { hasSeenWelcome, hasToken: !!userToken });

        if (!hasSeenWelcome) {
          // Primeira vez abrindo o app - mostrar welcome
          console.log('📍 Primeira vez - indo para welcome');
          router.replace('/welcome');
        } else if (userToken) {
          // Já viu welcome e tem token - verificar tipo de usuário
          try {
            const userType = await SecureStore.getItemAsync('userType');
            console.log('📍 Usuário logado:', userType);
            if (userType === 'producer') {
              router.replace('/(tabsProducers)');
            } else {
              router.replace('/(tabs)');
            }
          } catch (error) {
            console.error('Erro ao verificar tipo de usuário:', error);
            router.replace('/welcome2');
          }
        } else {
          // Já viu welcome mas não tem token - ir para autenticação
          console.log('📍 Sem token - indo para welcome2');
          router.replace('/welcome2');
        }
      } catch (error) {
        console.error('Erro ao verificar rota inicial:', error);
        router.replace('/welcome');
      }
    };

    checkInitialRoute();
  }, []);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#7ABC00' 
    }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}