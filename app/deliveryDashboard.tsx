import { useEffect } from "react"
import { useRouter } from "expo-router"
import { View, Text, StyleSheet, ActivityIndicator } from "react-native"
import deliveryAuthService from '../utils/deliveryAuthService';

export default function DeliveryDashboard() {
  const router = useRouter()

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])

  const checkAuthAndRedirect = async () => {
    try {
      const isAuthenticated = await deliveryAuthService.isAuthenticated()
      
      if (isAuthenticated) {
        // Redireciona para a estrutura de tabs do entregador
        router.replace("/(tabDelivery)/" as any)
      } else {
        // Se não estiver autenticado, volta para o login
        router.replace("/loginDelivery")
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      router.replace("/loginDelivery")
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7ABC00" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
})