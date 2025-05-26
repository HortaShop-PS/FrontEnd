import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductData, ProductResponse, uploadProductImage } from '../utils/registerProductService';
import { showError, showSuccess } from '../utils/alertService';

const categorias = [
  "Frutas", "Vegetais", "Orgânicos", "Laticínios", "Embutidos",
  "Grãos", "Temperos", "Bebidas", "Doces", "Outros"
];

const unidades = [
  "kg", "g", "unidade", "pacote", "caixa", "litro", "ml", "dúzia"
];

interface ProductFormProps {
  initialData?: ProductResponse;
  onSubmit: (data: ProductData) => Promise<void>;
  submitButtonText: string;
  loading: boolean;
}

export default function ProductForm({ initialData, onSubmit, submitButtonText, loading }: ProductFormProps) {
  const [nome, setNome] = useState(initialData?.name || "");
  const [descricao, setDescricao] = useState(initialData?.description || "");
  const [organico, setOrganico] = useState(initialData?.isOrganic || false);
  const [categoria, setCategoria] = useState(initialData?.category || categorias[0]);
  const [valor, setValor] = useState(initialData?.price || 0);
  const [stock, setStock] = useState(initialData?.stock || 1);
  const [unidade, setUnidade] = useState(initialData?.unit || unidades[0]);
  const [imagem, setImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(initialData?.imageUrl || null);
  const [origin, setOrigin] = useState(initialData?.origin || "");
  const [harvestSeason, setHarvestSeason] = useState(initialData?.harvestSeason || "");

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
    const cleanText = text.replace(/[^\d,]/g, "");
    const numberText = cleanText.replace(",", ".");
    const value = parseFloat(numberText);
    
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

  const handleSubmit = async () => {
    if (!nome || !descricao || !valor || !stock) {
      showError("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      let imageUrl = imagemPreview;
      
      // Upload da nova imagem se foi selecionada
      if (imagem) {
        imageUrl = await uploadProductImage(imagem.uri);
      }

      const productData: ProductData = {
        name: nome,
        description: descricao,
        isOrganic: organico,
        category: categoria,
        price: valor,
        stock: stock,
        unit: unidade,
        imageUrl: imageUrl || undefined,
        origin: origin || undefined,
        harvestSeason: harvestSeason || undefined
      };

      await onSubmit(productData);
    } catch (error) {
      console.error("Erro ao processar formulário:", error);
      showError("Erro", error instanceof Error ? error.message : "Ocorreu um erro inesperado");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <View style={styles.rowWithImage}>
          <View style={styles.nameInputContainer}>
            <Text style={styles.label}>Nome do Produto</Text>
            <TextInput 
              style={styles.input} 
              value={nome} 
              onChangeText={setNome} 
              placeholder="Digite o nome" 
            />
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
          <TouchableOpacity 
            onPress={() => setOrganico(!organico)} 
            style={[styles.organicButton, organico && styles.organicButtonActive]}
          >
            <Text style={styles.organicText}>{organico ? "Sim" : "Não"}</Text>
          </TouchableOpacity>
        </View>

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
          <Text style={styles.label}>Estoque</Text>
          <View style={styles.counterBox}>
            <TouchableOpacity onPress={() => handleDecrement(setStock, stock)} style={styles.counterButton}>
              <Ionicons name="remove" size={20} color="#6CC51D" />
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={stock.toString()}
              onChangeText={(text) => {
                const value = parseInt(text);
                if (!isNaN(value) && value > 0) {
                  setStock(value);
                } else if (text === "") {
                  setStock(1);
                }
              }}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => handleIncrement(setStock, stock)} style={styles.counterButton}>
              <Ionicons name="add" size={20} color="#6CC51D" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Origem (opcional)</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="Ex: Fazenda São João, MG"
        />

        <Text style={styles.label}>Época de Colheita (opcional)</Text>
        <TextInput
          style={styles.input}
          value={harvestSeason}
          onChangeText={setHarvestSeason}
          placeholder="Ex: Março a Junho"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <LinearGradient
            colors={['#AEDC81', '#6CC51D']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{submitButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modais */}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  formContainer: {
    padding: 20,
  },
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#F8FAF8",
    marginBottom: 16
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    width: '100%'
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  organicButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  organicButtonActive: {
    backgroundColor: "#6CC51D"
  },
  organicText: {
    fontWeight: "bold",
    color: "#333"
  },
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
  counterInput: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    minWidth: 50,
    textAlign: "center",
    padding: 0,
    color: "#222",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    overflow: 'hidden',
    position: 'relative',
    width: '80%',
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
  // Estilos dos modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  modalItemSelected: {
    backgroundColor: '#F0F8F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#6CC51D',
    fontWeight: 'bold',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
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
    width: '100%',
    height: '100%',
  },
  noImageText: {
    color: '#CCC',
    fontSize: 16,
    marginTop: 10,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(108, 197, 29, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});