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
  Alert
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
      <View style={styles.productHeader}>
        <Image 
          source={{ 
            uri: item.imageUrl ? 
              (item.imageUrl.startsWith('http') ? item.imageUrl : `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.imageUrl}`) :
              undefined
          }}
          style={styles.productImage}
          defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
        />
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
            <Text style={styles.stockText}>Estoque: {item.stock || 0}</Text>
            {item.isOrganic && (
              <View style={styles.organicBadge}>
                <Text style={styles.organicText}>Orgânico</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/editProduct/${item.id}`)}
        >
          <Ionicons name="pencil" size={16} color="#6CC51D" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item.id, item.name)}
        >
          <Ionicons name="trash" size={16} color="#FF6B6B" />
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Meus Produtos",
          headerShown: true,
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#333",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/registerProduct')}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#6CC51D" />
            </TouchableOpacity>
          ),
        }}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadProducts()}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
          <Text style={styles.emptySubtitle}>
            Comece adicionando seus primeiros produtos para venda
          </Text>
          <TouchableOpacity 
            style={styles.addFirstProductButton}
            onPress={() => router.push('/registerProduct')}
          >
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
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    lineHeight: 22,
  },
  productCategory: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  productUnit: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    marginLeft: 2,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  organicBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  organicText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
  productActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  deleteButton: {},
  editButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
  deleteButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FF6B6B',
  },
  addButton: {
    marginRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  addFirstProductButton: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstProductText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});