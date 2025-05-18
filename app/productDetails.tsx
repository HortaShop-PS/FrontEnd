import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showSuccess, showError } from '../utils/alertService';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { checkIsFavorite, addToFavorites, removeFromFavorites } from '../utils/favoritesService';
import { getToken } from '../utils/authServices';
import { addToCart } from '../utils/cartService';

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
  const [cartLoading, setCartLoading] = useState(false);

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
        
        // Garantir que todos os campos estejam corretamente mapeados
        const mappedProduct = {
          ...data,
          // Garantir que os campos essenciais estejam presentes
          description: data.description || data.descricao || 'Descrição não disponível',
          weight: data.weight || data.peso || 'Peso não informado',
          rating: typeof data.rating === 'number' ? data.rating : 
                 (typeof data.avaliacao === 'number' ? data.avaliacao : 0),
          reviews: typeof data.reviews === 'number' ? data.reviews : 
                  (typeof data.avaliacoes === 'number' ? data.avaliacoes : 0)
        };
        
        setProduct(mappedProduct);

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

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setCartLoading(true);
      
      // Usar o serviço centralizado de carrinho
      await addToCart(product.id, quantity);
      showSuccess('Sucesso!', `${product.name} foi adicionado ao carrinho.`);
    } catch (error: any) {
      console.error('Erro ao adicionar ao carrinho:', error);
      showError('Erro', error.message || 'Não foi possível adicionar o produto ao carrinho.');
    } finally {
      setCartLoading(false);
    }
  };

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
  const renderStars = (rating = 0, total = 5) => {
    const stars = [];
    // Garantir que rating seja um número válido
    const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    const fullStars = Math.floor(validRating);
    const halfStar = validRating % 1 >= 0.5;

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
            <View style={{ flex: 1 }}>
              <View style={styles.nameAndBadgesContainer}>
                {product.isNew && (
                  <View style={[styles.badge, styles.newBadge]}>
                    <Text style={styles.badgeText}>NOVO</Text>
                  </View>
                )}
                {product.isFeatured && (
                  <View style={[styles.badge, styles.featuredBadge]}>
                    <Text style={styles.badgeText}>DESTAQUE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productWeight}>{product.weight || 'Peso não informado'}</Text>
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
              {renderStars(product.rating)}
            </View>
            <Text style={styles.reviewsText}>({product.reviews || 0} avaliações)</Text>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.productPrice}>
              R$ {product.price ? product.price.toFixed(2).replace('.', ',') : '0,00'}
            </Text>
            {product.unit && <Text style={styles.productUnit}> / {product.unit}</Text>}
          </View>

          <Text style={styles.productDescription}>
            {product.description}
          </Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantidade:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity style={styles.quantityButton} onPress={handleDecreaseQuantity}>
                <Ionicons name="remove-circle-outline" size={28} color="#6CC51D" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={handleIncreaseQuantity}>
                <Ionicons name="add-circle-outline" size={28} color="#6CC51D" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addToCartButton, cartLoading && styles.addToCartButtonDisabled]}
            onPress={handleAddToCart}
            disabled={cartLoading}
          >
            {cartLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addToCartButtonText}>Adicionar ao Carrinho</Text>
            )}
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
  nameAndBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: '#6CC51D',
  },
  featuredBadge: {
    backgroundColor: '#FFC107',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
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
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
  },
  productUnit: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 4,
  },
  productDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  quantityContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    padding: 12,
  },
  quantityValue: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    paddingHorizontal: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
