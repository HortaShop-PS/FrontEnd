import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { registerProduct } from '../utils/registerProductService';
import { getToken } from "@/utils/authServices";
import * as ImagePicker from 'expo-image-picker';
import { showAlert, showSuccess, showError } from '../utils/alertService';
import { LinearGradient } from 'expo-linear-gradient';
import Config from 'react-native-config';

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

const unidades = [
  "kg",
  "g",
  "unidade",
  "pacote",
  "caixa",
  "litro",
  "ml",
  "dúzia"
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
  const [unidade, setUnidade] = useState(unidades[0]);
  const [loading, setLoading] = useState(false);
  const [imagem, setImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  // Estados para controlar os modais
  const [categoriasModalVisible, setCategoriasModalVisible] = useState(false);
  const [unidadesModalVisible, setUnidadesModalVisible] = useState(false);
  const [imagemModalVisible, setImagemModalVisible] = useState(false);
  const [opcoesImagemVisible, setOpcoesImagemVisible] = useState(false);

  const handleIncrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => setter(value + 1);
  const handleDecrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    if (value > 1) setter(value - 1);
  };

  const handleValorChange = (text: string) => {
    // Remove caracteres não numéricos, exceto vírgula
    const cleanText = text.replace(/[^\d,]/g, "");

    // Substitui vírgula por ponto para cálculos
    const numberText = cleanText.replace(",", ".");

    // Converte para número
    const value = parseFloat(numberText);

    // Atualiza o estado apenas se for um número válido ou texto vazio
    if (!isNaN(value)) {
      setValor(value);
    } else if (cleanText === "" || cleanText === ",") {
      setValor(0);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImagem(result.assets[0]);
        setImagemPreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      showError("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const handleRemoveImage = () => {
    setImagem(null);
    setImagemPreview(null);
    setOpcoesImagemVisible(false);
  };

  const uploadImage = async () => {
    if (!imagem) return null;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const formData = new FormData();

      // Criar o objeto de arquivo para o FormData
      const fileUri = Platform.OS === 'ios'
        ? imagem.uri.replace('file://', '')
        : imagem.uri;

      const filename = fileUri.split('/').pop() || 'upload.jpg'; // Provide a default filename
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg'; // Provide a default type

      // Use a more robust way to create the file object for FormData
      const file: any = {
        uri: fileUri,
        name: filename,
        type,
      };

      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha ao fazer upload da imagem");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      showError("Erro", "Não foi possível fazer upload da imagem");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!nome || !descricao || !valor || !quantidade) {
      showError("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }
    setLoading(true);
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const token = await getToken();

      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      // Upload da imagem primeiro
      const imageUrl = await uploadImage();

      console.log("Enviando dados do produto:", {
        name: nome,
        description: descricao,
        isOrganic: organico,
        category: categoria,
        price: valor,
        quantity: quantidade,
        unit: unidade,
        imageUrl
      });

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: nome,
          description: descricao,
          isOrganic: organico,
          category: categoria,
          price: valor,
          quantity: quantidade,
          unit: unidade,
          imageUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro na resposta do servidor:", errorData);
        throw new Error(errorData.message || "Erro ao registrar produto");
      }

      showSuccess("Sucesso", "Produto cadastrado com sucesso!");
      setNome("");
      setDescricao("");
      setOrganico(false);
      setCategoria(categorias[0]);
      setValor(0);
      setQuantidade(1);
      setUnidade(unidades[0]);
      setImagem(null);
      setImagemPreview(null);
    } catch (e) {
      console.error("Erro detalhado:", e);
      showError("Erro ao cadastrar produto", e instanceof Error ? e.message : "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View
        style={styles.container}

      >
        <View style={styles.mainContent}>
          {/* Formulário de Cadastro */}
          <View style={styles.formContainer}>

            <View style={styles.rowWithImage}>
              <View style={styles.nameInputContainer}>
                <Text style={styles.label}>Nome do Produto</Text>
                <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Digite o nome" />
              </View>

              <TouchableOpacity
                style={styles.smallImageContainer}
                onPress={() => setImagemModalVisible(true)}
              >
                {imagemPreview ? (
                  <Image source={{ uri: imagemPreview }} style={styles.smallImage} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="camera" size={20} color="#6CC51D" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Digite a descrição"
              multiline
            />

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Orgânico</Text>
              <TouchableOpacity onPress={() => setOrganico(!organico)} style={[styles.organicButton, organico && styles.organicButtonActive]}>
                <Text style={styles.organicText}>{organico ? "Sim" : "Não"}</Text>
              </TouchableOpacity>
            </View>

            {/* Dropdown para Categoria */}
            <View style={styles.row}>
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setCategoriasModalVisible(true)}
              >
                <Text style={styles.dropdownButtonText}>{categoria}</Text>
                <Ionicons name="chevron-down" size={18} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Dropdown para Unidade */}
            <View style={styles.row}>
              <Text style={styles.label}>Unidade</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setUnidadesModalVisible(true)}
              >
                <Text style={styles.dropdownButtonText}>{unidade}</Text>
                <Ionicons name="chevron-down" size={18} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Valor por unidade</Text>
              <View style={styles.counterBox}>
                <TouchableOpacity onPress={() => setValor(valor > 1 ? valor - 1 : 1)} style={styles.counterButton}>
                  <Ionicons name="remove" size={20} color="#6CC51D" />
                </TouchableOpacity>
                <TextInput
                  style={styles.counterInput}
                  value={valor.toFixed(2).replace(".", ",")}
                  onChangeText={handleValorChange}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => setValor(valor + 1)} style={styles.counterButton}>
                  <Ionicons name="add" size={20} color="#6CC51D" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Quantidade</Text>
              <View style={styles.counterBox}>
                <TouchableOpacity onPress={() => handleDecrement(setQuantidade, quantidade)} style={styles.counterButton}>
                  <Ionicons name="remove" size={20} color="#6CC51D" />
                </TouchableOpacity>
                <TextInput
                  style={styles.counterInput}
                  value={quantidade.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text);
                    if (!isNaN(value) && value > 0) {
                      setQuantidade(value);
                    } else if (text === "") {
                      setQuantidade(1);
                    }
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={() => handleIncrement(setQuantidade, quantidade)} style={styles.counterButton}>
                  <Ionicons name="add" size={20} color="#6CC51D" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Botão de Salvar centralizado */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            <LinearGradient
              colors={['#AEDC81', '#6CC51D']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.buttonText}>{loading ? "Salvando..." : "Adicionar aos Produtos"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal para visualização da imagem */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imagemModalVisible}
        onRequestClose={() => setImagemModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImagemModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.fullImageContainer}>
              {imagemPreview ? (
                <Image source={{ uri: imagemPreview }} style={styles.fullImage} resizeMode="contain" />
              ) : (
                <View style={styles.noImageContainer}>
                  <Ionicons name="image-outline" size={80} color="#CCC" />
                  <Text style={styles.noImageText}>Nenhuma imagem selecionada</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={() => {
                setImagemModalVisible(false);
                setOpcoesImagemVisible(true);
              }}
            >
              <Text style={styles.changeImageText}>Alterar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>




      <Modal
        animationType="slide"
        transparent={true}
        visible={opcoesImagemVisible}
        onRequestClose={() => setOpcoesImagemVisible(false)}
      >
        <View style={[styles.modalOverlay, {}]}>
          <View style={[styles.modalContent, {
            maxHeight: 200, shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 100,
            shadowRadius: 10,
            elevation: 22,
          }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Opções de Imagem</Text>
              <TouchableOpacity onPress={() => setOpcoesImagemVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                pickImage();
                setOpcoesImagemVisible(false);
              }}
            >
              <Ionicons name="camera" size={24} color="#6CC51D" />
              <Text style={styles.optionText}>Selecionar nova imagem</Text>
            </TouchableOpacity>

            {imagemPreview && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={handleRemoveImage}
              >
                <Ionicons name="trash" size={24} color="#FF6B6B" />
                <Text style={styles.optionText}>Remover imagem atual</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>



      {/* Modal para seleção de Categoria */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoriasModalVisible}
        onRequestClose={() => setCategoriasModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setCategoriasModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.modalItem, cat === categoria && styles.modalItemSelected]}
                  onPress={() => {
                    setCategoria(cat);
                    setCategoriasModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, cat === categoria && styles.modalItemTextSelected]}>
                    {cat}
                  </Text>
                  {cat === categoria && (
                    <Ionicons name="checkmark" size={20} color="#6CC51D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para seleção de Unidade */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={unidadesModalVisible}
        onRequestClose={() => setUnidadesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Unidade</Text>
              <TouchableOpacity onPress={() => setUnidadesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {unidades.map((un) => (
                <TouchableOpacity
                  key={un}
                  style={[styles.modalItem, un === unidade && styles.modalItemSelected]}
                  onPress={() => {
                    setUnidade(un);
                    setUnidadesModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, un === unidade && styles.modalItemTextSelected]}>
                    {un}
                  </Text>
                  {un === unidade && (
                    <Ionicons name="checkmark" size={20} color="#6CC51D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80, // Espaço extra para o botão
  },
  mainContent: {
    width: '100%',
    backgroundColor: "#FFFFFF",
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    width: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#F8FAF8"
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  organicButton: {
    backgroundColor: "#F8FAF8",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  organicButtonActive: {
    backgroundColor: "#E9FCD6",
    borderColor: "#AEDC81",
  },
  organicText: {
    fontWeight: "bold",
    color: "#222"
  },
  counterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  counterButton: {
    padding: 6,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 12,
    minWidth: 32,
    textAlign: "center"
  },
  counterInput: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    minWidth: 50,
    textAlign: "center",
    padding: 0,
    color: "#222",
  },
  // Estilos para o botão do dropdown
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "space-between",
    minWidth: 140,
  },
  dropdownButtonText: {
    fontWeight: "bold",
    color: "#222",
    marginRight: 8,
  },

  // Novos estilos para o layout com imagem pequena
  rowWithImage: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nameInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  smallImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F8FAF8",
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 8,
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
  },

  // Estilos para o modal de visualização de imagem
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullImageContainer: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#CCC',
    fontSize: 16,
    marginTop: 12,
  },
  changeImageButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  changeImageText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Estilos para o modal de opções
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },

  // Modificação do buttonContainer para centralizar
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    alignItems: 'center',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    overflow: 'hidden',
    position: 'relative',
    width: '80%', // Botão mais estreito e centralizado
  },
  buttonGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    position: 'relative',
    zIndex: 1
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 100,
    shadowRadius: 10,
    elevation: 60,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalList: {
    paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemSelected: {
    backgroundColor: "#F8FAF8",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  modalItemTextSelected: {
    color: "#6CC51D",
    fontWeight: "bold",
  },
});
