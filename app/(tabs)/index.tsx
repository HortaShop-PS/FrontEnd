import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import { fetchFeaturedProducts } from "../../utils/homeService";

export default function Index() {
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
  });

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Array de categorias
  const categorias = [
    { id: 1, nome: "Vegetais", icone: "leaf" },
    { id: 2, nome: "Frutos", icone: "nutrition" },
    { id: 3, nome: "Bebidas", icone: "beer" },
    { id: 4, nome: "Mercado", icone: "basket" },
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
    <ScrollView style={styles.mainContainer}>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons style={styles.searchText}
            name="search"
            size={24}
          />
          <Text style={styles.searchText}>Pesquisar palavras chaves</Text>
          <Ionicons style={styles.searchText}
            name="menu"
            size={24}
          />
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.categoria}>
            <Text style={styles.categoriaText}>Categorias</Text>
            <Ionicons style={styles.searchText}
              name="chevron-forward"
              size={24}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasContainer}>
            {categorias.map((categoria) => (
              <TouchableOpacity key={categoria.id} style={styles.categoriaItem}>
                <View style={styles.categoriaIcone}>
                  <Ionicons name={categoria.icone} size={24} color="#4CAF50" />
                </View>
                <Text style={styles.categoriaNome}>{categoria.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.categoria}>
            <Text style={styles.categoriaText}>Produtos em destaque</Text>
            <Ionicons style={styles.searchText}
              name="chevron-forward"
              size={24}
            />
          </View>
          <View style={styles.produtosContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#6CC51D" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featuredProducts.map((produto) => (
                  <TouchableOpacity key={produto.id} style={styles.produtoCard}>
                    {produto.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>Novo</Text>
                      </View>
                    )}
                    <Image 
                      source={require('../../assets/images/logo/hortaShop_sem_fundo.png')} 
                      style={styles.produtoImagem} 
                      resizeMode="cover" 
                    />
                    <View style={styles.produtoInfo}>
                      <Text style={styles.produtoNome}>{produto.name}</Text>
                      <View style={styles.produtoPrecoContainer}>
                        <Text style={styles.produtoPreco}>
                          R$ {produto.price.toFixed(2).replace('.', ',')}
                        </Text>
                        <Text style={styles.produtoUnidade}>/{produto.unit}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const SPACING = 13;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    alignItems: "center",
    flexDirection: "column",
    paddingVertical: SPACING,
  },
  searchBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: SPACING * 4,
    padding: SPACING,
    borderRadius: 5,
    backgroundColor: "#F4F5F9",
    width: "90%",
  },
  searchText: {
    color: "gray",
    fontFamily: "Poppins_400Regular",
    marginHorizontal: SPACING,
  },
  sectionContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: SPACING * 2,
  },
  categoria: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  categoriaText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  categoriasContainer: {
    marginTop: SPACING,
    paddingHorizontal: SPACING,
    width: "100%",
  },
  categoriaItem: {
    alignItems: "center",
    marginRight: SPACING * 2,
  },
  categoriaIcone: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING / 2,
  },
  categoriaNome: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  produtosContainer: {
    width: "90%",
    marginTop: SPACING,
  },
  produtoCard: {
    width: 150,
    marginRight: SPACING,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  produtoImagem: {
    width: '80%',
    height: 100,
    borderRadius: 5,
  },
  produtoInfo: {
    padding: SPACING,
  },
  produtoNome: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  produtoPrecoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  produtoPreco: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#6CC51D',
  },
  produtoUnidade: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    color: '#FF6B6B',
    textAlign: 'center',
    padding: SPACING,
  }
});
