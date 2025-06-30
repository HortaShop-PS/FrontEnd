import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar, SafeAreaView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showError } from '../utils/alertService';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getUserFavorites, removeFromFavorites } from '../utils/favoritesService';
import Config from 'react-native-config';

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
      activeOpacity={0.7}
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
          defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
        />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="heart" size={16} color="#E74C3C" />
        </TouchableOpacity>
      </View>
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome} numberOfLines={2}>{item.name}</Text>
        <View style={styles.produtoPrecoContainer}>
          <Text style={styles.produtoPreco}>
            R$ {item.price.toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.produtoUnidade}>/{item.unit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={64} color="#6CC51D" />
      </View>
      <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
      <Text style={styles.emptyText}>
        Adicione produtos aos seus favoritos para encontrá-los facilmente aqui
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="search" size={20} color="#FFFFFF" />
        <Text style={styles.browseButtonText}>Explorar Produtos</Text>
      </TouchableOpacity>
    </View>
  );

  if (!fontsLoaded || (loading && !refreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
        <Text style={styles.loadingText}>Carregando favoritos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header seguindo padrão flat UI */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Meus Favoritos</Text>
        </View>
        <View style={styles.headerRight}>
          {favorites.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{favorites.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Container */}
      <View style={styles.mainContainer}>
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6CC51D']}
              tintColor="#6CC51D"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
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
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
  },

  // Header seguindo padrão flat UI
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#6CC51D',
  },
  countBadge: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#6CC51D',
  },

  // List Container
  listContainer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Product Cards seguindo padrão flat UI
  produtoCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    marginRight: "6%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  produtoImageContainer: {
    position: "relative",
    height: 140,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  produtoImagem: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  newBadge: {
    position: "absolute",
    top: 12,
    left: 12,
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
  },
  produtoNome: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#2C3E50",
    marginBottom: 8,
    lineHeight: 20,
  },
  produtoPrecoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  produtoPreco: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#6CC51D",
  },
  produtoUnidade: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 4,
  },

  // Empty State seguindo padrão do index.tsx
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6CC51D',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  browseButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});