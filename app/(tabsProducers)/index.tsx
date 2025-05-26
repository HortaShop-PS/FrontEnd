import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const router = useRouter();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

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
{/*
          {/* Barra de pesquisa 
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9E9E9E" />
            <Text style={styles.searchText}>Pesquisar produtos</Text>
          </TouchableOpacity>
          */}
          {/* Seção de categorias */}{/*
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

          {/* Seção de Pedidos Em Andamento */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedidos Em Andamento</Text>
            </View>
            {/* Conteúdo de pedidos em andamento pode ser adicionado aqui */}
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
});
