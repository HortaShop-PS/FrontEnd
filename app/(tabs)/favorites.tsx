import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar, SafeAreaView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showError } from '../../utils/alertService';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getUserFavorites, removeFromFavorites } from '../../utils/favoritesService';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  isNew: boolean;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getUserFavorites();
      
      if (response && response.products) {
        setFavorites(response.products);
      } else {
        setFavorites([]);
      }
      
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setError('Não foi possível carregar seus produtos favoritos');
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      const success = await removeFromFavorites(productId);
      if (success) {
        setFavorites(prevFavorites => 
          prevFavorites.filter(item => item.id !== productId)
        );
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      showError('Erro', 'Não foi possível remover o produto dos favoritos');
    }
  };

  const navigateToProductDetails = (productId: string) => {
    router.push({
      pathname: '/productDetails',
      params: { id: productId }
    });
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteProduct }) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.produtoCard}
      onPress={() => navigateToProductDetails(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.produtoImageContainer}>
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Novo</Text>
          </View>
        )}
        <Image 
          source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.imageUrl}` }}
          style={styles.produtoImagem} 
          resizeMode="cover" 
          defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
        />
      </View>
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome} numberOfLines={2}>{item.name}</Text>
        <View style={styles.produtoPrecoContainer}>
          <Text style={styles.produtoPreco}>
            R$ {item.price.toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.produtoUnidade}>/{item.unit}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFavorite(item.id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={18} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={64} color="#6CC51D" />
      </View>
      <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
      <Text style={styles.emptySubtitle}>
        Explore nossos produtos e adicione seus favoritos tocando no ❤️
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.8}
      >
        <Text style={styles.browseButtonText}>Explorar Produtos</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.header}>
          <Text style={styles.headerGreeting}>Seus</Text>
          <Text style={styles.headerTitle}>Favoritos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
          <Text style={styles.loadingText}>Carregando favoritos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Header seguindo padrão do design system */}
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>Seus</Text>
        <Text style={styles.headerTitle}>Favoritos</Text>
      </View>

      {/* Stats Card - Total de favoritos */}
      {favorites.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statsIconContainer}>
            <Ionicons name="heart" size={20} color="#6CC51D" />
          </View>
          <Text style={styles.statsText}>
            {favorites.length} {favorites.length === 1 ? 'produto favorito' : 'produtos favoritos'}
          </Text>
        </View>
      )}

      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && { flex: 1 }
        ]}
        columnWrapperStyle={favorites.length > 0 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6CC51D']}
            tintColor="#6CC51D"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 12,
  },
  
  // Header seguindo padrão estabelecido no design system
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FAFAFA",
  },
  headerGreeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
  },

  // Stats Card seguindo padrão do design system
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#2C3E50",
    flex: 1,
  },

  // Lista
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Cards dos produtos seguindo padrão estabelecido
  produtoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  produtoImageContainer: {
    position: "relative",
    height: 140,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  produtoImagem: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E74C3C",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  newBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  produtoInfo: {
    padding: 16,
    position: "relative",
  },
  produtoNome: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 8,
    lineHeight: 18,
  },
  produtoPrecoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  produtoPreco: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#6CC51D",
  },
  produtoUnidade: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  // Empty State seguindo padrão do design system
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#6CC51D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  browseButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});