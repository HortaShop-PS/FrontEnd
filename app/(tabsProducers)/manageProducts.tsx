import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getProducerProducts, deleteProduct, ProductResponse } from '../../utils/registerProductService';
import { showAlert, showSuccess, showError } from '../../utils/alertService';

export default function ManageProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await getProducerProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const handleDeleteProduct = (productId: string, productName: string) => {
    showAlert(
      "Excluir Produto",
      `Tem certeza que deseja excluir "${productName}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(productId);
              setProducts(prev => prev.filter(p => p.id !== productId));
              showSuccess('Sucesso', 'Produto excluído com sucesso');
            } catch (err) {
              showError('Erro', err instanceof Error ? err.message : 'Erro ao excluir produto');
            }
          }
        }
      ],
      'warning'
    );
  };

  const renderProduct = ({ item }: { item: ProductResponse }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.isOrganic && (
          <View style={styles.organicBadge}>
            <Text style={styles.organicBadgeText}>ORGÂNICO</Text>
          </View>
        )}
        <Image 
          source={{ 
            uri: item.imageUrl ? 
              (item.imageUrl.startsWith('http') ? item.imageUrl : `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.imageUrl}`) :
              undefined
          }}
          style={styles.productImage}
          resizeMode="cover"
          defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
        />
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>
            R$ {item.price.toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.productUnit}>/{item.unit}</Text>
        </View>
        
        <View style={styles.stockContainer}>
          <View style={styles.stockBadge}>
            <Ionicons name="cube-outline" size={14} color="#6CC51D" />
            <Text style={styles.stockText}>Estoque: {item.stock || 0}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/editProduct/${item.id}`)}
        >
          <Ionicons name="pencil" size={18} color="#6CC51D" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item.id, item.name)}
        >
          <Ionicons name="trash" size={18} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Stack.Screen
        options={{
          title: "Meus Produtos",
          headerShown: true,
          headerStyle: { backgroundColor: "#FAFAFA" },
          headerTintColor: "#2C3E50",
          headerTitleStyle: { 
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18
          },
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/registerProduct')}
              style={styles.headerAddButton}
            >
              <Ionicons name="add" size={24} color="#6CC51D" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Header da tela */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🛍️ Gerenciar Produtos</Text>
            <Text style={styles.headerSubtitle}>
              {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addProductButton}
            onPress={() => router.push('/registerProduct')}
          >
            <View style={styles.addButtonIcon}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.addButtonText}>Novo Produto</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6CC51D" />
            <Text style={styles.loadingText}>Carregando produtos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
            </View>
            <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadProducts()}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="basket-outline" size={64} color="#BDC3C7" />
            </View>
            <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Comece adicionando seus primeiros produtos para venda
            </Text>
            <TouchableOpacity 
              style={styles.addFirstProductButton}
              onPress={() => router.push('/registerProduct')}
            >
              <View style={styles.addFirstIcon}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.addFirstProductText}>Adicionar Primeiro Produto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadProducts(true)}
                colors={['#6CC51D']}
                tintColor="#6CC51D"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#2C3E50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6CC51D',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  addButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    paddingHorizontal: 40,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addFirstProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6CC51D',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addFirstIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addFirstProductText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  organicBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#6CC51D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  organicBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: 16,
    paddingRight: 60,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    lineHeight: 22,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  productUnit: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginLeft: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
    marginLeft: 4,
  },
  actionsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});