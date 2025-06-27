import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import Button from '../components/Button';
import { cardService, ApiCard } from '../utils/cardService';
import paymentService from '../utils/paymentService';
import { showError, showSuccess } from '../utils/alertService';
import { getCart, clearCart } from '../utils/cartService'; // Importar getCart e clearCart

const CARD_LOGOS = {
  'mastercard': require('../assets/images/mastercard_logo.png'),
  'visa': require('../assets/images/visa_logo.png'),
};

const PIX_LOGO = require('../assets/images/pix_logo.png');

const PAYMENT_METHODS = [
  { id: 'card', name: 'Cartão de Crédito', icon: 'card-outline' },
  { id: 'pix', name: 'PIX', icon: PIX_LOGO },
];

export default function PaymentScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pix'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [principalCard, setPrincipalCard] = useState<ApiCard | null>(null);
  const [cardForm, setCardForm] = useState({
    cardholderName: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [loadingCard, setLoadingCard] = useState(true);
  const [cartTotal, setCartTotal] = useState(0); // Estado para o total do carrinho
  const [loadingCart, setLoadingCart] = useState(true); // Estado para o carregamento do carrinho

  let [fontsLoaded, fontError] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    async function fetchPrincipalCard() {
      setLoadingCard(true);
      try {
        const cards = await cardService.getCards();
        const principal = cards.find(c => c.isPrincipal) || cards[0];
        setPrincipalCard(principal || null);
        if (principal) {
          setCardForm({
            cardholderName: principal.cardholderName,
            number: '**** **** **** ' + (principal.last4Digits || principal.number?.slice(-4) || 'XXXX'),
            expiry: principal.expiryMonth && principal.expiryYear ? `${principal.expiryMonth}/${principal.expiryYear.slice(-2)}` : principal.expiry || '',
            cvv: '',
          });
        }
      } catch (e: any) {
        setPrincipalCard(null);
      } finally {
        setLoadingCard(false);
      }
    }

    // Carregar total do carrinho
    async function fetchCartTotal() {
      try {
        const cart = await getCart();
        setCartTotal(cart.total);
      } catch (error) {
        if (error instanceof Error) {
          showError('Erro ao carregar o carrinho', error.message);
        } else {
          showError('Erro ao carregar o carrinho', 'Erro desconhecido');
        }
      } finally {
        setLoadingCart(false);
      }
    }

    fetchPrincipalCard();
    fetchCartTotal();
  }, []);

  const handlePixPayment = async () => {
    setIsProcessing(true);
    try {
      const pixResponse = await paymentService.processPixPayment({
        orderId: 123, // Substituir pelo ID real do pedido
        amount: cartTotal,
      });
      setPixData(pixResponse);
      showSuccess('Pagamento PIX iniciado com sucesso!', 'Aguarde a confirmação.');
    } catch (error) {
      if (error instanceof Error) {
        showError('Erro ao processar pagamento PIX', error.message);
      } else {
        showError('Erro ao processar pagamento PIX', 'Erro desconhecido');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    try {
      const cardResponse = await paymentService.processCardPayment({
        cardDetails: cardForm,
        orderId: 123, // Substituir pelo ID real do pedido
        amount: cartTotal,
      });
      showSuccess('Pagamento com cartão realizado com sucesso!', 'Seu pedido foi confirmado.');
      clearCart();
      router.push('/cart');
    } catch (error) {
      if (error instanceof Error) {
        showError('Erro ao processar pagamento com cartão', error.message);
      } else {
        showError('Erro ao processar pagamento com cartão', 'Erro desconhecido');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!fontsLoaded || loadingCard || loadingCart) { // Adicionar loadingCart à condição
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  // Barra de progresso centralizada
  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        {/* ENTREGA */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <Text style={styles.progressLabel}>ENTREGA</Text>
        </View>
        {/* Linha */}
        <View style={styles.progressLine} />
        {/* ENDEREÇO */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <Text style={styles.progressLabel}>ENDEREÇO</Text>
        </View>
        {/* Linha */}
        <View style={styles.progressLine} />
        {/* PAGAMENTO */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.progressCircleActive]}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <Text style={styles.progressLabel}>PAGAMENTO</Text>
        </View>
      </View>
    </View>
  );

  // Cartão visual
  const renderCard = () => {
    if (!principalCard) return null;
    const brand = (principalCard.brand || '').toLowerCase();
    const cardLogo = CARD_LOGOS[brand as 'mastercard' | 'visa'] || CARD_LOGOS['mastercard'];
    return (
      <View style={styles.cardPreview}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image source={cardLogo} style={styles.cardLogo} resizeMode="contain" />
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </View>
        <Text style={styles.cardNumberPreview}>•••• •••• •••• {principalCard.last4Digits}</Text>
        <View style={styles.cardDetailsPreview}>
          <View>
            <Text style={styles.cardLabelPreview}>TITULAR DO CARTÃO</Text>
            <Text style={styles.cardValuePreview}>{principalCard.cardholderName?.toUpperCase() || 'NOME DO TITULAR'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardLabelPreview}>VALIDADE</Text>
            <Text style={styles.cardValuePreview}>{principalCard.expiryMonth}/{principalCard.expiryYear?.slice(-2)}</Text>
          </View>
        </View>
        {/* Decoração */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeDiamond, styles.diamond1]} />
      </View>
    );
  };

  // Resumo da Compra
  const renderOrderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Resumo da Compra</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Subtotal</Text>
        <Text style={styles.summaryText}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Frete</Text>
        <Text style={styles.summaryText}>Grátis</Text>
      </View>
      <View style={styles.summarySeparator} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryTotalLabel}>Total</Text>
        <Text style={styles.summaryTotalValue}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pagamento</Text>
        <View style={styles.headerButton} />
      </View>
      {renderProgress()}
      {/* Resumo da Compra */}
      {renderOrderSummary()}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Métodos de pagamento */}
        <View style={styles.paymentMethodsRow}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentMethodBox, selectedMethod === method.id && styles.paymentMethodBoxSelected]}
              onPress={() => setSelectedMethod(method.id as 'card' | 'pix')}
            >
              {method.id === 'pix' ? (
                <Image source={method.icon} style={{ width: 48, height: 48, marginBottom: 2 }} resizeMode="contain" />
              ) : (
                <Ionicons name={method.icon as any} size={32} color={selectedMethod === method.id ? '#6CC51D' : '#BDBDBD'} />
              )}
              <Text style={[styles.paymentMethodText, selectedMethod === method.id && styles.paymentMethodTextSelected]}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Cartão principal */}
        {selectedMethod === 'card' && (
          <>
            {renderCard()}
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={async () => {
                await router.push('/addCard');
                // Quando voltar, a tela será recarregada normalmente pelo useEffect
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#6CC51D" style={styles.addCardIcon} />
              <Text style={styles.addCardButtonText}>Adicionar outro cartão</Text>
            </TouchableOpacity>
          </>
        )}
        {/* Mock de PIX */}
        {selectedMethod === 'pix' && (
          <View style={styles.pixContainer}>
            <View style={styles.pixBox}>
              <Image source={PIX_LOGO} style={{ width: 120, height: 120, marginBottom: 20 }} resizeMode="contain" />
              <Text style={styles.pixCode}>0002012633...1234567890</Text>
              <Text style={styles.pixExpiry}>Expira em: 10 min</Text>
            </View>
            <Button
              title={isProcessing ? 'Processando...' : 'Fazer pagamento'}
              onPress={async () => {
                setIsProcessing(true);
                try {
                  // Simulação de pagamento PIX
                  // Em um cenário real, você chamaria o paymentService.processPixPayment aqui
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API
                  
                  showSuccess('PIX', 'Pagamento via PIX realizado com sucesso!');
                  await clearCart(); // Limpa o carrinho
                  router.replace('/'); // Navega para a home, impedindo voltar para pagamento
                } catch (e: any) {
                  showError('Erro', e.message || 'Erro ao processar PIX');
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
            />
          </View>
        )}
        {/* Botão de pagamento (apenas para cartão) */}
        {selectedMethod === 'card' && (
          <Button
            title={isProcessing ? 'Processando...' : 'Fazer pagamento'}
            onPress={async () => {
              setIsProcessing(true);
              try {
                // Simulação de pagamento com Cartão
                // Em um cenário real, você chamaria o paymentService.processCardPayment aqui
                // com os dados do principalCard ou um novo cartão se fosse o caso.
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API

                showSuccess('Pagamento', 'Pagamento via Cartão realizado com sucesso!');
                await clearCart(); // Limpa o carrinho
                router.replace('/'); // Navega para a home, impedindo voltar para pagamento
              } catch (e: any) {
                showError('Erro', e.message || 'Erro ao processar pagamento');
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    headerButton: {
        padding: 8,
        minWidth: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        color: '#212529',
        textAlign: 'center',
    },
    progressContainer: {
        backgroundColor: '#F8F9FA',
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    progressStep: {
        alignItems: 'center',
        width: 80,
    },
    progressCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#BDBDBD',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    progressCircleActive: {
        backgroundColor: '#6CC51D',
    },
    progressLine: {
        height: 4,
        backgroundColor: '#6CC51D',
        flex: 1,
        marginHorizontal: 2,
        borderRadius: 2,
        minWidth: 24,
        maxWidth: 40,
    },
    progressLabel: {
        fontSize: 12,
        color: '#6CC51D',
        fontFamily: 'Poppins_600SemiBold',
        textAlign: 'center',
        marginTop: 2,
    },
    paymentMethodsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
        marginTop: 10,
    },
    paymentMethodBox: {
        flex: 1,
        alignItems: 'center',
        padding: 18,
        borderRadius: 12,
        backgroundColor: '#E0E2E6', // cinza mais escuro
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#E0E2E6', // cinza mais escuro
    },
    paymentMethodBoxSelected: {
        backgroundColor: '#fff',
        borderColor: '#6CC51D',
        shadowColor: '#6CC51D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#BDBDBD',
        fontFamily: 'Poppins_400Regular',
        marginTop: 8,
    },
    paymentMethodTextSelected: {
        color: '#6CC51D',
        fontFamily: 'Poppins_600SemiBold',
    },
    cardPreview: {
        marginTop: 18,
        marginBottom: 18,
        marginHorizontal: 0,
        borderRadius: 15,
        padding: 20,
        height: 180,        justifyContent: 'space-between',
        overflow: 'hidden',
        backgroundColor: '#8EE000',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    cardLogo: {
        width: 60,
        height: 38,
        alignSelf: 'flex-start',
        opacity: 0.8,
    },
    cardNumberPreview: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 20,
        color: '#FFFFFF',
        letterSpacing: 1.5,
        textAlign: 'center',
        marginTop: 10,
    },
    cardDetailsPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardLabelPreview: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 10,
        color: '#F0F0F0',
        opacity: 0.8,
        marginBottom: 2,
    },
    cardValuePreview: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
    },
    decorativeCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 50,
    },
    circle1: {
        width: 80,
        height: 80,
        top: -20,
        right: 50,
    },
    circle2: {
        width: 120,
        height: 120,
        bottom: -60,
        right: -30,
    },
    decorativeDiamond: {
        position: 'absolute',
        width: 30,
        height: 30,
        backgroundColor: 'rgba(255, 200, 0, 0.3)',
        transform: [{ rotate: '45deg' }],
    },
    diamond1: {
        bottom: 25,
        right: 70,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        marginTop: 0,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    rowInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    halfInput: {
        flex: 0.48,
    },
    saveCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        marginTop: 5,
    },
    saveCardLabel: {
        marginLeft: 10,
        color: '#343A40',
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
    },
    payButton: {
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: '#8EE000', // mesma cor do cartão
    },
    pixContainer: {
        backgroundColor: '#F4F5F9',
        borderRadius: 12,
        padding: 18,
        marginTop: 18,
        marginBottom: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    pixBox: {
        alignItems: 'center',
        marginBottom: 10,
    },
    pixTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#6CC51D',
        marginBottom: 8,
    },
    pixCode: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#333',
        marginBottom: 8,
    },
    pixExpiry: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#999',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: { padding: 20, paddingBottom: 40 },
    summaryContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        marginTop: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    summaryTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#333',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#555',
    },
    summarySeparator: {
        height: 1,
        backgroundColor: '#E9ECEF',
        marginVertical: 10,
    },
    summaryTotalLabel: {
        fontSize: 18,
        fontFamily: 'Poppins_700Bold',
        color: '#212529',
    },
    summaryTotalValue: {
        fontSize: 18,
        fontFamily: 'Poppins_700Bold',
        color: '#6CC51D',
    },
    addCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginLeft: 4,
        marginBottom: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F4F6F8',
    },
    addCardButtonText: {
        color: '#6CC51D',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        textAlignVertical: 'center', // Added for better vertical alignment of text
        includeFontPadding: false, // Added for Android text padding consistency
    },
    addCardIcon: { // New style for the icon
        marginRight: 6, // Existing spacing
    },
});
