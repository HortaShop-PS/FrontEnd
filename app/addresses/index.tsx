import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import addressService, { Address } from '../../utils/addressService';
import { showError, showSuccess } from '../../utils/alertService';

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const userAddresses = await addressService.getUserAddresses();
      setAddresses(userAddresses);
    } catch (error: any) {
      showError('Erro', 'Não foi possível carregar os endereços');
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteAddress = (address: Address) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir o endereço "${address.street}, ${address.number}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteAddress(address.id),
        },
      ]
    );
  };

  const deleteAddress = async (addressId: number) => {
    try {
      await addressService.deleteAddress(addressId);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      showSuccess('Sucesso', 'Endereço excluído com sucesso!');
    } catch (error: any) {
      showError('Erro', error.message || 'Erro ao excluir endereço');
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await addressService.setDefaultAddress(address.id);
      
      // Atualizar lista local
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === address.id,
      })));
      
      showSuccess('Sucesso', 'Endereço padrão atualizado!');
    } catch (error: any) {
      showError('Erro', error.message || 'Erro ao definir endereço padrão');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={80} color="#BDC3C7" />
      <Text style={styles.emptyTitle}>Nenhum endereço cadastrado</Text>
      <Text style={styles.emptyText}>
        Adicione um endereço para facilitar suas compras
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => router.push('/addresses/add')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addFirstButtonText}>Adicionar Primeiro Endereço</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddressItem = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressIcon}>
          <Ionicons name="location" size={20} color="#6CC51D" />
        </View>
        <View style={styles.addressInfo}>
          <View style={styles.addressTitleRow}>
            <Text style={styles.addressTitle}>
              {address.street}, {address.number}
            </Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Padrão</Text>
              </View>
            )}
          </View>
          {address.complement && (
            <Text style={styles.addressComplement}>{address.complement}</Text>
          )}
          <Text style={styles.addressDetails}>
            {address.neighborhood}, {address.city} - {address.state}
          </Text>
          <Text style={styles.addressDetails}>CEP: {address.zipCode}</Text>
        </View>
      </View>

      <View style={styles.addressActions}>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(address)}
          >
            <Ionicons name="star-outline" size={16} color="#6CC51D" />
            <Text style={styles.actionButtonText}>Tornar padrão</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/addresses/edit/${address.id}`)}
        >
          <Ionicons name="pencil-outline" size={16} color="#3498DB" />
          <Text style={[styles.actionButtonText, { color: '#3498DB' }]}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteAddress(address)}
        >
          <Ionicons name="trash-outline" size={16} color="#E74C3C" />
          <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
        <Text style={styles.loadingText}>Carregando endereços...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Endereços</Text>
        {addresses.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/addresses/add')}
          >
            <Ionicons name="add" size={24} color="#6CC51D" />
          </TouchableOpacity>
        )}
      </View>

      {addresses.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAddresses(true)}
              colors={['#6CC51D']}
              tintColor="#6CC51D"
            />
          }
        >
          {addresses.map(renderAddressItem)}
          
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => router.push('/addresses/add')}
          >
            <Ionicons name="add-circle" size={24} color="#6CC51D" />
            <Text style={styles.addNewButtonText}>Adicionar Novo Endereço</Text>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}
    </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Poppins_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginTop: 24,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6CC51D',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  addFirstButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  addressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  addressComplement: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6CC51D',
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FA',
  },
  addNewButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
});