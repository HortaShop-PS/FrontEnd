import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface ProducerProfileWarningModalProps {
  visible: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
  completionPercentage: number;
  missingFields: string[];
}

const fieldLabels: Record<string, string> = {
  cnpj: 'CNPJ',
  address: 'Endereço completo',
  bankDetails: 'Dados bancários',
  businessDescription: 'Descrição do negócio',
};

export default function ProducerProfileWarningModal({
  visible,
  onClose,
  onCompleteProfile,
  completionPercentage,
  missingFields,
}: ProducerProfileWarningModalProps) {
  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={48} color="#6CC51D" />
            </View>
            <Text style={styles.title}>Complete seu Perfil</Text>
            <Text style={styles.subtitle}>
              Para começar a vender, complete as informações do seu negócio
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso</Text>
              <Text style={styles.progressValue}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${completionPercentage}%` }
                ]} 
              />
            </View>
          </View>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <View style={styles.missingSection}>
              <Text style={styles.missingTitle}>Informações pendentes:</Text>
              {missingFields.map((field) => (
                <View key={field} style={styles.missingItem}>
                  <Ionicons name="ellipse" size={6} color="#FF6B6B" />
                  <Text style={styles.missingText}>
                    {fieldLabels[field] || field}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Ao completar você poderá:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#6CC51D" />
              <Text style={styles.benefitText}>Cadastrar produtos para venda</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#6CC51D" />
              <Text style={styles.benefitText}>Receber pagamentos</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#6CC51D" />
              <Text style={styles.benefitText}>Acessar relatórios de vendas</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onCompleteProfile}>
              <Text style={styles.primaryButtonText}>Completar Agora</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Lembrar Depois</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2C3E50',
  },
  progressValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#6CC51D',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F3F4',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6CC51D',
    borderRadius: 4,
  },
  missingSection: {
    marginBottom: 24,
  },
  missingTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 12,
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  missingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#FF6B6B',
    marginLeft: 8,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#2C3E50',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6CC51D',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
});