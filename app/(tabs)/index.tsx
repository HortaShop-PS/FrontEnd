import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import { fetchFeaturedProducts, fetchAllProducts, Product } from "../../utils/homeService";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Categorias atualizadas
  const categorias = [
    { id: 1, nome: "Vegetais", icone: "leaf-outline", categoria: "Vegetais" },
    { id: 2, nome: "Frutas", icone: "nutrition-outline", categoria: "Frutas" },
    { id: 3, nome: "Orgânicos", icone: "flower-outline", categoria: "Orgânicos" },
  ];

  const getFullImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
    return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const loadFeaturedProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const products = await fetchFeaturedProducts();
      setFeaturedProducts(products);
      setError(null);
    } catch (error) {
      console.error("Erro ao carregar produtos em destaque:", error);
      if (!isRefresh) {
        setError("Não foi possível carregar os produtos em destaque");
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadAllProducts = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoadingAll(true);
      }
      const products = await fetchAllProducts();
      setAllProducts(products);
      setErrorAll(null);
    } catch (error) {
      console.error("Erro ao carregar todos os produtos:", error);
      if (!isRefresh) {
        setErrorAll("Não foi possível carregar os produtos");
      }
    } finally {
      if (!isRefresh) {
        setLoadingAll(false);
      }
    }
  };

  const onRefresh = () => {
    loadFeaturedProducts(true);
    loadAllProducts(true);
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadFeaturedProducts(),
        loadAllProducts()
      ]);
    };
    loadData();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6CC51D" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.mainContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6CC51D']}
            tintColor="#6CC51D"
          />
        }
      >
        <View style={styles.container}>
          {/* Cabeçalho modernizado */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>HortaShop</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#6CC51D" />
            </TouchableOpacity>
          </View>

          {/* Barra de pesquisa modernizada */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('/search')}
          >
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color="#6CC51D" />
            </View>
            <Text style={styles.searchText}>O que você está procurando?</Text>
            <View style={styles.filterButton}>
              <Ionicons name="options-outline" size={18} color="#6CC51D" />
            </View>
          </TouchableOpacity>

          {/* Seção de categorias modernizada */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() =>
                  router.push({
                    pathname: '/search',
                    params: { category: 'todas' }
                  })
                }
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
                <Ionicons name="arrow-forward" size={16} color="#6CC51D" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriasScrollContent}
            >
              {categorias.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  style={styles.categoriaItem}
                  onPress={() =>
                    router.push({
                      pathname: '/search',
                      params: { category: categoria.categoria }
                    })
                  }
                >
                  <View style={styles.categoriaIcone}>
                    <Ionicons name={categoria.icone as any} size={26} color="#6CC51D" />
                  </View>
                  <Text style={styles.categoriaNome}>{categoria.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Banner promocional modernizado */}
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                {/*<View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>OFERTA ESPECIAL</Text>
                </View>*/}
                <Text style={styles.bannerTitle}>Produtos Frescos{'\n'}Direto do Campo</Text>
                <Text style={styles.bannerSubtitle}>Entrega rápida • Qualidade garantida</Text>
                {/*<TouchableOpacity style={styles.bannerButton}>
                   <Text style={styles.bannerButtonText}>Comprar agora</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>*/}
              </View>
              <View style={styles.bannerImageContainer}>
                <View style={styles.bannerCircle1} />
                <View style={styles.bannerCircle2} />
                <Ionicons name="leaf" size={60} color="rgba(108, 197, 29, 0.3)" />
              </View>
            </View>
          </View>

          {/* Seção de todos os produtos modernizada */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛒 Todos os Produtos</Text>
            </View>

            <View style={styles.produtosContainer}>
              {loadingAll ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6CC51D" />
                  <Text style={styles.loadingText}>Carregando produtos...</Text>
                </View>
              ) : errorAll ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
                  <Text style={styles.errorText}>{errorAll}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => loadAllProducts()}>
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.produtosGrid}>
                  {allProducts.map((produto) => (
                    <TouchableOpacity
                      key={produto.id}
                      style={styles.produtoCard}
                      onPress={() => router.push({
                        pathname: '/productDetails',
                        params: { id: produto.id }
                      })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.produtoImageContainer}>
                        {produto.isNew && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>NOVO</Text>
                          </View>
                        )}
                        <Image
                          source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${produto.imageUrl}` }}
                          style={styles.produtoImagem}
                          resizeMode="cover"
                          defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
                        />
                        {/*<TouchableOpacity style={styles.favoriteButtonSmall}>
                          <Ionicons name="heart-outline" size={16} color="#E74C3C" />
                        </TouchableOpacity>*/}
                      </View>
                      <View style={styles.produtoInfo}>
                        <Text style={styles.produtoNome} numberOfLines={2}>{produto.name}</Text>
                        <View style={styles.produtoPrecoContainer}>
                          <Text style={styles.produtoPreco}>
                            R$ {produto.price.toFixed(2).replace('.', ',')}
                          </Text>
                          <Text style={styles.produtoUnidade}>/{produto.unit}</Text>
                        </View>
                        {/* 
                        <TouchableOpacity style={styles.addToCartButton}>
                          <Ionicons name="add" size={18} color="#FFFFFF" />
                        </TouchableOpacity>*/}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  // Header modernizado
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FAFAFA"
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#6CC51D",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#E74C3C",
    borderRadius: 4,
  },
  // Barra de pesquisa modernizada
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#7F8C8D",
    flex: 1,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#2C3E50",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  viewAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6CC51D",
    marginRight: 4,
  },
  // Categorias modernizadas
  categoriasScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  categoriaItem: {
    alignItems: "center",
    marginRight: 20,
    width: 80,
  },
  categoriaIcone: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  categoriaNome: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#2C3E50",
    textAlign: "center",
  },
  // Banner modernizado
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  banner: {
    flexDirection: "row",
    backgroundColor: "#6CC51D",
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    overflow: "hidden",
    position: "relative",
  },
  bannerContent: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 2,
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  bannerBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    lineHeight: 28,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  bannerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6CC51D",
  },
  bannerImageContainer: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bannerCircle1: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: 10,
  },
  bannerCircle2: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    bottom: 20,
    right: 10,
  },
  // Produtos em destaque modernizados
  featuredScrollContent: {
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  featuredImageContainer: {
    position: "relative",
    height: 140,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredImagem: {
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
  featuredInfo: {
    padding: 16,
    position: "relative",
  },
  featuredNome: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 8,
  },
  featuredPrecoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  featuredPreco: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#6CC51D",
  },
  featuredUnidade: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 4,
  },
  featuredAddButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6CC51D",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  // Produtos gerais modernizados
  produtosContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 12,
  },
  errorContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  produtosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  produtoCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
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
  favoriteButtonSmall: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
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
    marginBottom: 6,
    lineHeight: 20,
  },
  produtoPrecoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
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
    marginLeft: 4,
  },
  addToCartButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6CC51D",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});