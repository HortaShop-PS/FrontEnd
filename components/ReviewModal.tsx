import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import reviewService, { CreateReviewData } from '../utils/reviewService';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  orderItemId?: string;
  producerId?: number;
  producerName?: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  productId,
  productName,
  orderItemId,
  producerId,
  producerName,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Erro', 'Por favor, selecione uma avaliação para o produto.');
      return;
    }

    try {
      setLoading(true);      const reviewData: CreateReviewData = {
        productId,
        rating,
        comment: comment.trim() || undefined,
        orderItemId,
      };

      await reviewService.createReview(reviewData);
        Alert.alert(
        'Sucesso',
        'Sua avaliação foi enviada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              // Adiciona um pequeno delay para garantir que o backend processou a review
              setTimeout(() => {
                onReviewSubmitted?.();
              }, 500);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao enviar avaliação. Tente novamente.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  const renderStars = (currentRating: number, onPress: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onPress(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= currentRating ? 'star' : 'star-outline'}
            size={32}
            color={i <= currentRating ? '#FFD700' : '#CCCCCC'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = (rating: number) => {
    if (rating === 1) return 'Muito ruim';
    if (rating === 2) return 'Ruim';
    if (rating === 3) return 'Regular';
    if (rating === 4) return 'Bom';
    if (rating === 5) return 'Excelente';
    return '';
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Avaliar Produto</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName}>{productName}</Text>

          {/* Avaliação do Produto */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Avaliação do Produto:</Text>
            <View style={styles.starsContainer}>{renderStars(rating, setRating)}</View>
            {rating > 0 && (
              <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
            )}
          </View>

          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Comentário sobre o produto (opcional):</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Conte sua experiência com este produto..."
              placeholderTextColor="#CCCCCC"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
              )}
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
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  productName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#6CC51D',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  commentContainer: {
    marginBottom: 24,
  },
  commentLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333333',
    minHeight: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cancelButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#666666',
  },
  submitButton: {
    backgroundColor: '#6CC51D',
  },
  submitButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});
