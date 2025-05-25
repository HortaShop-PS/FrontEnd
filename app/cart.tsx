import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { showAlert, showSuccess, showError, showWarning, showInfo } from '../utils/alertService';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getCart, addToCart, updateCartItemQuantity, removeCartItem, clearCart } from '../utils/cartService';

// Interface para o item do carrinho, baseada na estrutura esperada da API
interface CartItem {
  id: string; // ID do CartItem
  productId: string;
  quantity: number;
  price: number; // Preço total do item (produto.price * quantity)
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number; // Preço unitário do produto
  };
}

// Interface para a resposta do carrinho, baseada na estrutura esperada da API
interface CartResponse {
  id: string;
  userId: number;
  items: CartItem[];
  total: number;
}

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar o serviço centralizado de carrinho
      const data = await getCart();
      setCart(data);
    } catch (err: any) {
      console.error('Erro ao carregar carrinho:', err);
      setError(err.message || 'Não foi possível carregar o carrinho.');
      setCart({ id: '', userId: 0, items: [], total: 0 }); // Carrinho vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect para recarregar os dados quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const handleRemoveItem = async (cartItemId: string) => {
    showAlert(
      "Remover Item",
      "Tem certeza que deseja remover este item do carrinho?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              // Usar o serviço centralizado de carrinho
              await removeCartItem(cartItemId);

              // Atualiza o estado local removendo o item
              setCart(prevCart => {
                if (!prevCart) return null;

                const updatedItems = prevCart.items.filter(item => item.id !== cartItemId);

                // Recalcula o total do carrinho
                const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0);

                return { ...prevCart, items: updatedItems, total: newTotal };
              });

              showSuccess('Sucesso', 'Item removido do carrinho.');
            } catch (err: any) {
              showError('Erro', err.message || 'Não foi possível remover o item.');
            }
          }
        }
      ],
      'warning'
    );
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }
    try {
      // Usar o serviço centralizado de carrinho
      await updateCartItemQuantity(cartItemId, newQuantity);

      // Atualiza o estado local do carrinho
      setCart(prevCart => {
        if (!prevCart) return null;

        const updatedItems = prevCart.items.map(item => {
          if (item.id === cartItemId) {
            // Calcula o novo preço total para o item
            const newItemPrice = newQuantity * item.product.price;
            return { ...item, quantity: newQuantity, price: newItemPrice };
          }
          return item;
        });

        // Recalcula o total do carrinho
        const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0);

        return { ...prevCart, items: updatedItems, total: newTotal };
      });

      // showSuccess('Sucesso', 'Quantidade atualizada.'); // Opcional: mostrar um feedback de sucesso
    } catch (err: any) {
      showError('Erro', err.message || 'Não foi possível atualizar a quantidade.');
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCart}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Carrinho</Text>
          <View style={{ width: 24 }} />{/* Spacer */}
        </View>
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyCartText}>Seu carrinho está vazio.</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/')}>
            <Text style={styles.shopButtonText}>Começar a Comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItemContainer}>
      <Image 
        source={{ uri: `${API_BASE_URL}${item.product.imageUrl}` }}
        style={styles.productImage} 
        defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.productPrice}>R$ {item.product.price.toFixed(2).replace('.', ',')}</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)} style={styles.quantityButton}>
            <Ionicons name="remove-circle-outline" size={24} color="#6CC51D" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)} style={styles.quantityButton}>
            <Ionicons name="add-circle-outline" size={24} color="#6CC51D" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemActions}>
        <Text style={styles.itemTotalPrice}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
        <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Carrinho</Text>
        <View style={{ width: 24 }} />{/* Spacer */}
      </View>

      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalAmount}>R$ {cart.total.toFixed(2).replace('.', ',')}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.checkoutButton} onPress={() => {
              if (cart) {
                router.push({ pathname: '/payment', params: { orderId: cart.id, amount: cart.total, orderTotal: `R$ ${(cart.total / 100).toFixed(2)}` } });
              }
            }}>
            <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.clearCartButton]} 
            onPress={async () => {
              try {
                // Usar o serviço centralizado de carrinho
                await clearCart();
                showSuccess('Sucesso', 'Carrinho limpo com sucesso.');
                fetchCart(); // Recarrega o carrinho
              } catch (err: any) {
                showError('Erro', err.message || 'Não foi possível limpar o carrinho.');
              }
            }}
          >
            <Text style={styles.clearCartButtonText}>Limpar Carrinho</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Cor de fundo ajustada para harmonizar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyCartText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40, // Ajusta o padding superior para a status bar
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24, // Compensa a largura do botão de voltar
  },
  listContentContainer: {
    paddingBottom: 150, // Espaço para o footer fixo
  },
  cartItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 8,
  },
  removeButton: {
    padding: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalText: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  clearCartButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  clearCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 10,
  },
});
