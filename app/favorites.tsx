import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getUserFavorites, removeFromFavorites } from '../utils/favoritesService';

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
        Alert.alert('Sucesso', 'Produto removido dos favoritos!');
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      Alert.alert('Erro', 'Não foi possível remover o produto dos favoritos');
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
          source={{ uri: item.imageUrl }} 
          style={styles.produtoImagem} 
          resizeMode="cover" 
          defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
        />
      </View>
      <View style={styles.produtoInfo}>
        <Text style={styles.produtoNome} numberOfLines={1}>{item.name}</Text>
        <View style={styles.produtoPrecoContainer}>
          <Text style={styles.produtoPreco}>
            R$ {item.price.toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.produtoUnidade}>/{item.unit}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="heart-dislike" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyText}>Você ainda não tem favoritos</Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.browseButtonText}>Explorar produtos</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Favoritos</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  produtoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  produtoImageContainer: {
    position: "relative",
    height: 140,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  produtoImagem: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#6CC51D",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  newBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  produtoInfo: {
    padding: 12,
    position: "relative",
    backgroundColor: "#f5f5f5",
  },
  produtoNome: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333333",
    marginBottom: 6,
  },
  produtoPrecoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  produtoPreco: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#6CC51D",
  },
  produtoUnidade: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#999999",
    marginLeft: 2,
  },
  addToCartButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "#6CC51D",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  browseButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});