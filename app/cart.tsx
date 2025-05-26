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
        <Text style={styles.loadingText}>Carregando carrinho...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
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
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIcon}>
            <Ionicons name="cart-outline" size={80} color="#BDC3C7" />
          </View>
          <Text style={styles.emptyCartTitle}>Seu carrinho está vazio</Text>
          <Text style={styles.emptyCartSubtitle}>Adicione produtos para começar suas compras</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/')}>
            <Text style={styles.shopButtonText}>Explorar Produtos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItemContainer}>
      <View style={styles.productImageContainer}>
        <Image 
          source={{ uri: `${API_BASE_URL}${item.product.imageUrl}` }}
          style={styles.productImage} 
          defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
        />
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
          <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
            <Ionicons name="close" size={20} color="#95A5A6" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.productPrice}>R$ {item.product.price.toFixed(2).replace('.', ',')}</Text>
        
        <View style={styles.bottomRow}>
          <View style={styles.quantityControl}>
            <TouchableOpacity 
              onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)} 
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)} 
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.itemTotalPrice}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
        </View>
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
        <TouchableOpacity onPress={() => {
          showAlert(
            "Limpar Carrinho",
            "Tem certeza que deseja remover todos os itens do carrinho?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Limpar",
                style: "destructive",
                onPress: async () => {
                  try {
                    await clearCart();
                    showSuccess('Sucesso', 'Carrinho limpo com sucesso.');
                    fetchCart();
                  } catch (err: any) {
                    showError('Erro', err.message || 'Não foi possível limpar o carrinho.');
                  }
                }
              }
            ],
            'warning'
          );
        }}>
          <Ionicons name="trash-outline" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      <View style={styles.itemsCounter}>
        <Text style={styles.itemsCounterText}>
          {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'} no carrinho
        </Text>
      </View>

      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />

      <View style={styles.footer}>
        <View style={styles.totalSummary}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>R$ {cart.total.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalValueFinal}>R$ {cart.total.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={() => {
            if (cart) {
              router.push('/checkout');
            }
          }}
        >
          <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Poppins_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
    padding: 24,
  },
  emptyCartIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 16,
    paddingHorizontal: 32,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  itemsCounter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  itemsCounterText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  listContentContainer: {
    padding: 20,
    paddingBottom: 200,
  },
  itemSeparator: {
    height: 16,
  },
  cartItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6CC51D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    width: 48,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 8,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  itemTotalPrice: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    padding: 20,
  },
  totalSummary: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  totalLabelFinal: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  totalValueFinal: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  checkoutButton: {
    backgroundColor: '#6CC51D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    marginRight: 8,
  },
});
