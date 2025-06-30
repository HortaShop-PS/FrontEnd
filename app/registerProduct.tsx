import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity 
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import ProductForm from '../components/ProductForm';
import { registerProduct, ProductData } from '../utils/registerProductService';
import { showSuccess } from '../utils/alertService';

export default function RegisterProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const handleSubmit = async (productData: ProductData) => {
    setLoading(true);
    try {
      await registerProduct(productData);
      showSuccess("Sucesso", "Produto cadastrado com sucesso!");
      router.back();
    } catch (error) {
      throw error; // O erro será tratado pelo ProductForm
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {/* Header customizado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#2C3E50" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Adicionar Produto</Text>
          <Text style={styles.headerSubtitle}>Cadastre um novo produto</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={24} color="#6CC51D" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card container para o formulário */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <Ionicons name="basket" size={32} color="#6CC51D" />
              </View>
              <Text style={styles.formTitle}>Informações do Produto</Text>
              <Text style={styles.formDescription}>
                Preencha os dados abaixo para cadastrar um novo produto
              </Text>
            </View>
            
            <ProductForm onSubmit={handleSubmit} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#2C3E50",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
  },
  headerRight: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  formIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
    marginBottom: 8,
    textAlign: "center",
  },
  formDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});