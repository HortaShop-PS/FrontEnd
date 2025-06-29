import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import orderStatusService from '../utils/orderStatusService';
import { showSuccess, showError } from '../utils/alertService';

interface StatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
  readyForPickup?: boolean;
}

export default function StatusUpdater({ orderId, currentStatus, onStatusUpdated, readyForPickup }: StatusUpdaterProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const getAvailableActions = () => {
    const actions = [];
    
    switch (currentStatus.toLowerCase()) {
      case 'pending':
        actions.push({
          key: 'processing',
          label: 'Aceitar Pedido',
          icon: 'checkmark-circle-outline',
          color: '#27AE60',
          description: 'Confirmar recebimento e iniciar preparação'
        });
        actions.push({
          key: 'canceled',
          label: 'Cancelar Pedido', 
          icon: 'close-circle-outline',
          color: '#E74C3C',
          description: 'Cancelar pedido por indisponibilidade'
        });
        break;
        
      case 'processing':
        // Duas opções após aceitar o pedido
        actions.push({
          key: 'NOTIFY_READY',
          label: 'Pronto para Coleta',
          icon: 'bag-outline',
          color: '#9B59B6',
          description: 'Cliente irá retirar no local'
        });
        actions.push({
          key: 'shipped',
          label: 'Pronto para Envio',
          icon: 'car-outline',
          color: '#3498DB',
          description: 'Enviar produto para o cliente'
        });
        break;
        
      case 'shipped':
        // Se já foi enviado, apenas confirmar entrega
        actions.push({
          key: 'delivered',
          label: 'Confirmar Entrega',
          icon: 'checkmark-done-outline',
          color: '#27AE60',
          description: 'Produto foi entregue ao cliente'
        });
        break;
    }
    
    return actions;
  };

  const handleActionPress = (action: any) => {
    setSelectedAction(action.key);
    setModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    try {
      setLoading(true);

      if (selectedAction === 'NOTIFY_READY') {
        await orderStatusService.notifyReadyForPickup(orderId, {
          message: notes || 'Pedido pronto para coleta'
        });
        showSuccess('Sucesso', 'Cliente notificado que o pedido está pronto para coleta!');
      } else {
        const statusLabels = {
          'processing': 'Pedido aceito',
          'shipped': 'Produto enviado',
          'delivered': 'Pedido entregue com sucesso',
          'canceled': 'Pedido cancelado'
        };

        await orderStatusService.updateOrderStatus(orderId, {
          status: selectedAction,
          notes: notes || undefined
        });
        
        const message = statusLabels[selectedAction as keyof typeof statusLabels] || 'Status atualizado';
        showSuccess('Sucesso', `${message}!`);
      }

      onStatusUpdated();
      setModalVisible(false);
      setNotes('');
      setSelectedAction('');
      
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      showError('Erro', error.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (selectedAction) {
      case 'NOTIFY_READY':
        return 'Notificar Coleta';
      case 'shipped':
        return 'Confirmar Envio';
      case 'delivered':
        return 'Confirmar Entrega';
      case 'processing':
        return 'Aceitar Pedido';
      case 'canceled':
        return 'Cancelar Pedido';
      default:
        return 'Atualizar Status';
    }
  };

  const getModalMessage = () => {
    switch (selectedAction) {
      case 'processing':
        return 'Tem certeza que deseja aceitar este pedido? Você se compromete a preparar os produtos.';
      case 'canceled':
        return 'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.';
      case 'NOTIFY_READY':
        return 'O cliente será notificado que o pedido está pronto para coleta no local.';
      case 'shipped':
        return 'Confirme que o produto foi enviado para entrega.';
      case 'delivered':
        return 'Confirme que o produto foi entregue ao cliente.';
      default:
        return '';
    }
  };

  const actions = getAvailableActions();

  // Se não há ações disponíveis, mostrar uma mensagem elegante
  if (actions.length === 0) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedIcon}>
          <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
        </View>
        <Text style={styles.completedText}>
          {currentStatus.toLowerCase() === 'delivered' ? 'Pedido finalizado' : 
           currentStatus.toLowerCase() === 'canceled' ? 'Pedido cancelado' : 
           'Aguardando próxima etapa'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ações Disponíveis</Text>
      
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.8}
          >
            <Ionicons name={action.icon as any} size={20} color="#FFFFFF" />
            <Text style={styles.actionLabel}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getModalTitle()}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#7F8C8D" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {getModalMessage()}
              </Text>
              
              <Text style={styles.notesLabel}>
                {selectedAction === 'canceled' ? 'Motivo do cancelamento:' : 'Observações (opcional):'}
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder={
                  selectedAction === 'canceled' 
                    ? "Ex: Produto em falta..." 
                    : selectedAction === 'shipped'
                    ? "Ex: Enviado via Correios..."
                    : "Adicione observações..."
                }
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmAction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  completedContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  completedIcon: {
    marginRight: 12,
  },
  completedText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#7F8C8D',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 12,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#2C3E50',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 16,
    lineHeight: 20,
  },
  notesLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#7F8C8D',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#6CC51D',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
});