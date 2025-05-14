import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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
  description: string;
  rating?: number;
  reviews?: number;
  weight?: string;
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

  // Renderizar estrelas de avaliação
  const renderStars = (rating = 4.5, total = 5) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`star-${i}`} name="star" size={16} color="#FFD700" />
      );
    }
    
    if (halfStar) {
      stars.push(
        <Ionicons key="star-half" name="star-half" size={16} color="#FFD700" />
      );
    }
    
    const emptyStars = total - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`star-empty-${i}`} name="star-outline" size={16} color="#FFD700" />
      );
    }
    
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${product.imageUrl}` }}  
            style={styles.productImage} 
            resizeMode="cover"
            defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
          />
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.productHeader}>
            <View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productWeight}>{product.weight || '700 g'}</Text>
            </View>
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
                  color={isFavorite ? "#FF6B6B" : "#999"} 
                />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(product.rating || 4.5)}
            </View>
            <Text style={styles.reviewsText}>({product.reviews || 89} avaliações)</Text>
          </View>
          
          <Text style={styles.productDescription}>
            {product.description || 'Descrição não encontrada'}
          </Text>
          
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantidade</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={[styles.quantityButton, styles.quantityButtonMinus]} 
                onPress={handleDecreaseQuantity}
              >
                <Ionicons name="remove" size={20} color="#6CC51D" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity 
                style={[styles.quantityButton, styles.quantityButtonPlus]} 
                onPress={handleIncreaseQuantity}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartText}>Adicionar no carrinho</Text>
            <Ionicons name="cart-outline" size={20} color="#FFF" style={styles.cartIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
    fontSize: 16,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#333333',
  },
  productWeight: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 5,
  },
  reviewsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#888888',
  },
  productDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
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
    marginBottom: 30,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonMinus: {
    backgroundColor: '#F0F0F0',
  },
  quantityButtonPlus: {
    backgroundColor: '#6CC51D',
  },
  quantityValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
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
    marginLeft: 10,
  },
  addToCartText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});