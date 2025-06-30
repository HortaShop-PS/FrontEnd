import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getCart } from '../utils/cartService';
import { 
  checkoutService, 
  CheckoutSummary, 
  Address, 
  CalculateTotalResponse 
} from '../utils/checkoutService';
import { showError, showSuccess } from '../utils/alertService';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
  };
}

interface CartResponse {
  id: string;
  userId: number;
  items: CartItem[];
  total: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [checkout, setCheckout] = useState<CheckoutSummary | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [totals, setTotals] = useState<CalculateTotalResponse>({
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    total: 0
  });

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Informações do estabelecimento para retirada
  const storeInfo = {
    name: "HortaShop - Loja Principal",
    address: "Rua das Hortaliças, 123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    phone: "(11) 99999-9999",
    hours: "Segunda a Sábado: 8h às 18h\nDomingo: 8h às 14h"
  };

  useEffect(() => {
    initializeCheckout();
  }, []);

  useEffect(() => {
    if (checkout) {
      // Para delivery, precisa de endereço selecionado
      // Para pickup, usa as informações da loja
      if (deliveryMethod === 'delivery' && selectedAddress) {
        calculateTotals();
      } else if (deliveryMethod === 'pickup') {
        calculateTotals();
      }
    }
  }, [selectedAddress, deliveryMethod]);

  // Reload addresses when returning from add address screen
  useFocusEffect(
    React.useCallback(() => {
      // Only reload addresses if we have addresses and delivery method is delivery
      if (addresses.length > 0 && deliveryMethod === 'delivery') {
        reloadAddresses();
      }
    }, [addresses.length, deliveryMethod])
  );

  const initializeCheckout = async () => {
    try {
      setLoading(true);
      
      // Carregar carrinho
      const cartData = await getCart();
      setCart(cartData);

      if (!cartData || cartData.items.length === 0) {
        showError('Erro', 'Carrinho vazio');
        router.back();
        return;
      }

      // Iniciar checkout
      const checkoutData = await checkoutService.initiateCheckout({
        cartId: parseInt(cartData.id)
      });
      setCheckout(checkoutData);

      // Carregar endereços apenas se método for delivery
      if (deliveryMethod === 'delivery') {
        const userAddresses = await checkoutService.getUserAddresses();
        setAddresses(userAddresses);
        
        // Selecionar endereço padrão
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }

      setTotals({
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discount,
        deliveryFee: checkoutData.deliveryFee,
        total: checkoutData.total
      });

    } catch (error: any) {
      console.error('Erro ao inicializar checkout:', error);
      showError('Erro', error.message || 'Não foi possível inicializar o checkout');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const reloadAddresses = async () => {
    try {
      const userAddresses = await checkoutService.getUserAddresses();
      setAddresses(userAddresses);
      
      // Select the most recently added address (last in array) or default
      const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[userAddresses.length - 1];
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error: any) {
      console.error('Erro ao recarregar endereços:', error);
      showError('Erro', 'Não foi possível carregar os endereços');
    }
  };

  const calculateTotals = async () => {
    if (!checkout) return;

    // Para pickup, não precisa de endereço selecionado
    if (deliveryMethod === 'delivery' && !selectedAddress) return;

    try {
      const totalsData = await checkoutService.calculateTotal({
        orderId: checkout.orderId,
        addressId: deliveryMethod === 'delivery' ? selectedAddress!.id : 1, // ID fictício para pickup
        deliveryMethod,
        couponCode: undefined
      });
      
      setTotals(totalsData);
    } catch (error: any) {
      console.error('Erro ao calcular totais:', error);
      showError('Erro', 'Não foi possível calcular os totais');
    }
  };

  const handleDeliveryMethodChange = async (method: 'delivery' | 'pickup') => {
    setDeliveryMethod(method);
    
    if (method === 'delivery' && addresses.length === 0) {
      // Carregar endereços se ainda não foram carregados
      try {
        const userAddresses = await checkoutService.getUserAddresses();
        setAddresses(userAddresses);
        
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      } catch (error: any) {
        console.error('Erro ao carregar endereços:', error);
        showError('Erro', 'Não foi possível carregar os endereços');
      }
    } else if (method === 'pickup') {
      // Limpar endereço selecionado para pickup
      setSelectedAddress(null);
    }
  };

  const handleAddNewAddress = () => {
    setAddressModalVisible(false);
    // Navigate to add address screen with return parameter
    router.push({
      pathname: '/addresses/add',
      params: { returnTo: 'checkout' }
    });
  };

  const handleProceedToPayment = async () => {
    if (!checkout) {
      showError('Erro', 'Dados do checkout não encontrados');
      return;
    }

    // Validar se tem endereço selecionado para delivery
    if (deliveryMethod === 'delivery' && !selectedAddress) {
      showError('Erro', 'Selecione um endereço para entrega');
      return;
    }

    try {
      setProcessing(true);

      // Atualizar endereço e método de entrega
      await checkoutService.updateAddressAndDelivery({
        orderId: checkout.orderId,
        addressId: deliveryMethod === 'delivery' ? selectedAddress!.id : 1, // ID fictício para pickup
        deliveryMethod
      });

      // Navegar para pagamento
      router.push({
        pathname: '/payment',
        params: {
          orderId: checkout.orderId,
          amount: totals.total,
          orderTotal: `R$ ${totals.total.toFixed(2).replace('.', ',')}`
        }
      });

    } catch (error: any) {
      console.error('Erro ao prosseguir para pagamento:', error);
      showError('Erro', error.message || 'Não foi possível prosseguir para o pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const renderProgressSteps = () => (
    <View style={styles.progressContainer}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.stepCompleted]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
        <Text style={styles.stepLabel}>Carrinho</Text>
      </View>
      
      <View style={styles.stepConnector} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, styles.stepActive]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Checkout</Text>
      </View>
      
      <View style={styles.stepConnector} />
      
      <View style={styles.stepContainer}>
        <View style={styles.stepCircle}>
          <Text style={[styles.stepNumber, styles.stepNumberInactive]}>3</Text>
        </View>
        <Text style={styles.stepLabel}>Pagamento</Text>
      </View>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
      {cart?.items.map((item, index) => (
        <View key={item.id} style={styles.orderItem}>
          <View style={styles.productImageContainer}>
            <Image 
              source={{ uri: `${API_BASE_URL}${item.product.imageUrl}` }}
              style={styles.productImage}
              defaultSource={require('../assets/images/logo/hortaShop_sem_fundo.png')}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
              <Text style={styles.itemPrice}>
                R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderDeliveryOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Método de Entrega</Text>
      <View style={styles.deliveryOptionsContainer}>
        <TouchableOpacity
          style={[
            styles.deliveryOption,
            deliveryMethod === 'delivery' && styles.deliveryOptionSelected
          ]}
          onPress={() => handleDeliveryMethodChange('delivery')}
        >
          <View style={styles.deliveryOptionIcon}>
            <Ionicons 
              name="car" 
              size={24} 
              color={deliveryMethod === 'delivery' ? '#6CC51D' : '#BDC3C7'} 
            />
          </View>
          <Text style={[
            styles.deliveryOptionText,
            deliveryMethod === 'delivery' && styles.deliveryOptionTextSelected
          ]}>
            Entrega
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.deliveryOption,
            deliveryMethod === 'pickup' && styles.deliveryOptionSelected
          ]}
          onPress={() => handleDeliveryMethodChange('pickup')}
        >
          <View style={styles.deliveryOptionIcon}>
            <Ionicons 
              name="storefront" 
              size={24} 
              color={deliveryMethod === 'pickup' ? '#6CC51D' : '#BDC3C7'} 
            />
          </View>
          <Text style={[
            styles.deliveryOptionText,
            deliveryMethod === 'pickup' && styles.deliveryOptionTextSelected
          ]}>
            Retirada
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddressSection = () => {
    if (deliveryMethod === 'pickup') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local de Retirada</Text>
          <View style={styles.storeInfoCard}>
            <View style={styles.storeIcon}>
              <Ionicons name="storefront" size={24} color="#6CC51D" />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeInfo.name}</Text>
              <Text style={styles.storeAddress}>
                {storeInfo.address}
              </Text>
              <Text style={styles.storeAddress}>
                {storeInfo.neighborhood}, {storeInfo.city} - {storeInfo.state}
              </Text>
              <Text style={styles.storeAddress}>CEP: {storeInfo.zipCode}</Text>
              
              <View style={styles.storeDetails}>
                <View style={styles.storeDetailItem}>
                  <Ionicons name="call" size={16} color="#6CC51D" />
                  <Text style={styles.storeDetailText}>{storeInfo.phone}</Text>
                </View>
                <View style={styles.storeDetailItem}>
                  <Ionicons name="time" size={16} color="#6CC51D" />
                  <Text style={styles.storeDetailText}>{storeInfo.hours}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.pickupNotice}>
            <Ionicons name="information-circle" size={20} color="#6CC51D" />
            <Text style={styles.pickupNoticeText}>
              Após a confirmação do pagamento, você receberá um código para retirada. 
              Apresente este código na loja junto com um documento de identificação.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={() => setAddressModalVisible(true)}
          >
            <Text style={styles.changeButtonText}>Alterar</Text>
          </TouchableOpacity>
        </View>
        
        {selectedAddress ? (
          <View style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={20} color="#6CC51D" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>
                {selectedAddress.street}, {selectedAddress.number}
              </Text>
              {selectedAddress.complement && (
                <Text style={styles.addressComplement}>{selectedAddress.complement}</Text>
              )}
              <Text style={styles.addressText}>
                {selectedAddress.neighborhood}, {selectedAddress.city} - {selectedAddress.state}
              </Text>
              <Text style={styles.addressText}>CEP: {selectedAddress.zipCode}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addAddressCard}
            onPress={() => setAddressModalVisible(true)}
          >
            <Ionicons name="add-circle" size={32} color="#6CC51D" />
            <Text style={styles.addAddressText}>Adicionar Endereço</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTotalSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Resumo de Valores</Text>
      <View style={styles.totalContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>R$ {totals.subtotal.toFixed(2).replace('.', ',')}</Text>
        </View>
        {totals.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Desconto</Text>
            <Text style={[styles.totalValue, styles.discountValue]}>
              -R$ {totals.discount.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Frete</Text>
          <Text style={styles.totalValue}>
            {totals.deliveryFee > 0 
              ? `R$ ${totals.deliveryFee.toFixed(2).replace('.', ',')}`
              : 'Grátis'
            }
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.finalTotalLabel}>Total</Text>
          <Text style={styles.finalTotalValue}>
            R$ {totals.total.toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAddressModal = () => (
    <Modal
      visible={addressModalVisible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Endereço</Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.addressList}>
            {addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressModalItem,
                  selectedAddress?.id === address.id && styles.addressModalItemSelected
                ]}
                onPress={() => {
                  setSelectedAddress(address);
                  setAddressModalVisible(false);
                }}
              >
                <View style={styles.addressModalInfo}>
                  <Text style={styles.addressModalText}>
                    {address.street}, {address.number}
                  </Text>
                  {address.complement && (
                    <Text style={styles.addressModalComplement}>{address.complement}</Text>
                  )}
                  <Text style={styles.addressModalText}>
                    {address.neighborhood}, {address.city} - {address.state}
                  </Text>
                  <Text style={styles.addressModalText}>CEP: {address.zipCode}</Text>
                </View>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Padrão</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.addNewAddressButton} onPress={handleAddNewAddress}>
            <Ionicons name="add" size={20} color="#6CC51D" />
            <Text style={styles.addNewAddressText}>Adicionar Novo Endereço</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
        <Text style={styles.loadingText}>Carregando checkout...</Text>
      </View>
    );
  }

  // Validar se pode prosseguir para pagamento
  const canProceedToPayment = deliveryMethod === 'pickup' || (deliveryMethod === 'delivery' && selectedAddress);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Compra</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      {renderProgressSteps()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        {renderOrderSummary()}

        {/* Delivery Options */}
        {renderDeliveryOptions()}

        {/* Address Section */}
        {renderAddressSection()}

        {/* Total Summary */}
        {renderTotalSummary()}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total:</Text>
          <Text style={styles.footerTotalValue}>
            R$ {totals.total.toFixed(2).replace('.', ',')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.paymentButton, (!canProceedToPayment || processing) && styles.paymentButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={processing || !canProceedToPayment}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.paymentButtonText}>Ir para Pagamento</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Modal - só aparece se método for delivery */}
      {deliveryMethod === 'delivery' && renderAddressModal()}
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    
  },
  stepContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#6CC51D',
  },
  stepActive: {
    backgroundColor: '#6CC51D',
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  stepNumberInactive: {
    color: '#BDC3C7',
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  stepLabelActive: {
    color: '#6CC51D',
    fontFamily: 'Poppins_600SemiBold',
  },
  stepConnector: {
    height: 2,
    backgroundColor: '#ECF0F1',
    flex: 1,
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  changeButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6CC51D',
  },
  changeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  deliveryOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryOption: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ECF0F1',
  },
  deliveryOptionSelected: {
    backgroundColor: '#F0F9E8',
    borderColor: '#6CC51D',
  },
  deliveryOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryOptionText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#7F8C8D',
  },
  deliveryOptionTextSelected: {
    color: '#6CC51D',
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
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
  addressText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    marginBottom: 2,
  },
  addressComplement: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  addAddressCard: {
    backgroundColor: '#F8F9FA',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6CC51D',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
    marginTop: 8,
  },
  // Novos estilos para a informação da loja
  storeInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9E8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6CC51D',
    marginBottom: 16,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6CC51D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    marginBottom: 2,
  },
  storeDetails: {
    marginTop: 8,
  },
  storeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeDetailText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    marginLeft: 6,
    flex: 1,
  },
  pickupNotice: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6CC51D',
  },
  pickupNoticeText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  totalContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  discountValue: {
    color: '#E74C3C',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#ECF0F1',
    marginVertical: 8,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  finalTotalValue: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerTotalLabel: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  footerTotalValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#6CC51D',
  },
  paymentButton: {
    backgroundColor: '#6CC51D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  paymentButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
  },
  addressList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addressModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  addressModalItemSelected: {
    borderColor: '#6CC51D',
    backgroundColor: '#F0F9E8',
  },
  addressModalInfo: {
    flex: 1,
  },
  addressModalText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    marginBottom: 2,
  },
  addressModalComplement: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  defaultBadge: {
    backgroundColor: '#6CC51D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6CC51D',
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FA',
  },
  addNewAddressText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6CC51D',
  },
});