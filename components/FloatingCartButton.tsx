import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCart } from '../utils/cartService';

export default function FloatingCartButton() {
  const router = useRouter();
  const [itemCount, setItemCount] = useState(0);
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Buscar a quantidade de itens no carrinho
  useEffect(() => {
    const fetchCartItemCount = async () => {
      try {
        const cart = await getCart();
        // Calcular o total de itens no carrinho
        const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
        setItemCount(totalItems);
        
        // Animação de pulso quando há novos itens
        if (totalItems > 0) {
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch (error) {
        console.error('Erro ao buscar itens do carrinho:', error);
        setItemCount(0);
      }
    };

    fetchCartItemCount();
    
    // Atualizar periodicamente
    const interval = setInterval(fetchCartItemCount, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Não mostrar o botão se não há itens
  if (itemCount === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {/* Badge com contador - FORA do botão circular */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {itemCount > 99 ? '99+' : itemCount.toString()}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/cart')}
        activeOpacity={0.8}
      >
        {/* Ícone do carrinho */}
        <View style={styles.iconContainer}>
          <Ionicons name="basket" size={24} color="#FFFFFF" />
        </View>
        
        {/* Indicador visual adicional */}
        <View style={styles.ripple} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Posicionado acima da tab bar
    right: 20,
    zIndex: 999,
    // Adicionando espaço extra para o badge
    paddingTop: 8,
    paddingRight: 8,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6CC51D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    position: 'relative',
    // Removendo overflow: 'hidden' para permitir que o badge apareça fora
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0, // Agora fica na parte superior do container
    right: 0, // Agora fica na parte direita do container
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1000, // Garantir que fique acima do botão
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});