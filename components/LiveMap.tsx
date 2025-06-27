import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium } from '@expo-google-fonts/poppins';

interface Location {
  latitude: number;
  longitude: number;
}

interface LiveMapProps {
  location?: Location;
}

export default function LiveMap({ location }: LiveMapProps) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
  });

  if (!fontsLoaded) return null;

  if (!location) {
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="location-outline" size={48} color="#BDC3C7" />
        <Text style={styles.placeholderText}>
          Localização não disponível no momento
        </Text>
        <Text style={styles.placeholderSubtext}>
          A localização será exibida quando o pedido estiver em trânsito
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Placeholder do mapa - aqui você pode integrar react-native-maps */}
      <View style={styles.mapContainer}>
        <Ionicons name="location" size={32} color="#6CC51D" />
        <Text style={styles.locationText}>
          Localização atual do entregador
        </Text>
        <Text style={styles.coordinatesText}>
          Lat: {location.latitude.toFixed(6)}
        </Text>
        <Text style={styles.coordinatesText}>
          Lng: {location.longitude.toFixed(6)}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#7F8C8D" />
          <Text style={styles.infoText}>Última atualização: agora</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="speedometer-outline" size={16} color="#7F8C8D" />
          <Text style={styles.infoText}>Em movimento</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 20,
  },
  placeholderText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
    lineHeight: 16,
  },
  locationText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 8,
    marginBottom: 8,
  },
  coordinatesText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
  },
});