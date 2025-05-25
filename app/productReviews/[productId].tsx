import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import reviewService, { ProductReviews, Review } from '../../utils/reviewService';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function ProductReviewsScreen() {
  const [productReviews, setProductReviews] = useState<ProductReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (productId) {
      loadProductReviews();
    }
  }, [productId]);

  const loadProductReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getProductReviews(productId!);
      setProductReviews(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar avaliações. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#FFD700' : '#CCCCCC'}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderRatingDistribution = () => {
    if (!productReviews) return null;

    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = productReviews.reviews.filter(review => review.rating === rating).length;
      const percentage = productReviews.totalReviews > 0 ? (count / productReviews.totalReviews) * 100 : 0;
      return { rating, count, percentage };
    });

    return (
      <View style={styles.distributionContainer}>
        {distribution.map(({ rating, count, percentage }) => (
          <View key={rating} style={styles.distributionRow}>
            <Text style={styles.distributionRating}>{rating}</Text>
            <Ionicons name="star" size={12} color="#FFD700" />
            <View style={styles.distributionBarContainer}>
              <View style={[styles.distributionBar, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.distributionCount}>({count})</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#666666" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
        </View>
      </View>
      
      {item.comment && (
        <Text style={styles.commentText}>{item.comment}</Text>
      )}
    </View>
  );

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
        <TouchableOpacity style={styles.retryButton} onPress={loadProductReviews}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!productReviews) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Produto não encontrado</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliações do Produto</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={productReviews.reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.summaryCard}>
              <Text style={styles.productName}>{productReviews.productName}</Text>
              
              <View style={styles.overallRating}>
                <View style={styles.ratingDisplay}>
                  <Text style={styles.averageRating}>
                    {productReviews.averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.starsAndCount}>
                    {renderStars(Math.round(productReviews.averageRating))}
                    <Text style={styles.totalReviews}>
                      ({productReviews.totalReviews} avaliações)
                    </Text>
                  </View>
                </View>
                
                {renderRatingDistribution()}
              </View>
            </View>

            {productReviews.reviews.length > 0 && (
              <Text style={styles.reviewsListTitle}>Todas as Avaliações</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>Nenhuma avaliação ainda</Text>
            <Text style={styles.emptySubtext}>
              Seja o primeiro a avaliar este produto
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  listContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  productName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ratingDisplay: {
    alignItems: 'center',
    marginRight: 24,
  },
  averageRating: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#333333',
    marginBottom: 4,
  },
  starsAndCount: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  totalReviews: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666666',
  },
  distributionContainer: {
    flex: 1,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distributionRating: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666666',
    width: 12,
    marginRight: 4,
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  distributionCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#666666',
    width: 24,
    textAlign: 'right',
  },
  reviewsListTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  reviewDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#999999',
  },
  ratingContainer: {
    marginLeft: 12,
  },
  commentText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});