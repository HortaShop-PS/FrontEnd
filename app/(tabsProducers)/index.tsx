import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar, Button } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { Link, useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { isProfileComplete, ProducerProfile } from './utils/profileValidationService'; 
import React from "react";

export default function Index() {
  const router = useRouter();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [profileIsIncomplete, setProfileIsIncomplete] = useState(false);
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

  // Usar useFocusEffect para carregar o perfil quando a tela estiver em foco
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        console.log("Fetching profile data as screen is focused...");
        // Substitua esta lógica pela forma como você carrega os dados do perfil do produtor
        // Exemplo:
        // const userProfileData = await getProducerProfileFromAPI();
        // ou buscar do SecureStore se você salvou lá após completar o perfil
        let userProfileData: ProducerProfile | null = null;

        // Tente carregar do SecureStore (exemplo, ajuste conforme sua lógica de persistência)
        try {
          const storedProfileString = await SecureStore.getItemAsync('producerProfile');
          if (storedProfileString) {
            userProfileData = JSON.parse(storedProfileString);
          }
        } catch (e) {
          console.error("Failed to load profile from secure store", e);
        }

        // Se não houver dados no SecureStore, use o mock ou sua lógica de API
        if (!userProfileData) {
          userProfileData = {
            name: 'João Produtor',
            farmName: 'Fazenda Feliz',
            city: '', // Mantenha um estado inicial que possa ser incompleto
            phoneNumber: '123456789',
          };
          // Opcional: Salvar o perfil mock no SecureStore se for a primeira vez
          // await SecureStore.setItemAsync('producerProfile', JSON.stringify(userProfileData));
        }

        setProfile(userProfileData);
        if (userProfileData) {
          setProfileIsIncomplete(!isProfileComplete(userProfileData));
        } else {
          setProfileIsIncomplete(true); // Se não há perfil, considera-se incompleto
        }
      };

      fetchProfile();

      return () => {
        // Opcional: Ações de limpeza se a tela perder o foco, se necessário
        // console.log("Screen is unfocused. Profile fetch cleanup (if any).");
      };
    }, []) // As dependências do useCallback podem incluir funções ou valores que fetchProfile usa de fora
  );

  const handleCompleteProfile = () => {
    router.push('/(tabsProducers)/complete-profile');
  };

  if (!profile && !fontsLoaded) { // Ajuste a condição de carregamento se necessário
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }
  
  if (!fontsLoaded) { // Se as fontes ainda não carregaram mas o perfil sim
    return (
      <View style={styles.container}>
        <Text>Carregando fontes...</Text>
      </View>
    );
  }

  if (!profile) { // Se o perfil ainda não carregou mas as fontes sim
    return (
      <View style={styles.container}>
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

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
                <Text style={styles.bannerTitle}>Gerenciar Produtos</Text>
                <Text style={styles.bannerSubtitle}>Visualize e edite seus produtos cadastrados</Text>
                <TouchableOpacity 
                  style={styles.bannerButton}
                  onPress={() => router.push('/manageProducts')}
                >
                  <Text style={styles.bannerButtonText}>Acessar</Text>
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

          <Text style={styles.title}>Perfil do Produtor</Text>
          {/* Exiba os dados do perfil aqui */}
          <Text>Nome: {profile.name}</Text>
          <Text>Fazenda: {profile.farmName}</Text>
          <Text>Cidade: {profile.city || 'Não informado'}</Text>
          <Text>Telefone: {profile.phoneNumber || 'Não informado'}</Text>

          {profileIsIncomplete && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>Seu perfil está incompleto!</Text>
              <Button title="Completar Perfil" onPress={handleCompleteProfile} />
            </View>
          )}

          {/* ... restante do conteúdo da tela de perfil ... */}
          <Link href={"/settings" as any} style={styles.link}>Ir para Configurações (Exemplo)</Link>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  warningContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
  },
  warningText: {
    color: '#856404',
    marginBottom: 10,
    fontSize: 16,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    color: 'blue',
  },
});