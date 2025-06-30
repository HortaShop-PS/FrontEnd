import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient';
import { cardService, CreateCardPayload } from '../utils/cardService';
import { showAlert, showError, showSuccess } from '../utils/alertService';
import InputField from '../components/InputField';
import Button from '../components/Button';

const mastercardLogo = require('../assets/images/mastercard_logo.png');

export default function AddCardScreen() {
    const router = useRouter();
    const [cardholderName, setCardholderName] = useState('');
    const [number, setNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [brand, setBrand] = useState('');
    const [nickname, setNickname] = useState('');
    const [paymentMethodType, setPaymentMethodType] = useState('credit');
    const [isSubmitting, setIsSubmitting] = useState(false);

    let [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6CC51D" />
                </View>
            </SafeAreaView>
        );
    }

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join('  ') || '';
        return formatted.substring(0, 22); 
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length > 2) {
            if(cleaned.length === 3 && text.endsWith('/')) return `${cleaned.slice(0, 2)}`;
            return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
        }
        return cleaned;
    };
    
    const detectBrand = (cardNumber: string): string => {
        const cleanedNumber = cardNumber.replace(/\s/g, '');
        if (/^4/.test(cleanedNumber)) return 'visa';
        if (/^5[1-5]/.test(cleanedNumber)) return 'mastercard';
        if (/^3[47]/.test(cleanedNumber)) return 'amex';
        return ''; 
    };

    const handleAddCard = async () => {
        const detectedBrandValue = brand.trim().toLowerCase() || detectBrand(number);
        if (!cardholderName.trim() || !number.trim() || !expiry.trim() || !cvv.trim() || !detectedBrandValue) {
            showError("Campos Incompletos", "Preencha todos os campos do cartão. A bandeira será detectada automaticamente.");
            return;
        }
        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
            showError("Dados Inválidos", "Data de validade inválida. Use o formato MM/AA.");
            return;
        }
        if (cvv.length < 3 || cvv.length > 4) {
            showError("Dados Inválidos", "CVV inválido. Deve ter 3 ou 4 dígitos.");
            return;
        }
        const cardNumberCleaned = number.replace(/\s/g, '');
        if (cardNumberCleaned.length < 13 || cardNumberCleaned.length > 19) {
            showError("Dados Inválidos", "Número do cartão inválido. Deve ter entre 13 e 19 dígitos.");
            return;
        }
        const payload: CreateCardPayload = {
            cardholderName: cardholderName.trim(),
            number: cardNumberCleaned,
            expiry: expiry,
            cvv: cvv,
            brand: detectedBrandValue,
            nickname: nickname.trim() || undefined,
            paymentMethodType: paymentMethodType,
        };
        setIsSubmitting(true);
        try {
            await cardService.createCard(payload);
            showSuccess("Sucesso", "Cartão adicionado com sucesso!");
            router.replace('/cards');
        } catch (e: any) {
            showError("Erro", e.message || "Erro ao adicionar cartão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.screen}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollViewContent} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header moderno */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>💳 Adicionar Cartão</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.container}>
                        {/* Card Preview moderno */}
                        <View style={styles.cardPreviewContainer}>
                            <LinearGradient
                                colors={['#6CC51D', '#5AB91A']}
                                style={styles.cardPreview}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {/* Elementos decorativos */}
                                <View style={styles.decorativeElements}>
                                    <View style={[styles.decorativeCircle, styles.circle1]} />
                                    <View style={[styles.decorativeCircle, styles.circle2]} />
                                    <View style={[styles.decorativeCircle, styles.circle3]} />
                                </View>

                                {/* Logo do cartão */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.logoContainer}>
                                        <Ionicons name="card" size={32} color="rgba(255, 255, 255, 0.9)" />
                                    </View>
                                    <View style={styles.cardTypeIndicator}>
                                        <Text style={styles.cardTypeText}>
                                            {paymentMethodType === 'credit' ? 'CRÉDITO' : 'DÉBITO'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Número do cartão */}
                                <Text style={styles.cardNumber}>
                                    {number || '•••• •••• •••• ••••'}
                                </Text>

                                {/* Informações do cartão */}
                                <View style={styles.cardInfo}>
                                    <View style={styles.cardInfoItem}>
                                        <Text style={styles.cardLabel}>TITULAR</Text>
                                        <Text style={styles.cardValue}>
                                            {cardholderName.toUpperCase() || 'SEU NOME AQUI'}
                                        </Text>
                                    </View>
                                    <View style={styles.cardInfoItem}>
                                        <Text style={styles.cardLabel}>VALIDADE</Text>
                                        <Text style={styles.cardValue}>{expiry || 'MM/AA'}</Text>
                                    </View>
                                </View>

                                {/* Brand indicator */}
                                {brand && (
                                    <View style={styles.brandIndicator}>
                                        <Text style={styles.brandText}>{brand.toUpperCase()}</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </View>

                        {/* Formulário */}
                        <View style={styles.formContainer}>
                            {/* Seção de informações pessoais */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>📝 Informações do Cartão</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="person" size={20} color="#6CC51D" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={cardholderName}
                                        onChangeText={setCardholderName}
                                        placeholder="Nome impresso no cartão"
                                        placeholderTextColor="#7F8C8D"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="pricetag" size={20} color="#6CC51D" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={nickname}
                                        onChangeText={setNickname}
                                        placeholder="Apelido do cartão (opcional)"
                                        placeholderTextColor="#7F8C8D"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="card" size={20} color="#6CC51D" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={number}
                                        onChangeText={(text) => {
                                            const formatted = formatCardNumber(text);
                                            setNumber(formatted);
                                            const detected = detectBrand(formatted);
                                            if (detected) setBrand(detected);
                                        }}
                                        placeholder="0000 0000 0000 0000"
                                        placeholderTextColor="#7F8C8D"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Seção de dados de segurança */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>🔒 Dados de Segurança</Text>
                            </View>

                            <View style={styles.rowContainer}>
                                <View style={[styles.inputContainer, styles.halfInput]}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="calendar" size={20} color="#6CC51D" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={expiry}
                                        onChangeText={(text) => setExpiry(formatExpiryDate(text))}
                                        placeholder="MM/AA"
                                        placeholderTextColor="#7F8C8D"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={[styles.inputContainer, styles.halfInput]}>
                                    <View style={styles.inputIconContainer}>
                                        <Ionicons name="lock-closed" size={20} color="#6CC51D" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={cvv}
                                        onChangeText={setCvv}
                                        placeholder="CVV"
                                        placeholderTextColor="#7F8C8D"
                                        keyboardType="numeric"
                                        secureTextEntry
                                        maxLength={4}
                                    />
                                </View>
                            </View>

                            {/* Tipo de cartão */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>⚙️ Tipo do Cartão</Text>
                            </View>

                            <View style={styles.paymentTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.paymentTypeButton,
                                        paymentMethodType === 'credit' && styles.paymentTypeButtonSelected
                                    ]}
                                    onPress={() => setPaymentMethodType('credit')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.paymentTypeContent}>
                                        <Ionicons 
                                            name="card" 
                                            size={24} 
                                            color={paymentMethodType === 'credit' ? '#FFFFFF' : '#6CC51D'} 
                                        />
                                        <Text style={[
                                            styles.paymentTypeText,
                                            paymentMethodType === 'credit' && styles.paymentTypeTextSelected
                                        ]}>
                                            Crédito
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.paymentTypeButton,
                                        paymentMethodType === 'debit' && styles.paymentTypeButtonSelected
                                    ]}
                                    onPress={() => setPaymentMethodType('debit')}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.paymentTypeContent}>
                                        <Ionicons 
                                            name="cash" 
                                            size={24} 
                                            color={paymentMethodType === 'debit' ? '#FFFFFF' : '#6CC51D'} 
                                        />
                                        <Text style={[
                                            styles.paymentTypeText,
                                            paymentMethodType === 'debit' && styles.paymentTypeTextSelected
                                        ]}>
                                            Débito
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Bandeira detectada */}
                            {brand && (
                                <View style={styles.detectedBrandContainer}>
                                    <View style={styles.detectedBrandContent}>
                                        <Ionicons name="checkmark-circle" size={20} color="#6CC51D" />
                                        <Text style={styles.detectedBrandText}>
                                            Bandeira detectada: {brand.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Botão de adicionar */}
                            <TouchableOpacity
                                style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
                                onPress={handleAddCard}
                                disabled={isSubmitting}
                                activeOpacity={0.8}
                            >
                                {isSubmitting ? (
                                    <View style={styles.buttonContent}>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                        <Text style={styles.addButtonText}>Adicionando...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                        <Text style={styles.addButtonText}>Adicionar Cartão</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    screen: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Header moderno
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: "#FAFAFA",
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#F8F9FA",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 20,
        color: "#2C3E50",
        flex: 1,
        textAlign: "center",
        marginHorizontal: 20,
    },
    headerSpacer: {
        width: 44,
    },

    container: {
        flex: 1,
        paddingHorizontal: 20,
    },

    // Card Preview moderno
    cardPreviewContainer: {
        marginBottom: 32,
    },
    cardPreview: {
        borderRadius: 20,
        padding: 24,
        height: 200,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeElements: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    decorativeCircle: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 50,
    },
    circle1: {
        width: 100,
        height: 100,
        top: -30,
        right: -20,
    },
    circle2: {
        width: 60,
        height: 60,
        bottom: 20,
        right: 40,
    },
    circle3: {
        width: 40,
        height: 40,
        top: 60,
        left: -10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 2,
    },
    logoContainer: {
        width: 50,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTypeIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cardTypeText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10,
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    cardNumber: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 22,
        color: "#FFFFFF",
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 20,
        zIndex: 2,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        zIndex: 2,
    },
    cardInfoItem: {
        flex: 1,
    },
    cardLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 10,
        color: "rgba(255, 255, 255, 0.8)",
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    cardValue: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#FFFFFF",
    },
    brandIndicator: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    brandText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#FFFFFF",
        letterSpacing: 1,
    },

    // Formulário
    formContainer: {
        flex: 1,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 18,
        color: "#2C3E50",
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 56,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    inputIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#E8F8F5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: "Poppins_400Regular",
        color: "#2C3E50",
        height: "100%",
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    halfInput: {
        flex: 1,
        marginHorizontal: 4,
    },

    // Tipo de pagamento
    paymentTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    paymentTypeButton: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: "#F0F0F0",
        alignItems: 'center',
    },
    paymentTypeButtonSelected: {
        backgroundColor: "#6CC51D",
        borderColor: "#6CC51D",
    },
    paymentTypeContent: {
        alignItems: 'center',
    },
    paymentTypeText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#2C3E50",
        marginTop: 8,
    },
    paymentTypeTextSelected: {
        color: "#FFFFFF",
    },

    // Bandeira detectada
    detectedBrandContainer: {
        backgroundColor: "#E8F8F5",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    detectedBrandContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detectedBrandText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 14,
        color: "#6CC51D",
        marginLeft: 8,
    },

    // Botão de adicionar
    addButton: {
        backgroundColor: "#6CC51D",
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonDisabled: {
        backgroundColor: "#BDC3C7",
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#FFFFFF",
        marginLeft: 8,
    },
});