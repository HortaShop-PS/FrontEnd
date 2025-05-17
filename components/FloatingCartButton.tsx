import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCart } from '../utils/cartService';

export default function FloatingCartButton() {
  const router = useRouter();
  const [itemCount, setItemCount] = useState(0);

  // Buscar a quantidade de itens no carrinho
  useEffect(() => {
    const fetchCartItemCount = async () => {
      try {
        const cart = await getCart();
        // Calcular o total de itens no carrinho
        const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
        setItemCount(totalItems);
      } catch (error) {
        console.error('Erro ao buscar itens do carrinho:', error);
      }
    };

    fetchCartItemCount();
    
    // Idealmente, implementaríamos um sistema de atualização em tempo real
    // ou um intervalo para atualizar periodicamente
    const interval = setInterval(fetchCartItemCount, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity 
      style={styles.floatingButton}
      onPress={() => router.push('/cart')}
      activeOpacity={0.8}
    >
      <Ionicons name="cart" size={24} color="#FFFFFF" />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 70, // Posicionado acima da tab bar
    right: 20,
    backgroundColor: '#6CC51D',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
