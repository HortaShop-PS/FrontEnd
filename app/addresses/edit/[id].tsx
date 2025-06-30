import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { addressService, UpdateAddressData, Address } from '../../../utils/addressService';
import AddressForm from '../../../components/AddressForm';
import { showError, showSuccess } from '../../../utils/alertService';

export default function EditAddressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAddress(parseInt(id));
    }
  }, [id]);

  const loadAddress = async (addressId: number) => {
    try {
      setInitialLoading(true);
      const addressData = await addressService.getAddressById(addressId);
      setAddress(addressData);
    } catch (error: any) {
      console.error('Erro ao carregar endereço:', error);
      showError('Erro', 'Não foi possível carregar o endereço');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateAddressData) => {
    if (!address) return;

    try {
      setLoading(true);
      
      await addressService.updateAddress(address.id, data);
      
      showSuccess(
        'Sucesso!',
        'Endereço atualizado com sucesso',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao atualizar endereço:', error);
      showError('Erro', error.message || 'Não foi possível atualizar o endereço');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Editar Endereço',
            headerStyle: { backgroundColor: '#6CC51D' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontFamily: 'Poppins_600SemiBold' },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6CC51D" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Editar Endereço',
          headerStyle: { backgroundColor: '#6CC51D' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Poppins_600SemiBold' },
        }}
      />

      <View style={styles.container}>
        <AddressForm
          initialData={address || undefined}
          onSubmit={handleSubmit}
          loading={loading}
          submitButtonText="Atualizar Endereço"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});