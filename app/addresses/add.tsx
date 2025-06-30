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
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
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

  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  useFocusEffect(
    React.useCallback(() => {
      checkMapLocation();
    }, [])
  );

  const checkMapLocation = () => {
    if (global.selectedMapLocation) {
      const { latitude, longitude, address } = global.selectedMapLocation;
      
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
      }));
      setIsFromMap(true);

      if (address && address !== 'Localização selecionada') {
        parseAddressFromMap(address);
      }

      global.selectedMapLocation = null;
    }
  };

  const parseAddressFromMap = (address: string) => {
    try {
      const parts = address.split(',').map(part => part.trim());
      
      if (parts.length >= 1) {
        const streetPart = parts[0];
        const streetMatch = streetPart.match(/^(.+?)\s+(\d+.*)$/);
        
        if (streetMatch) {
          setFormData(prev => ({
            ...prev,
            street: streetMatch[1].trim(),
            number: streetMatch[2].trim(),
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            street: streetPart,
          }));
        }
      }

      if (parts.length >= 2) {
        setFormData(prev => ({
          ...prev,
          neighborhood: parts[1],
        }));
      }

      if (parts.length >= 3) {
        const cityStatePart = parts[2];
        const cityStateMatch = cityStatePart.match(/^(.+?)\s+-\s+(.+)$/);
        
        if (cityStateMatch) {
          setFormData(prev => ({
            ...prev,
            city: cityStateMatch[1].trim(),
            state: cityStateMatch[2].trim(),
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            city: cityStatePart,
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao analisar endereço do mapa:', error);
    }
  };

  // Função de busca com debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchAddresses();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const searchAddresses = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `${apiConfig.BASE_URL}/addresses/autocomplete?input=${encodeURIComponent(searchQuery)}`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions((data || []).length > 0);
      } else {
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

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    try {
      const detailsResponse = await fetch(
        `${apiConfig.BASE_URL}/addresses/place-details?placeId=${suggestion.place_id}`
      );

      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        
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
        const addressParts = suggestion.secondary_text.split(',').map(part => part.trim());
        
        let street = suggestion.main_text;
        let number = '';
        let neighborhood = '';
        let city = '';
        let state = '';
        let zipCode = '';

        if (/^\d{5}-?\d{3}$/.test(suggestion.main_text)) {
          zipCode = suggestion.main_text.replace(/\D/g, '');
          
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

      setIsFromMap(false);
      setSearchQuery('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao obter detalhes do endereço:', error);
      
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const addressData = {
        ...formData,
        zipCode: formData.zipCode.replace(/\D/g, ''),
        country: 'Brasil',
      };

      const response = await fetch(`${apiConfig.BASE_URL}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getStoredToken()}`,
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Endereço salvo com sucesso!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Erro', errorData.message || 'Erro ao salvar endereço');
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      Alert.alert('Erro', 'Não foi possível salvar o endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOnMap = () => {
    router.push('/addresses/map');
  };

  const getStoredToken = async () => {
    try {
      const { getItemAsync } = await import('expo-secure-store');
      return await getItemAsync('userToken');
    } catch {
      return null;
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Header seguindo padrão flat */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerGreeting}>Adicionar</Text>
          <Text style={styles.headerTitle}>Novo Endereço</Text>
        </View>
      </View>

      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        
        {/* Busca de endereço */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="search-outline" size={20} color="#6CC51D" />
            </View>
            <Text style={styles.sectionTitle}>Buscar Endereço</Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#7F8C8D" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Digite rua, bairro ou CEP..."
                placeholderTextColor="#BDC3C7"
              />
              {searchLoading && (
                <ActivityIndicator size="small" color="#6CC51D" />
              )}
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={`${suggestion.place_id}-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(suggestion)}
                    >
                      <View style={styles.suggestionIconContainer}>
                        <Ionicons name="location-outline" size={16} color="#6CC51D" />
                      </View>
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionMain}>{suggestion.main_text}</Text>
                        <Text style={styles.suggestionSecondary}>{suggestion.secondary_text}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Seleção no Mapa */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.mapButton} onPress={handleSelectOnMap}>
            <View style={styles.mapButtonContent}>
              <View style={styles.mapIconContainer}>
                <Ionicons name="map" size={24} color="#6CC51D" />
              </View>
              <View style={styles.mapButtonText}>
                <Text style={styles.mapButtonTitle}>Selecionar no Mapa</Text>
                <Text style={styles.mapButtonSubtitle}>
                  {formData.latitude && formData.longitude && isFromMap
                    ? 'Localização selecionada ✓' 
                    : 'Marque exatamente onde é seu endereço'
                  }
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6CC51D" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Informações do Endereço */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="home-outline" size={20} color="#6CC51D" />
            </View>
            <Text style={styles.sectionTitle}>Informações do Endereço</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 3 }]}>
              <Text style={styles.inputLabel}>Rua *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={formData.street}
                  onChangeText={(text) => handleInputChange('street', text)}
                  placeholder="Nome da rua"
                  placeholderTextColor="#BDC3C7"
                />
              </View>
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Número *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={formData.number}
                  onChangeText={(text) => handleInputChange('number', text)}
                  placeholder="123"
                  placeholderTextColor="#BDC3C7"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Complemento</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={formData.complement}
                onChangeText={(text) => handleInputChange('complement', text)}
                placeholder="Apartamento, bloco, casa, etc."
                placeholderTextColor="#BDC3C7"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bairro *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={formData.neighborhood}
                onChangeText={(text) => handleInputChange('neighborhood', text)}
                placeholder="Nome do bairro"
                placeholderTextColor="#BDC3C7"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Cidade *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  placeholder="Nome da cidade"
                  placeholderTextColor="#BDC3C7"
                />
              </View>
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Estado *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => handleInputChange('state', text.toUpperCase())}
                  placeholder="SP"
                  placeholderTextColor="#BDC3C7"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CEP *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={formData.zipCode}
                onChangeText={(text) => handleInputChange('zipCode', formatZipCode(text))}
                placeholder="12345-678"
                placeholderTextColor="#BDC3C7"
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
          </View>
        </View>

        {/* Opções */}
        <View style={styles.sectionCard}>
          <TouchableOpacity 
            style={styles.defaultContainer} 
            onPress={() => handleInputChange('isDefault', !formData.isDefault)}
            activeOpacity={0.7}
          >
            <View style={[styles.defaultCheckbox, formData.isDefault && styles.defaultCheckboxChecked]}>
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
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Salvar Endereço</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },

  // Header seguindo padrão flat
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FAFAFA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  headerContent: {
    flex: 1,
  },
  headerGreeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
  },

  mainContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  // Section Cards seguindo padrão flat
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#2C3E50",
  },

  // Search container
  searchContainer: {
    position: 'relative',
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#2C3E50",
  },

  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginTop: 8,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  suggestionIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionMain: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#7F8C8D',
  },

  // Map button
  mapButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mapIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  mapButtonText: {
    flex: 1,
  },
  mapButtonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 4,
  },
  mapButtonSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
  },

  // Input fields
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#2C3E50",
  },

  // Default address checkbox
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaultCheckboxChecked: {
    backgroundColor: '#E8F8F5',
    borderColor: '#6CC51D',
  },
  defaultText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#2C3E50',
  },

  // Save button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  saveButton: {
    backgroundColor: '#6CC51D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  saveButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});