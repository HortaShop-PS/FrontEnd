import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  Keyboard
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_500Medium } from '@expo-google-fonts/poppins';
import { apiConfig } from '../../utils/config';

interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

interface AddressSuggestion {
  display_name: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

export default function AddAddressScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFromMap, setIsFromMap] = useState(false);
  
  const [formData, setFormData] = useState<AddressData>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: undefined,
    longitude: undefined,
    isDefault: false,
  });

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
  });

  // Verificar se há dados do mapa quando a tela ganha foco
  useFocusEffect(
    React.useCallback(() => {
      checkMapLocation();
    }, [])
  );

  const checkMapLocation = () => {
    if (global.selectedMapLocation) {
      const { latitude, longitude, address } = global.selectedMapLocation;
      
      // Atualizar as coordenadas E marcar que veio do mapa
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
      }));
      setIsFromMap(true); // Marcar que esta localização veio do mapa

      // Se temos um endereço do mapa, tentar parseá-lo
      if (address && address !== 'Localização selecionada') {
        parseAddressFromMap(address);
      }

      // Limpar os dados globais
      global.selectedMapLocation = null;
    }
  };

  const parseAddressFromMap = (address: string) => {
    try {
      // Dividir o endereço em partes
      const parts = address.split(',').map(part => part.trim());
      
      if (parts.length >= 1) {
        // Tentar extrair rua e número da primeira parte
        const streetPart = parts[0];
        const streetMatch = streetPart.match(/^(.+?)(?:\s*,?\s*(\d+.*))?$/);
        
        if (streetMatch) {
          const street = streetMatch[1]?.trim() || '';
          const number = streetMatch[2]?.trim() || '';
          
          setFormData(prev => ({
            ...prev,
            street,
            number,
            neighborhood: parts[1] || prev.neighborhood,
            city: parts[2] || prev.city,
            state: parts[3] || prev.state,
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao parsear endereço do mapa:', error);
    }
  };

  // Função para buscar endereços usando a API local
  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setSearchLoading(true);
      
      // Usar a API local do backend
      const response = await fetch(
        `${apiConfig.BASE_URL}/addresses/autocomplete?input=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } else {
        console.error('Erro na busca:', response.status);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // CORREÇÃO: Função melhorada para mapear os campos corretamente
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    try {
      // Usar o place_id para obter detalhes via Google Maps API do backend
      const detailsResponse = await fetch(
        `${apiConfig.BASE_URL}/addresses/place-details?placeId=${suggestion.place_id}`
      );

      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        
        // CORREÇÃO: Mapear corretamente os campos dos detalhes
        setFormData(prev => ({
          ...prev,
          street: details.street || '',
          number: details.number || '',
          neighborhood: details.neighborhood || '',
          city: details.city || '',
          state: details.state || '',
          zipCode: details.zipCode || '',
          latitude: details.latitude,
          longitude: details.longitude,
        }));
      } else {
        // CORREÇÃO: Fallback inteligente analisando o secondary_text
        const addressParts = suggestion.secondary_text.split(',').map(part => part.trim());
        
        // Tentar extrair informações da estrutura do endereço
        let street = suggestion.main_text;
        let number = '';
        let neighborhood = '';
        let city = '';
        let state = '';
        let zipCode = '';

        // Se o main_text é um CEP, usar o secondary_text como endereço principal
        if (/^\d{5}-?\d{3}$/.test(suggestion.main_text)) {
          zipCode = suggestion.main_text.replace(/\D/g, '');
          
          // Analisar o secondary_text para extrair os componentes
          // Formato típico: "Rua Nome - Bairro, Cidade - Estado"
          if (addressParts.length > 0) {
            const firstPart = addressParts[0];
            if (firstPart.includes(' - ')) {
              const [streetPart, neighborhoodPart] = firstPart.split(' - ');
              street = streetPart.trim();
              neighborhood = neighborhoodPart.trim();
            } else {
              street = firstPart;
            }
          }
          
          if (addressParts.length > 1) {
            const secondPart = addressParts[1];
            if (secondPart.includes(' - ')) {
              const [cityPart, statePart] = secondPart.split(' - ');
              city = cityPart.trim();
              state = statePart.trim();
            } else {
              city = secondPart;
            }
          }
          
          if (addressParts.length > 2) {
            state = addressParts[2].trim();
          }
        } else {
          // Se não é CEP, usar mapeamento normal
          // O secondary_text geralmente tem: "Bairro, Cidade - Estado"
          if (addressParts.length >= 2) {
            neighborhood = addressParts[0];
            
            const lastPart = addressParts[addressParts.length - 1];
            if (lastPart.includes(' - ')) {
              const [cityPart, statePart] = lastPart.split(' - ');
              city = cityPart.trim();
              state = statePart.trim();
            } else {
              city = lastPart;
              if (addressParts.length >= 3) {
                state = addressParts[addressParts.length - 2];
              }
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          street: street || prev.street,
          number: number || prev.number,
          neighborhood: neighborhood || prev.neighborhood,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipCode || prev.zipCode,
        }));
      }

      // Marcar que NÃO veio do mapa (veio do autocompletar)
      setIsFromMap(false);

      // Limpar busca
      setSearchQuery('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao obter detalhes do endereço:', error);
      
      // Fallback mais simples em caso de erro
      const addressParts = suggestion.secondary_text.split(',').map(part => part.trim());
      
      setFormData(prev => ({
        ...prev,
        street: suggestion.main_text,
        neighborhood: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2] || '',
      }));
      
      setIsFromMap(false);
      setSearchQuery('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const handleInputChange = (field: keyof AddressData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatZipCode = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const validateForm = (): boolean => {
    if (!formData.street.trim()) {
      Alert.alert('Erro', 'O nome da rua é obrigatório');
      return false;
    }

    if (!formData.number.trim()) {
      Alert.alert('Erro', 'O número é obrigatório');
      return false;
    }

    if (!formData.neighborhood.trim()) {
      Alert.alert('Erro', 'O bairro é obrigatório');
      return false;
    }

    if (!formData.city.trim()) {
      Alert.alert('Erro', 'A cidade é obrigatória');
      return false;
    }

    if (!formData.state.trim()) {
      Alert.alert('Erro', 'O estado é obrigatório');
      return false;
    }

    if (!formData.zipCode.trim()) {
      Alert.alert('Erro', 'O CEP é obrigatório');
      return false;
    }

    const cleanZipCode = formData.zipCode.replace(/\D/g, '');
    if (cleanZipCode.length !== 8) {
      Alert.alert('Erro', 'CEP deve ter 8 dígitos');
      return false;
    }

    return true;
  };

  const handleSelectOnMap = () => {
    // Navegar para a tela do mapa passando as coordenadas atuais se existirem
    const params: any = {};
    if (formData.latitude && formData.longitude) {
      params.latitude = formData.latitude.toString();
      params.longitude = formData.longitude.toString();
    }
    
    router.push({
      pathname: '/addresses/map',
      params,
    });
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Preparar dados para envio
      const addressData = {
        ...formData,
        zipCode: formData.zipCode.replace(/\D/g, ''),
      };

      // TODO: Implementar chamada para a API
      console.log('Salvando endereço:', addressData);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Sucesso',
        'Endereço salvo com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      Alert.alert('Erro', 'Não foi possível salvar o endereço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestionItem = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#6CC51D" />
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionMainText} numberOfLines={1}>
          {item.main_text}
        </Text>
        <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
          {item.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Endereço</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Estrutura corrigida para evitar VirtualizedLists aninhadas */}
      <View style={styles.content}>
        {/* Busca de Endereços */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buscar Endereço</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9E9E9E" />
              <TextInput
                style={styles.searchInput}
                placeholder="Digite o endereço, CEP ou nome do local..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999999"
              />
              {searchLoading && (
                <ActivityIndicator size="small" color="#6CC51D" />
              )}
              {searchQuery.length > 0 && !searchLoading && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}>
                  <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Lista de Sugestões - Usando ScrollView em vez de FlatList */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView 
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {suggestions.map((item, index) => (
                  <View key={index}>
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(item)}
                    >
                      <Ionicons name="location-outline" size={20} color="#6CC51D" />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionMainText} numberOfLines={1}>
                          {item.main_text}
                        </Text>
                        <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                          {item.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {index < suggestions.length - 1 && (
                      <View style={styles.suggestionSeparator} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Seleção no Mapa */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.mapButton} onPress={handleSelectOnMap}>
              <View style={styles.mapButtonContent}>
                <Ionicons name="map" size={24} color="#6CC51D" />
                <View style={styles.mapButtonText}>
                  <Text style={styles.mapButtonTitle}>Selecionar no Mapa</Text>
                  <Text style={styles.mapButtonSubtitle}>
                    {formData.latitude && formData.longitude && isFromMap
                      ? 'Localização selecionada ✓' 
                      : 'Marque exatamente onde é seu endereço'
                    }
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6CC51D" />
            </TouchableOpacity>
          </View>

          {/* Informações do Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Endereço</Text>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 3 }]}>
                <Text style={styles.inputLabel}>Rua *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.street}
                  onChangeText={(text) => handleInputChange('street', text)}
                  placeholder="Nome da rua"
                  placeholderTextColor="#999999"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Número *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.number}
                  onChangeText={(text) => handleInputChange('number', text)}
                  placeholder="123"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Complemento</Text>
              <TextInput
                style={styles.input}
                value={formData.complement}
                onChangeText={(text) => handleInputChange('complement', text)}
                placeholder="Apartamento, bloco, casa, etc. (opcional)"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bairro *</Text>
              <TextInput
                style={styles.input}
                value={formData.neighborhood}
                onChangeText={(text) => handleInputChange('neighborhood', text)}
                placeholder="Nome do bairro"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Cidade *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  placeholder="Nome da cidade"
                  placeholderTextColor="#999999"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Estado *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => handleInputChange('state', text.toUpperCase())}
                  placeholder="SP"
                  placeholderTextColor="#999999"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CEP *</Text>
              <TextInput
                style={styles.input}
                value={formData.zipCode}
                onChangeText={(text) => handleInputChange('zipCode', formatZipCode(text))}
                placeholder="12345-678"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
          </View>

          {/* Opções */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.defaultContainer} 
              onPress={() => handleInputChange('isDefault', !formData.isDefault)}
            >
              <View style={styles.defaultCheckbox}>
                {formData.isDefault && (
                  <Ionicons name="checkmark" size={16} color="#6CC51D" />
                )}
              </View>
              <Text style={styles.defaultText}>Definir como endereço padrão</Text>
            </TouchableOpacity>
          </View>

          {/* Botão Salvar */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Salvar Endereço</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: 8,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginLeft: 48,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#6CC51D',
    borderStyle: 'dashed',
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  mapButtonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  mapButtonSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6CC51D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaultText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#333333',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#6CC51D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#AED581',
  },
  saveButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});