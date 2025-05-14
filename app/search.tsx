import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, ScrollView, Switch, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { searchProducts } from '../utils/homeService';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams } from "expo-router";
import Config from 'react-native-config';


interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  isNew: boolean;
  isOrganic: boolean;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [isOrganic, setIsOrganic] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const params = useLocalSearchParams();
  const initialCategory = typeof params.category === 'string' ? params.category : undefined;

  const [category, setCategory] = useState<string | undefined>(initialCategory);


  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const handleSearchWithCategory = async (cat: string) => {
    try {
      setLoading(true);
      setError(null);
      setSearchPerformed(true);
  
      const searchParams = {
        category: cat,
        minPrice,
        maxPrice,
        isOrganic,
        limit: 20
      };
  
      const results = await searchProducts(searchParams);
      setProducts(results);
    } catch (error) {
      setError('Não foi possível realizar a busca. Tente novamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
      setSearchQuery(''); // Limpa busca por nome se quiser
      handleSearchWithCategory(initialCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory]);
  

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchPerformed(true);
  
      const searchParams = {
        name: searchQuery,
        category, // Inclua a categoria
        minPrice,
        maxPrice,
        isOrganic,
        limit: 20
      };
  
      const results = await searchProducts(searchParams);
      setProducts(results);
    } catch (error) {
      setError('Não foi possível realizar a busca. Tente novamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setMinPrice(0);
    setMaxPrice(100);
    setIsOrganic(false);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => router.push({
        pathname: '/productDetails',
        params: { id: item.id }
      })}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Novo</Text>
          </View>
        )}
        
        <Image 
          source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.imageUrl}` }} 
          style={styles.productImage} 
          resizeMode="cover" 
          defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.productPriceContainer}>
          <Text style={styles.productPrice}>
            R$ {item.price.toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.productUnit}>/{item.unit}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyResult = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
      <Text style={styles.emptySubtext}>Tente ajustar seus filtros ou buscar por outro termo</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buscar Produtos</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9E9E9E" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
            <Ionicons name="options-outline" size={22} color="#6CC51D" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtros</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetText}>Redefinir</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.priceRangeContainer}>
              <Text style={styles.filterLabel}>Faixa de Preço</Text>
              <View style={styles.priceValues}>
                <Text style={styles.priceText}>R$ {minPrice.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.priceText}>R$ {maxPrice.toFixed(2).replace('.', ',')}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={minPrice}
                onValueChange={setMinPrice}
                minimumTrackTintColor="#6CC51D"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#6CC51D"
              />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={maxPrice}
                onValueChange={setMaxPrice}
                minimumTrackTintColor="#6CC51D"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#6CC51D"
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.filterLabel}>Apenas Produtos Orgânicos</Text>
              <Switch
                trackColor={{ false: "#E0E0E0", true: "#AED581" }}
                thumbColor={isOrganic ? "#6CC51D" : "#f4f3f4"}
                ios_backgroundColor="#E0E0E0"
                onValueChange={setIsOrganic}
                value={isOrganic}
              />
            </View>
            
            <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6CC51D" />
            <Text style={styles.loadingText}>Buscando produtos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : searchPerformed ? (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            ListEmptyComponent={renderEmptyResult}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.initialStateContainer}>
            <Ionicons name="search" size={60} color="#E0E0E0" />
            <Text style={styles.initialStateText}>
              Busque por produtos ou use os filtros para encontrar o que precisa
            </Text>
          </View>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    margin: 20,
    padding: 15,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  resetText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6CC51D',
  },
  filterLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  priceRangeContainer: {
    marginBottom: 15,
  },
  priceValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priceText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666666',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  applyButton: {
    backgroundColor: '#6CC51D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  initialStateText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  productsGrid: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    maxWidth: '48%',
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: 'contain',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#6CC51D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  organicBadge: {
    top: 40,
    backgroundColor: '#FF9800',
  },
  newBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 12,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  productName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#6CC51D',
  },
  productUnit: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#999999',
    marginLeft: 2,
  },
  addToCartButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#6CC51D',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#666666',
    marginTop: 15,
  },
  emptySubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 5,
  },
});