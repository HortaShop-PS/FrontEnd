import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkInitialRoute();
  }, []);

  const checkInitialRoute = async () => {
    try {
      // Aguardar um pouco para garantir que tudo está carregado
      await new Promise(resolve => setTimeout(resolve, 500));

      const hasSeenWelcome = await SecureStore.getItemAsync('hasSeenWelcome');
      const userToken = await SecureStore.getItemAsync('userToken');

      if (!hasSeenWelcome) {
        router.replace('/welcome');
      } else if (userToken) {
        try {
          const userType = await SecureStore.getItemAsync('userType');
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
        router.replace('/welcome2');
      }
    } catch (error) {
      console.error('Erro ao verificar rota inicial:', error);
      // Em caso de erro, vai para welcome
      router.replace('/welcome');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
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

  return null;
}