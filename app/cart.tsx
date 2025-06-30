import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { showAlert, showSuccess, showError, showWarning, showInfo } from '../utils/alertService';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getCart, addToCart, updateCartItemQuantity, removeCartItem, clearCart } from '../utils/cartService';

// Interface para o item do carrinho, baseada na estrutura esperada da API
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    unit?: string;
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
      console.error('Erro ao carregar cesta:', err);
      setError(err.message || 'Não foi possível carregar a cesta.');
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
      "Tem certeza que deseja remover este item da cesta?",
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

              showSuccess('Sucesso', 'Item removido da cesta.');
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
        <Text style={styles.loadingText}>Carregando cesta...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCart}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header modernizado (seguindo padrão do index.tsx) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Minha Cesta</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={80} color="#6CC51D" />
          </View>
          <Text style={styles.emptyTitle}>Sua cesta está vazia</Text>
          <Text style={styles.emptySubtitle}>Adicione produtos para começar suas compras</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/')}>
            <Text style={styles.shopButtonText}>Explorar Produtos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartCard}>
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
            <Ionicons name="close-circle" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.productPrice}>R$ {item.product.price.toFixed(2).replace('.', ',')}</Text>
        
        <View style={styles.bottomRow}>
          <View style={styles.quantityControl}>
            <TouchableOpacity 
              onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)} 
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)} 
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.itemTotalPrice}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header modernizado (seguindo padrão do index.tsx) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Minha Cesta</Text>
        </View>
        <TouchableOpacity onPress={() => {
          showAlert(
            "Limpar Cesta",
            "Tem certeza que deseja remover todos os itens da cesta?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Limpar",
                style: "destructive",
                onPress: async () => {
                  try {
                    await clearCart();
                    showSuccess('Sucesso', 'Cesta limpa com sucesso.');
                    fetchCart();
                  } catch (err: any) {
                    showError('Erro', err.message || 'Não foi possível limpar a cesta.');
                  }
                }
              }
            ],
            'warning'
          );
        }} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* Items Counter Card */}
      <View style={styles.counterCard}>
        <View style={styles.counterIconContainer}>
          <Ionicons name="basket" size={20} color="#6CC51D" />
        </View>
        <Text style={styles.counterText}>
          {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'} na cesta
        </Text>
      </View>

      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />

      {/* Footer Total and Checkout */}
      <View style={styles.footer}>
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>R$ {cart.total.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={[styles.totalRow, styles.finalTotalRow]}>
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
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  
  // Loading States (seguindo padrão do index.tsx)
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 12,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#FAFAFA",
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  
  // Header (seguindo padrão do index.tsx)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#6CC51D",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Counter Card (seguindo padrão do index.tsx)
  counterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  counterIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  counterText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#2C3E50",
  },
  
  // List Container
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 200, // Espaço para o footer
  },
  itemSeparator: {
    height: 16,
  },
  
  // Cart Cards (seguindo padrão do index.tsx)
  cartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    overflow: "hidden",
    marginRight: 16,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  
  // Item Content
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#2C3E50",
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  productPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 12,
  },
  
  // Bottom Row with Quantity and Total
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6CC51D",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityDisplay: {
    width: 48,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    marginHorizontal: 8,
    borderRadius: 16,
  },
  quantityText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#2C3E50",
  },
  itemTotalPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#6CC51D",
  },
  
  // Empty State (seguindo padrão do index.tsx)
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  shopButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  
  // Footer (seguindo padrão do index.tsx)
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    padding: 20,
  },
  totalCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  finalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#7F8C8D",
  },
  totalValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#2C3E50",
  },
  totalLabelFinal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#2C3E50",
  },
  totalValueFinal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#6CC51D",
  },
  checkoutButton: {
    backgroundColor: "#6CC51D",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  checkoutButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    marginRight: 8,
  },
});