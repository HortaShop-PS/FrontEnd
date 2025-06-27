import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_500Medium } from '@expo-google-fonts/poppins';

interface TimelineItem {
  id?: string;
  status: string;
  createdAt: string;
  notes?: string;
}

interface OrderTimelineProps {
  timeline: TimelineItem[];
  currentStatus: string;
}

export default function OrderTimeline({ timeline, currentStatus }: OrderTimelineProps) {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
  });

  if (!fontsLoaded) return null;

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pedido Recebido';
      case 'processing': return 'Em Preparação';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'canceled': return 'Cancelado';
      default: return status.toUpperCase();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'time-outline';
      case 'processing': return 'construct-outline';
      case 'shipped': return 'car-outline';
      case 'delivered': return 'checkmark-circle-outline';
      case 'canceled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (status.toLowerCase() === 'canceled') return '#E74C3C';
    if (isCurrent) return '#6CC51D';
    return '#BDC3C7';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum histórico disponível</Text>
      </View>
    );
  }

  return (
    <View style={styles.timeline}>
      {timeline.map((item, idx) => {
        const isCurrent = item.status.toLowerCase() === currentStatus.toLowerCase();
        const statusColor = getStatusColor(item.status, isCurrent);
        const isLast = idx === timeline.length - 1;

        return (
          <View key={item.id || idx} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]}>
                <Ionicons 
                  name={getStatusIcon(item.status) as any} 
                  size={12} 
                  color="#FFFFFF" 
                />
              </View>
              {!isLast && (
                <View style={[styles.timelineLine, { backgroundColor: statusColor }]} />
              )}
            </View>
            
            <View style={styles.timelineContent}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
              <Text style={styles.timelineDate}>
                {formatDate(item.createdAt)}
              </Text>
              {item.notes && (
                <Text style={styles.timelineNotes}>{item.notes}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    paddingLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#7F8C8D',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
    minHeight: 32,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  statusLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  timelineDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  timelineNotes: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#9B59B6',
    fontStyle: 'italic',
  },
});