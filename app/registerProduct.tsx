import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { registerProduct } from '../utils/registerProductService';

const categorias = [
  "Frutas",
  "Vegetais",
  "Orgânicos",
  "Laticínios",
  "Embutidos",
  "Grãos",
  "Temperos",
  "Bebidas",
  "Doces",
  "Outros"
];

export default function RegisterProduct() {
  const params = useLocalSearchParams();
  const categoriaInicial = typeof params.categoria === "string" ? params.categoria : categorias[0];
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [organico, setOrganico] = useState(false);
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [valor, setValor] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleIncrement = (setter, value) => setter(value + 1);
  const handleDecrement = (setter, value) => {
    if (value > 1) setter(value - 1);
  };

  const handleValorChange = (text) => {
    const clean = text.replace(/[^0-9,]/g, "").replace(",", ".");
    setValor(Number(clean));
  };

  const handleSubmit = async () => {
    if (!nome || !descricao || !valor || !quantidade) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setLoading(true);
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome,
          description: descricao,
          isOrganic: organico,
          category: categoria,
          price: valor,
          quantity: quantidade
        })
      });
      if (!response.ok) throw new Error("Erro ao registrar produto");
      Alert.alert("Produto cadastrado com sucesso!");
      setNome("");
      setDescricao("");
      setOrganico(false);
      setCategoria(categorias[0]);
      setValor(0);
      setQuantidade(1);
    } catch (e) {
      Alert.alert("Erro ao cadastrar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={require("../assets/images/limao.png")} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Digite o nome" />
          <Text style={styles.label}>Descrição</Text>
          <TextInput style={[styles.input, { height: 60 }]} value={descricao} onChangeText={setDescricao} placeholder="Digite a descrição" multiline />
          <View style={styles.row}>
            <Text style={styles.label}>Orgânico</Text>
            <TouchableOpacity onPress={() => setOrganico(!organico)} style={styles.organicButton}>
              <Text style={styles.organicText}>{organico ? "Sim" : "Não"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoriaBox}>
              <Text style={styles.categoriaText}>{categoria}</Text>
              <Ionicons name="chevron-down" size={18} color="#333" />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoriaOption, cat === categoria && styles.categoriaOptionSelected]}
                onPress={() => setCategoria(cat)}
              >
                <Text style={[styles.categoriaOptionText, cat === categoria && styles.categoriaOptionTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.row}>
            <Text style={styles.label}>Valor por unidade</Text>
            <View style={styles.counterBox}>
              <TouchableOpacity onPress={() => setValor(valor > 1 ? valor - 1 : 1)} style={styles.counterButton}>
                <Ionicons name="remove" size={20} color="#6CC51D" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{valor.toFixed(2).replace(".", ",")}</Text>
              <TouchableOpacity onPress={() => setValor(valor + 1)} style={styles.counterButton}>
                <Ionicons name="add" size={20} color="#6CC51D" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantidade</Text>
            <View style={styles.counterBox}>
              <TouchableOpacity onPress={() => handleDecrement(setQuantidade, quantidade)} style={styles.counterButton}>
                <Ionicons name="remove" size={20} color="#6CC51D" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{quantidade}</Text>
              <TouchableOpacity onPress={() => handleIncrement(setQuantidade, quantidade)} style={styles.counterButton}>
                <Ionicons name="add" size={20} color="#6CC51D" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Salvando..." : "Adicionar aos Produtos"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAF8",
    alignItems: "center",
    paddingBottom: 30
  },
  imageContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10
  },
  image: {
    width: 180,
    height: 120,
    borderRadius: 90,
    backgroundColor: "#E9FCD6"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 10,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 2
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    fontSize: 15,
    backgroundColor: "#F8FAF8"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  organicButton: {
    backgroundColor: "#E9FCD6",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6
  },
  organicText: {
    fontWeight: "bold",
    color: "#222"
  },
  categoriaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  categoriaText: {
    fontWeight: "bold",
    color: "#222",
    marginRight: 4
  },
  categoriaOption: {
    backgroundColor: "#F8FAF8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  categoriaOptionSelected: {
    backgroundColor: "#E9FCD6",
    borderColor: "#6CC51D"
  },
  categoriaOptionText: {
    color: "#222"
  },
  categoriaOptionTextSelected: {
    color: "#6CC51D",
    fontWeight: "bold"
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  counterButton: {
    padding: 4
  },
  counterValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    minWidth: 32,
    textAlign: "center"
  },
  button: {
    backgroundColor: "#6CC51D",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17
  }
});