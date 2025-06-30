import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { showAlert, showError, showSuccess } from '../utils/alertService';
import producerProfileService, { CompleteProfileData } from '../utils/producerProfileService';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Opção CNPJ
  const [hasCnpj, setHasCnpj] = useState(true);
  
  // Dados básicos
  const [cnpj, setCnpj] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  
  // Endereço
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Brasil');
  
  // Dados bancários
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const formatCNPJ = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara XX.XXX.XXX/XXXX-XX
    if (numbers.length <= 14) {
      const formatted = numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
      return formatted;
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara XXXXX-XXX
    if (numbers.length <= 8) {
      const formatted = numbers.replace(/(\d{5})(\d)/, '$1-$2');
      return formatted;
    }
    return value;
  };

  const validateForm = (): boolean => {
    // CNPJ só é obrigatório se o usuário selecionou que tem CNPJ
    if (hasCnpj) {
      if (!cnpj.trim()) {
        showError('Erro', 'CNPJ é obrigatório');
        return false;
      }

      if (cnpj.replace(/\D/g, '').length !== 14) {
        showError('Erro', 'CNPJ deve ter 14 dígitos');
        return false;
      }
    }

    if (!street.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      showError('Erro', 'Todos os campos de endereço são obrigatórios');
      return false;
    }

    if (zipCode.replace(/\D/g, '').length !== 8) {
      showError('Erro', 'CEP deve ter 8 dígitos');
      return false;
    }

    if (!bankName.trim() || !agency.trim() || !accountNumber.trim()) {
      showError('Erro', 'Todos os campos bancários são obrigatórios');
      return false;
    }

    if (!businessDescription.trim()) {
      showError('Erro', 'Descrição do negócio é obrigatória');
      return false;
    }

    if (businessDescription.length < 50) {
      showError('Erro', 'Descrição do negócio deve ter pelo menos 50 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const profileData: CompleteProfileData = {
        // Só inclui CNPJ se o usuário tem CNPJ
        ...(hasCnpj && { cnpj: cnpj.replace(/\D/g, '') }),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.replace(/\D/g, ''), // Remove máscara antes de enviar
          country: country.trim(),
        },
        bankDetails: {
          bankName: bankName.trim(),
          agency: agency.trim(),
          accountNumber: accountNumber.trim(),
        },
        businessDescription: businessDescription.trim(),
      };

      await producerProfileService.completeProfile(profileData);
      
      showSuccess(
        'Sucesso!', 
        'Perfil completado com sucesso! Agora você pode começar a vender.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Volta para a dashboard do produtor
              router.replace('/(tabsProducers)');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Erro ao completar perfil:', error);
      showError('Erro', error.message || 'Não foi possível completar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete seu Perfil</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Intro */}
            <View style={styles.introSection}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.progressText}>Finalizando cadastro</Text>
              </View>
              <Text style={styles.introText}>
                Complete as informações abaixo para começar a vender seus produtos
              </Text>
            </View>

            {/* CNPJ Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados da Empresa</Text>
              
              {/* Toggle CNPJ */}
              <View style={styles.cnpjToggleContainer}>
                <View style={styles.cnpjToggleContent}>
                  <Text style={styles.cnpjToggleTitle}>Possuo CNPJ</Text>
                  <Text style={styles.cnpjToggleSubtitle}>
                    {hasCnpj ? 'Empresa formalizada' : 'Produtor pessoa física'}
                  </Text>
                </View>
                <Switch
                  value={hasCnpj}
                  onValueChange={setHasCnpj}
                  trackColor={{ false: '#E1E5E9', true: '#E8F5E8' }}
                  thumbColor={hasCnpj ? '#6CC51D' : '#BDC3C7'}
                />
              </View>
              
              {hasCnpj && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CNPJ *</Text>
                  <TextInput
                    style={styles.input}
                    value={cnpj}
                    onChangeText={(text) => setCnpj(formatCNPJ(text))}
                    placeholder="00.000.000/0000-00"
                    keyboardType="numeric"
                    maxLength={18}
                    editable={!loading}
                  />
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descrição do Negócio *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  placeholder="Descreva seu negócio, produtos cultivados, métodos de produção..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  editable={!loading}
                />
                <Text style={styles.charCounter}>
                  {businessDescription.length}/500 caracteres (mín. 50)
                </Text>
              </View>
            </View>

            {/* Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endereço</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Logradouro *</Text>
                <TextInput
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Rua, Av, Estrada..."
                  editable={!loading}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex2]}>
                  <Text style={styles.inputLabel}>Cidade *</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Cidade"
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.inputLabel}>Estado *</Text>
                  <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="UF"
                    maxLength={2}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CEP *</Text>
                <TextInput
                  style={styles.input}
                  value={zipCode}
                  onChangeText={(text) => setZipCode(formatZipCode(text))}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  maxLength={9}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Bank Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados Bancários</Text>
              <Text style={styles.sectionSubtitle}>
                Para receber os pagamentos das vendas
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Banco *</Text>
                <TextInput
                  style={styles.input}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="Nome do banco"
                  editable={!loading}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.inputLabel}>Agência *</Text>
                  <TextInput
                    style={styles.input}
                    value={agency}
                    onChangeText={setAgency}
                    placeholder="0000"
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputGroup, styles.flex2]}>
                  <Text style={styles.inputLabel}>Conta *</Text>
                  <TextInput
                    style={styles.input}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="00000-0"
                    editable={!loading}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Finalizar Cadastro</Text>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#2C3E50',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    marginBottom: 32,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F1F3F4',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#6CC51D',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  introText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 20,
  },
  cnpjToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  cnpjToggleContent: {
    flex: 1,
  },
  cnpjToggleTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 2,
  },
  cnpjToggleSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#2C3E50',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});