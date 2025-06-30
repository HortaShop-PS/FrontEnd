import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function MapWithMarker() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Coordenadas iniciais (São Paulo como fallback)
  const fallbackPosition = {
    latitude: -23.5505,
    longitude: -46.6333,
  };

  // Receber dados iniciais se existirem
  const initialLat = params.latitude ? parseFloat(params.latitude as string) : null;
  const initialLng = params.longitude ? parseFloat(params.longitude as string) : null;

  const [selectedPosition, setSelectedPosition] = useState(
    initialLat && initialLng 
      ? { latitude: initialLat, longitude: initialLng } 
      : fallbackPosition
  );
  const [userPosition, setUserPosition] = useState(fallbackPosition);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  useEffect(() => {
    requestLocationAndGetCurrent();
  }, []);

  const requestLocationAndGetCurrent = async () => {
    try {
      setLoading(true);
      
      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'O app precisa de permissão de localização para funcionar melhor. Usando localização padrão.');
        setHasPermission(false);
        setLoading(false);
        return;
      }

      setHasPermission(true);

      // Se não temos coordenadas iniciais dos parâmetros, pegar a localização atual
      if (!initialLat || !initialLng) {
        await getCurrentLocation();
      } else {
        // Se temos coordenadas iniciais, fazer geocodificação reversa
        await reverseGeocode(initialLat, initialLng);
      }
      
    } catch (e) {
      console.error('Erro ao solicitar permissão:', e);
      Alert.alert('Erro', 'Erro ao solicitar permissão de localização. Usando localização padrão.');
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000, // 10 segundos timeout
      });

      const currentUserPosition = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserPosition(currentUserPosition);
      
      // Se não temos posição inicial definida, usar a posição atual
      if (!initialLat || !initialLng) {
        setSelectedPosition(currentUserPosition);
        await reverseGeocode(currentUserPosition.latitude, currentUserPosition.longitude);
      }

    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      Alert.alert('Aviso', 'Não foi possível obter sua localização atual. Você pode ajustar manualmente no mapa.');
    } finally {
      setGettingLocation(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const address = results[0];
        const formattedAddress = [
          address.street,
          address.streetNumber,
          address.district,
          address.city,
          address.region
        ].filter(Boolean).join(', ');
        
        setSelectedAddress(formattedAddress || 'Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro na geocodificação reversa:', error);
      setSelectedAddress('Localização selecionada');
    }
  };

  const handleMyLocationPress = async () => {
    if (!hasPermission) {
      Alert.alert('Permissão necessária', 'Por favor, permita o acesso à localização nas configurações do app.');
      return;
    }
    await getCurrentLocation();
  };

  const googleMarkers = [
    {
      id: 'selected-marker',
      coordinates: selectedPosition,
      title: selectedAddress || 'Localização Selecionada',
      draggable: true,
      showCallout: true,
      onDragEnd: async (event) => {
        const newPosition = event.nativeEvent.coordinate;
        setSelectedPosition(newPosition);
        await reverseGeocode(newPosition.latitude, newPosition.longitude);
      },
    },
  ];

  const appleMarkers = [
    {
      id: 'selected-marker',
      coordinates: selectedPosition,
      title: selectedAddress || 'Localização Selecionada',
      systemImage: 'mappin.and.ellipse',
      tintColor: '#6CC51D',
      draggable: true,
      onDragEnd: async (event) => {
        const newPosition = event.nativeEvent.coordinate;
        setSelectedPosition(newPosition);
        await reverseGeocode(newPosition.latitude, newPosition.longitude);
      },
    },
  ];

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedPosition(coordinate);
    await reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  const handleConfirm = () => {
    // Salvar a localização selecionada e o endereço globalmente
    global.selectedMapLocation = {
      latitude: selectedPosition.latitude,
      longitude: selectedPosition.longitude,
      address: selectedAddress,
    };
    
    // Voltar para a tela anterior
    if (router.canGoBack()) {
      router.back();
    }
  };

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6CC51D" />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </SafeAreaView>
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
        <Text style={styles.headerTitle}>Selecionar no Mapa</Text>
        <TouchableOpacity onPress={handleMyLocationPress} style={styles.locationButton} disabled={gettingLocation}>
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#6CC51D" />
          ) : (
            <Ionicons name="locate" size={24} color="#6CC51D" />
          )}
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'android' ? (
          <GoogleMaps.View
            style={styles.map}
            initialCameraPosition={{
              target: selectedPosition,
              zoom: 16,
            }}
            markers={googleMarkers}
            onPress={handleMapPress}
          />
        ) : Platform.OS === 'ios' ? (
          <AppleMaps.View
            style={styles.map}
            cameraPosition={{
              target: selectedPosition,
              zoom: 16,
            }}
            markers={appleMarkers}
            onPress={handleMapPress}
          />
        ) : (
          <View style={styles.fallbackMap}>
            <Text>Mapa não suportado nesta plataforma</Text>
          </View>
        )}
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Localização Selecionada</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {selectedAddress || 'Carregando endereço...'}
          </Text>
          <Text style={styles.coordinates}>
            {formatCoordinates(selectedPosition.latitude, selectedPosition.longitude)}
          </Text>
          <Text style={styles.instruction}>
            Toque no mapa ou arraste o marcador para ajustar a localização
          </Text>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.confirmButtonText}>Confirmar Localização</Text>
        </TouchableOpacity>
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
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
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
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fallbackMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  addressText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 20,
  },
  coordinates: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  instruction: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: '#6CC51D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});