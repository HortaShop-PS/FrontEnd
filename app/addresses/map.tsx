import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function MapWithMarker() {
  const initialPosition = {
    latitude: -23.5505,
    longitude: -46.6333,
  };

  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'O app precisa de permissão de localização para funcionar.');
          setHasPermission(false);
        } else {
          setHasPermission(true);
        }
      } catch (e) {
        Alert.alert('Erro', 'Erro ao solicitar permissão de localização.');
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const googleMarkers = [
    {
      id: 'marker1',
      coordinates: selectedPosition,
      title: 'Localização Selecionada',
      draggable: true,
      showCallout: true,
      onDragEnd: (event) => {
        setSelectedPosition(event.nativeEvent.coordinate);
      },
    },
  ];

  const appleMarkers = [
    {
      id: 'marker1',
      coordinates: selectedPosition,
      title: 'Localização Selecionada',
      systemImage: 'mappin.and.ellipse',
      tintColor: '#6CC51D',
      draggable: true,
      onDragEnd: (event) => {
        setSelectedPosition(event.nativeEvent.coordinate);
      },
    },
  ];

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedPosition(coordinate);
  };

  const handleConfirm = () => {
    global.selectedMapLocation = selectedPosition;
    // router.back(); // descomente se usar navegação
  };

  if (loading) {
    return (
      <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Permissão de localização não concedida.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === 'android' ? (
        <GoogleMaps.View
          style={styles.map}
          initialCameraPosition={{
            target: selectedPosition,
            zoom: 15,
          }}
          markers={googleMarkers}
          onPress={handleMapPress}
        />
      ) : Platform.OS === 'ios' ? (
        <AppleMaps.View
          style={styles.map}
          cameraPosition={{
            target: selectedPosition,
            zoom: 15,
          }}
          markers={appleMarkers}
          onPress={handleMapPress}
        />
      ) : (
        <View />
      )}

      <View style={styles.bottomPanel}>
        <Text style={styles.coordinates}>
          {selectedPosition.latitude.toFixed(6)}, {selectedPosition.longitude.toFixed(6)}
        </Text>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.confirmButtonText}>Confirmar Localização</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  coordinates: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
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
    marginLeft: 8,
  },
});
