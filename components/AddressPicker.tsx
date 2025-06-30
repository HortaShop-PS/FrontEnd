import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import addressService, { Address } from '../utils/addressService';
import { showError } from '../utils/alertService';

interface AddressPickerProps {
  selectedAddress?: Address | null;
  onAddressSelect: (address: Address) => void;
  onAddNewAddress?: () => void;
  showAddButton?: boolean;
  style?: any;
}

export default function AddressPicker({
  selectedAddress,
  onAddressSelect,
  onAddNewAddress,
  showAddButton = true,
  style,
}: AddressPickerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (modalVisible) {
      loadAddresses();
    }
  }, [modalVisible]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const userAddresses = await addressService.getUserAddresses();
      setAddresses(userAddresses);
    } catch (error: any) {
      showError('Erro', 'Não foi possível carregar os endereços');
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    setModalVisible(false);
  };

  const handleAddNewAddress = () => {
    setModalVisible(false);
    if (onAddNewAddress) {
      onAddNewAddress();
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
      >
        {selectedAddress ? (
          <View style={styles.selectedAddressContainer}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={20} color="#6CC51D" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressText} numberOfLines={2}>
                {addressService.formatAddressOneLine(selectedAddress)}
              </Text>
              {selectedAddress.isDefault && (
                <Text style={styles.defaultBadge}>Padrão</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#7F8C8D" />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={24} color="#BDC3C7" />
            <Text style={styles.emptyText}>Selecionar endereço</Text>
            <Ionicons name="chevron-down" size={20} color="#BDC3C7" />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Endereço</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6CC51D" />
                <Text style={styles.loadingText}>Carregando endereços...</Text>
              </View>
            ) : (
              <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
                {addresses.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="location-outline" size={64} color="#BDC3C7" />
                    <Text style={styles.emptyStateTitle}>Nenhum endereço cadastrado</Text>
                    <Text style={styles.emptyStateText}>
                      Adicione um endereço para continuar
                    </Text>
                  </View>
                ) : (
                  addresses.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={[
                        styles.addressItem,
                        selectedAddress?.id === address.id && styles.addressItemSelected,
                      ]}
                      onPress={() => handleAddressSelect(address)}
                    >
                      <View style={styles.addressItemIcon}>
                        <Ionicons
                          name={selectedAddress?.id === address.id ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={selectedAddress?.id === address.id ? "#6CC51D" : "#BDC3C7"}
                        />
                      </View>
                      
                      <View style={styles.addressItemInfo}>
                        <Text style={styles.addressItemText}>
                          {address.street}, {address.number}
                        </Text>
                        {address.complement && (
                          <Text style={styles.addressItemComplement}>
                            {address.complement}
                          </Text>
                        )}
                        <Text style={styles.addressItemDetails}>
                          {address.neighborhood}, {address.city} - {address.state}
                        </Text>
                        <Text style={styles.addressItemDetails}>
                          CEP: {address.zipCode}
                        </Text>
                      </View>

                      {address.isDefault && (
                        <View style={styles.defaultBadgeContainer}>
                          <Text style={styles.defaultBadgeText}>Padrão</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            {showAddButton && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewAddress}
              >
                <Ionicons name="add" size={20} color="#6CC51D" />
                <Text style={styles.addButtonText}>Adicionar Novo Endereço</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    minHeight: 60,
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    lineHeight: 20,
  },
  defaultBadge: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
    marginTop: 4,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#BDC3C7',
    marginHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  addressList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  addressItemSelected: {
    borderColor: '#6CC51D',
    backgroundColor: '#F0F9E8',
  },
  addressItemIcon: {
    marginRight: 16,
  },
  addressItemInfo: {
    flex: 1,
  },
  addressItemText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  addressItemComplement: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  addressItemDetails: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  defaultBadgeContainer: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6CC51D',
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FA',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
});