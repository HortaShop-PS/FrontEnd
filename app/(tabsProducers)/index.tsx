import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import { fetchFeaturedProducts } from "../../utils/homeService";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Array de categorias
  const categorias = [
    { id: 1, nome: "Vegetais", icone: "leaf" },
    { id: 2, nome: "Frutas", icone: "nutrition" },
    { id: 3, nome: "Orgânicos", icone: "egg" },
    { id: 4, nome: "Laticínios", icone: "water" },
    { id: 5, nome: "Embutidos", icone: "basket" },
    { id: 6, nome: "Grãos", icone: "apps-outline" },
    { id: 7, nome: "Temperos", icone: "leaf-outline" },
    { id: 8, nome: "Bebidas", icone: "wine" },
    { id: 9, nome: "Doces", icone: "ice-cream" },
    { id: 10, nome: "Outros", icone: "ellipsis-horizontal" },
  ];


  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        const products = await fetchFeaturedProducts();
        setFeaturedProducts(products);
      } catch (error) {
        console.error("Erro ao carregar produtos em destaque:", error);
        setError("Não foi possível carregar os produtos em destaque");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>HortaShop</Text>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          {/* Barra de pesquisa */}
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9E9E9E" />
            <Text style={styles.searchText}>Pesquisar produtos</Text>
          </TouchableOpacity>
          
          {/* Seção de categorias */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registrar Produtos</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/registerProductsCategories')}
              >
                <Text style={styles.viewAllText}>Ver tudo</Text>
                <Ionicons name="chevron-forward" size={16} color="#6CC51D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoriasScrollContent}
            >
              {categorias.map((categoria) => (
                <TouchableOpacity key={categoria.id} style={styles.categoriaItem} onPress={() => setCategoriaSelecionada(categoria.nome)}>
                  <View style={styles.categoriaIcone}>
                    <Ionicons name={categoria.icone} size={22} color="#6CC51D" />
                  </View>
                  <Text style={styles.categoriaNome}>{categoria.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Banner promocional */}
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Registrar Promoções</Text>
                <Text style={styles.bannerSubtitle}>Quer cadastrar produtos em promoção?</Text>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Aqui</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bannerImageContainer}>
                {/* Aqui poderia ser adicionada uma imagem */}
              </View>
            </View>
          </View>
          
          {/* Seção de produtos em destaque */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedidos</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Ver tudo</Text>
                <Ionicons name="chevron-forward" size={16} color="#6CC51D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.produtosContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6CC51D" />
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.produtosGrid}>
                  {featuredProducts
                    .filter(produto => !categoriaSelecionada || produto.category === categoriaSelecionada)
                    .map((produto) => (
                      <TouchableOpacity 
                        key={produto.id} 
                        style={styles.produtoCard}
                        onPress={() => router.push({
                          pathname: '/productDetails',
                          params: { id: produto.id }
                        })}
                        activeOpacity={0.7}
                      >
                        <View style={styles.produtoImageContainer}>
                          {produto.isNew && (
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>Novo</Text>
                            </View>
                          )}
                          <Image 
                            source={{ uri: produto.imageUrl }} 
                            style={styles.produtoImagem} 
                            resizeMode="cover" 
                            defaultSource={require('../../assets/images/logo/hortaShop_sem_fundo.png')}
                          />
                        </View>
                        <View style={styles.produtoInfo}>
                          <Text style={styles.produtoNome} numberOfLines={1}>{produto.name}</Text>
                          <View style={styles.produtoPrecoContainer}>
                            <Text style={styles.produtoPreco}>
                              R$ {produto.price.toFixed(2).replace('.', ',')}
                            </Text>
                            <Text style={styles.produtoUnidade}>/{produto.unit}</Text>
                          </View>
                          <TouchableOpacity style={styles.addToCartButton}>
                            <Ionicons name="add" size={18} color="#FFFFFF" />
                          </TouchableOpacity>
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 1,
    paddingBottom: 15,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#6CC51D",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#9E9E9E",
    marginLeft: 10,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333333",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6CC51D",
    marginRight: 2,
  },
  categoriasScrollContent: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  categoriaItem: {
    alignItems: "center",
    marginHorizontal: 10,
    width: 70,
  },
  categoriaIcone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    
  },
  categoriaNome: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#333333",
    textAlign: "center",
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  banner: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 16,
    height: 140,
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
    justifyContent: "center",
  },
  bannerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333333",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#666666",
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: "#6CC51D",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  bannerImageContainer: {
    width: 100,
  },
  produtosContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 10,
  },
  produtosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  produtoCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
});
