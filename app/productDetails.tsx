import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { checkIsFavorite, addToFavorites, removeFromFavorites } from '../utils/favoritesService';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  isNew: boolean;
  isFeatured: boolean;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar detalhes do produto: ${response.status}`);
        }
        
        const data = await response.json();
        setProduct(data);
        
        // Verificar se o produto está nos favoritos
        const favoriteStatus = await checkIsFavorite(data.id);
        setIsFavorite(favoriteStatus);
      } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
        setError('Não foi possível carregar os detalhes do produto');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        const success = await removeFromFavorites(product.id);
        if (success) {
          setIsFavorite(false);
          
        }
      } else {
        const success = await addToFavorites(product.id);
        if (success) {
          setIsFavorite(true);
          
        }
      }
    } catch (error) {
      console.error('Erro ao gerenciar favoritos:', error);
      
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Produto não encontrado'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator size="small" color="#6CC51D" />
            ) : (
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#FF6B6B" : "#333"} 
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.imageUrl }} 
            style={styles.productImage} 
            resizeMode="contain"
            defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
          />
        </View>

        {product.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Novo</Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>R$ {product.price.toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.unit}>/{product.unit}</Text>
          </View>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantidade:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity style={styles.quantityButton} onPress={handleDecreaseQuantity}>
                <Ionicons name="remove" size={20} color="#6CC51D" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={handleIncreaseQuantity}>
                <Ionicons name="add" size={20} color="#6CC51D" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>
              R$ {(product.price * quantity).toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <TouchableOpacity style={styles.addToCartButton}>
            <Ionicons name="cart-outline" size={20} color="#FFF" style={styles.cartIcon} />
            <Text style={styles.addToCartText}>Adicionar ao Carrinho</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  backButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
    fontSize: 16,
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    marginVertical: 20,
  },
  productImage: {
    width: '80%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: 100,
    right: 30,
    backgroundColor: '#6CC51D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  detailsContainer: {
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 50,
  },
  productName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#333333',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#6CC51D',
  },
  unit: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#888888',
    marginLeft: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#F0F8F0',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginHorizontal: 15,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  totalLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  totalPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#6CC51D',
  },
  addToCartButton: {
    backgroundColor: '#6CC51D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  cartIcon: {
    marginRight: 10,
  },
  addToCartText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});