import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import googleMapsService, { PlaceAutocompleteResult } from '../utils/googleMapsService';
import addressService, { CreateAddressData, Address } from '../utils/addressService';
import { showError, showSuccess } from '../utils/alertService';

interface AddressFormProps {
  address?: Address | null;
  onSave: (address: Address) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface AddressFormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export default function AddressForm({ address, onSave, onCancel, loading = false }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    street: address?.street || '',
    number: address?.number || '',
    complement: address?.complement || '',
    neighborhood: address?.neighborhood || '',
    city: address?.city || '',
    state: address?.state || '',
    zipCode: address?.zipCode || '',
    isDefault: address?.isDefault || false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        isDefault: address.isDefault,
      });
    }
  }, [address]);

  // Função de busca de endereços movida para fora do useEffect
  const searchAddresses = async (query: string) => {
    if (query.length < 3) return;

    setSearchLoading(true);
    try {
      const results = await googleMapsService.autocompleteAddress(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce para busca de endereços
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchAddresses(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const selectSuggestion = async (suggestion: PlaceAutocompleteResult) => {
    setShowSuggestions(false);
    setSearchQuery(suggestion.description);
    
    try {
      // Tentar extrair componentes do endereço
      const addressComponents = googleMapsService.parseAddressFromDescription(suggestion.description);
      
      setFormData(prev => ({
        ...prev,
        street: addressComponents.street || prev.street,
        neighborhood: addressComponents.neighborhood || prev.neighborhood,
        city: addressComponents.city || prev.city,
        state: addressComponents.state || prev.state,
      }));
    } catch (error) {
      console.error('Erro ao analisar endereço:', error);
    }
  };

  const validateForm = (): boolean => {
    try {
      const validation = addressService.validateAddressData(formData);
      setErrors(validation.errors);
      return validation.isValid;
    } catch (error) {
      console.error('Erro na validação:', error);
      setErrors(['Erro na validação dos dados']);
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError('Erro', errors.length > 0 ? errors.join('\n') : 'Dados inválidos');
      return;
    }

    setValidating(true);
    try {
      const addressData: CreateAddressData = {
        ...formData,
        zipCode: addressService.formatZipCode(formData.zipCode),
        country: 'Brasil',
      };

      let savedAddress: Address;
      
      if (address?.id) {
        // Atualizar endereço existente
        savedAddress = await addressService.updateAddress(address.id, addressData);
        showSuccess('Sucesso', 'Endereço atualizado com sucesso!');
      } else {
        // Criar novo endereço
        savedAddress = await addressService.createAddress(addressData);
        showSuccess('Sucesso', 'Endereço criado com sucesso!');
      }

      onSave(savedAddress);
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      showError('Erro', error?.message || 'Erro ao salvar endereço');
    } finally {
      setValidating(false);
    }
  };

  const formatZipCodeInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 8) {
      const formatted = cleaned.replace(/(\d{5})(\d{0,3})/, '$1-$2');
      setFormData(prev => ({ ...prev, zipCode: formatted }));
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Busca por endereço */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buscar Endereço</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Digite o endereço para buscar..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#BDC3C7"
            />
            {searchLoading && (
              <ActivityIndicator size="small" color="#6CC51D" style={styles.searchLoader} />
            )}
          </View>
          
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={`${suggestion.place_id || index}`}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <Ionicons name="location-outline" size={16} color="#6CC51D" />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionMain}>{suggestion.main_text}</Text>
                    <Text style={styles.suggestionSecondary}>{suggestion.secondary_text}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Formulário de endereço */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Endereço</Text>
        
        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 3 }]}>
            <Text style={styles.label}>Rua *</Text>
            <TextInput
              style={styles.input}
              value={formData.street}
              onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
              placeholder="Nome da rua"
              placeholderTextColor="#BDC3C7"
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Número *</Text>
            <TextInput
              style={styles.input}
              value={formData.number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, number: text }))}
              placeholder="123"
              placeholderTextColor="#BDC3C7"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Complemento</Text>
          <TextInput
            style={styles.input}
            value={formData.complement}
            onChangeText={(text) => setFormData(prev => ({ ...prev, complement: text }))}
            placeholder="Apto, casa, bloco..."
            placeholderTextColor="#BDC3C7"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bairro *</Text>
          <TextInput
            style={styles.input}
            value={formData.neighborhood}
            onChangeText={(text) => setFormData(prev => ({ ...prev, neighborhood: text }))}
            placeholder="Nome do bairro"
            placeholderTextColor="#BDC3C7"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 2 }]}>
            <Text style={styles.label}>Cidade *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Nome da cidade"
              placeholderTextColor="#BDC3C7"
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Estado *</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text.toUpperCase() }))}
              placeholder="SP"
              placeholderTextColor="#BDC3C7"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>CEP *</Text>
          <TextInput
            style={styles.input}
            value={formData.zipCode}
            onChangeText={formatZipCodeInput}
            placeholder="00000-000"
            placeholderTextColor="#BDC3C7"
            keyboardType="numeric"
            maxLength={9}
          />
        </View>

        <TouchableOpacity
          style={styles.defaultContainer}
          onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
        >
          <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
            {formData.isDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.defaultLabel}>Definir como endereço padrão</Text>
        </TouchableOpacity>
      </View>

      {/* Botões de ação */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          disabled={loading || validating}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, (loading || validating) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading || validating}
        >
          {(loading || validating) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {address?.id ? 'Atualizar' : 'Salvar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
  },
  searchLoader: {
    marginLeft: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  suggestionText: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionMain: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  suggestionSecondary: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#BDC3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#6CC51D',
    borderColor: '#6CC51D',
  },
  defaultLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#7F8C8D',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6CC51D',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
});