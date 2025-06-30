import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Text,
  ScrollView
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import ProductForm from '../../components/ProductForm';
import { getProducerProduct, updateProduct, ProductData, ProductResponse } from '../../utils/registerProductService';
import { showSuccess, showError } from '../../utils/alertService';

export default function EditProduct() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productData, setProductData] = useState<ProductResponse | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setInitialLoading(true);
      const data = await getProducerProduct(id as string);
      setProductData(data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      showError('Erro', 'Não foi possível carregar os dados do produto');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (updatedData: ProductData) => {
    if (!id || typeof id !== 'string') return;
   
    setLoading(true);
    try {
      await updateProduct(id, updatedData);
      showSuccess("Sucesso", "Produto atualizado com sucesso!");
      router.back();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
        </View>
      </SafeAreaView>
    );
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <Stack.Screen
          options={{
            title: "Editar Produto",
            headerShown: true,
            headerStyle: { backgroundColor: "#FAFAFA" },
            headerTintColor: "#2C3E50",
            headerTitleStyle: { 
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18
            },
          }}
        />

        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator size="large" color="#6CC51D" />
            </View>
            <Text style={styles.loadingText}>Carregando dados do produto...</Text>
            <Text style={styles.loadingSubtext}>Aguarde um momento</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!productData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Stack.Screen
        options={{
          title: "Editar Produto",
          headerShown: true,
          headerStyle: { backgroundColor: "#FAFAFA" },
          headerTintColor: "#2C3E50",
          headerTitleStyle: { 
            fontFamily: "Poppins_600SemiBold",
            fontSize: 18
          },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header da tela */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="pencil" size={24} color="#6CC51D" />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>✏️ Editar Produto</Text>
              <Text style={styles.headerSubtitle}>
                Atualize as informações do seu produto
              </Text>
            </View>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <ProductForm
              initialData={productData}
              onSubmit={handleSubmit}
              submitButtonText="Salvar Alterações"
              loading={loading}
            />
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
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#2C3E50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    textAlign: 'center',
  },
});