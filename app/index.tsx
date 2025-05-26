import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        
        if (token) {

          const userType = await SecureStore.getItemAsync('userType');
          if (userType === 'producer') {
            router.replace('/(tabsProducers)');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/welcome2');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.replace('/welcome2');
      }
    };

    checkAuthentication();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6CC51D" />
    </View>
  );
}