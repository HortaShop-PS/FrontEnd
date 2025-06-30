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
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="location-outline" size={64} color="#6CC51D" />
      </View>
      <Text style={styles.emptyTitle}>Nenhum endereço cadastrado</Text>
      <Text style={styles.emptyText}>
        Adicione um endereço para facilitar suas compras e entregas
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => router.push('/addresses/add')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addFirstButtonText}>Adicionar Primeiro Endereço</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddressItem = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressIconContainer}>
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
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/addresses/edit/${address.id}`)}
        >
          <Ionicons name="pencil-outline" size={16} color="#3498DB" />
          <Text style={[styles.actionButtonText, { color: '#3498DB' }]}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
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
      {/* Header seguindo padrão flat UI */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Endereços</Text>
        </View>
        <View style={styles.headerRight}>
          {addresses.length > 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/addresses/add')}
            >
              <Ionicons name="add" size={24} color="#6CC51D" />
            </TouchableOpacity>
          )}
        </View>
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
          <View style={styles.listContainer}>
            {addresses.map(renderAddressItem)}
            
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={() => router.push('/addresses/add')}
            >
              <View style={styles.addNewIconContainer}>
                <Ionicons name="add" size={24} color="#6CC51D" />
              </View>
              <Text style={styles.addNewButtonText}>Adicionar Novo Endereço</Text>
              <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Poppins_400Regular',
  },

  // Header seguindo padrão flat UI
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#6CC51D',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Container da lista
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Empty State seguindo padrão do index.tsx
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6CC51D',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addFirstButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Address Cards seguindo padrão flat UI
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  addressHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F8F5',
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
    marginBottom: 8,
  },
  addressTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  addressComplement: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  addressDetails: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },

  // Actions seguindo padrão flat
  addressActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  editButton: {
    backgroundColor: '#EBF3FD',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#6CC51D',
    marginLeft: 6,
  },

  // Add New Button seguindo padrão flat
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6CC51D',
    borderStyle: 'dashed',
  },
  addNewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addNewButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#6CC51D',
    flex: 1,
  },
});