import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ProductForm from '../components/ProductForm';
import { registerProduct, ProductData } from '../utils/registerProductService';
import { showSuccess } from '../utils/alertService';

export default function RegisterProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      style={styles.container}
    >
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          title: "Registrar Produto",
          headerShown: true,
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#333",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      
      <ProductForm
        onSubmit={handleSubmit}
        submitButtonText="Adicionar aos Produtos"
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
});
