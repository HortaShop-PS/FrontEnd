import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ProductForm from '../../components/ProductForm';
import { getProducerProduct, updateProduct, ProductData, ProductResponse } from '../../utils/registerProductService';
import { showSuccess, showError } from '../../utils/alertService';

export default function EditProduct() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productData, setProductData] = useState<ProductResponse | null>(null);

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
      throw error; // O erro será tratado pelo ProductForm
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (!productData) {
    return null;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      style={styles.container}
    >
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          title: "Editar Produto",
          headerShown: true,
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#333",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      
      <ProductForm
        initialData={productData}
        onSubmit={handleSubmit}
        submitButtonText="Salvar Alterações"
        loading={loading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
  },
});