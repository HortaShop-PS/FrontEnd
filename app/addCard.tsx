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
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardType, setCardType] = useState(''); // Bandeira: Visa, Mastercard
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
        return <View style={styles.centered}><ActivityIndicator size="large" color="#6CC51D" /></View>;
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
    
    const detectCardType = (cardNumber: string): string => {
        const cleanedNumber = cardNumber.replace(/\s/g, '');
        if (/^4/.test(cleanedNumber)) return 'Visa';
        if (/^5[1-5]/.test(cleanedNumber)) return 'Mastercard';
        if (/^3[47]/.test(cleanedNumber)) return 'Amex';
        return ''; 
    };

    const handleAddCard = async () => {
        const currentCardType = cardType.trim() || detectCardType(number);
        if (!name.trim() || !number.trim() || !expiry.trim() || !cvv.trim() || !currentCardType) {
            showError("Campos Incompletos", "Por favor, preencha todos os campos do cartão, incluindo o tipo (bandeira).");
            return;
        }
        if (expiry.length !== 5 || !expiry.includes('/')) {
            showError("Dados Inválidos", "Data de validade inválida. Use o formato MM/AA.");
            return;
        }
        if (cvv.length < 3) {
            showError("Dados Inválidos", "CVV inválido. Deve ter 3 ou 4 dígitos.");
            return;
        }
        const cardNumberCleaned = number.replace(/\s/g, '');
        if (cardNumberCleaned.length < 13 || cardNumberCleaned.length > 19) {
             showError("Dados Inválidos", "Número do cartão inválido. Deve ter entre 13 e 19 dígitos.");
            return;
        }

        const payload: CreateCardPayload = {
            name: name.trim(),
            number: cardNumberCleaned,
            expiry: expiry,
            cvv: cvv,
            cardType: currentCardType,
            nickname: nickname.trim() || undefined,
            paymentMethodType: paymentMethodType,
        };

        setIsSubmitting(true);
        try {
            await cardService.createCard(payload);
            showSuccess("Cartão Adicionado", "Seu novo cartão foi adicionado com sucesso!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("Falha ao adicionar cartão:", error);
            showError("Erro ao Adicionar", error.message || "Não foi possível adicionar o cartão. Verifique os dados e tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.screen}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color="#343A40" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Adicionar Cartão</Text>
                    <View style={styles.headerButton} /> 
                </View>

                <LinearGradient
                    colors={['#8EE000', '#6CC51D']}
                    style={styles.cardPreview}
                >
                    <Image source={mastercardLogo} style={styles.cardLogo} resizeMode="contain" />
                    <Text style={styles.cardNumberPreview}>
                        {number || 'XXXX  XXXX  XXXX  XXXX'}
                    </Text>
                    <View style={styles.cardDetailsPreview}>
                        <View>
                            <Text style={styles.cardLabelPreview}>TITULAR DO CARTÃO</Text>
                            <Text style={styles.cardValuePreview}>{name.toUpperCase() || 'NOME DO TITULAR'}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.cardLabelPreview}>VALIDADE</Text>
                            <Text style={styles.cardValuePreview}>{expiry || 'MM/AA'}</Text>
                        </View>
                    </View>
                    <View style={[styles.decorativeCircle, styles.circle1]} />
                    <View style={[styles.decorativeCircle, styles.circle2]} />
                    <View style={[styles.decorativeDiamond, styles.diamond1]} />
                </LinearGradient>

                <View style={styles.formContainer}>
                    <InputField
                        value={name}
                        onChangeText={setName}
                        placeholder="Nome no Cartão"
                        icon={<Ionicons name="person-outline" size={22} color="#6C757D" />}
                        keyboardType="default"
                    />
                    <InputField
                        value={nickname}
                        onChangeText={setNickname}
                        placeholder="Apelido do Cartão (Opcional)"
                        icon={<Ionicons name="pricetag-outline" size={22} color="#6C757D" />}
                        keyboardType="default"
                    />
                    <InputField
                        value={number}
                        onChangeText={(text) => {
                            const formatted = formatCardNumber(text);
                            setNumber(formatted);
                            if (!cardType.trim()) {
                                const detectedType = detectCardType(formatted);
                                if (detectedType) setCardType(detectedType);
                            }
                        }}
                        placeholder="Número do Cartão"
                        icon={<Ionicons name="card-outline" size={22} color="#6C757D" />}
                        keyboardType="numeric"
                    />
                    <View style={styles.rowInputContainer}>
                        <View style={[{ flex: 1, marginRight: 7 }]}> {/* metade esquerda */}
                            <InputField
                                value={expiry}
                                onChangeText={(text) => setExpiry(formatExpiryDate(text))}
                                placeholder="Mês / Ano (MM/AA)"
                                icon={<Ionicons name="calendar-outline" size={22} color="#6C757D" />}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[{ flex: 1, marginLeft: 7 }]}> {/* metade direita */}
                            <InputField
                                value={cvv}
                                onChangeText={setCvv}
                                placeholder="CVV"
                                icon={<Ionicons name="lock-closed-outline" size={22} color="#6C757D" />}
                                keyboardType="numeric"
                                secureTextEntry
                            />
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="options-outline" size={22} color="#6C757D" style={styles.inputIcon} />
                        <View style={styles.paymentTypeContainer}>
                            <TouchableOpacity
                                style={[styles.paymentTypeButton, paymentMethodType === 'credit' && styles.paymentTypeButtonSelected]}
                                onPress={() => setPaymentMethodType('credit')}
                            >
                                <Text style={[styles.paymentTypeText, paymentMethodType === 'credit' && styles.paymentTypeTextSelected]}>Crédito</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.paymentTypeButton, paymentMethodType === 'debit' && styles.paymentTypeButtonSelected]}
                                onPress={() => setPaymentMethodType('debit')}
                            >
                                <Text style={[styles.paymentTypeText, paymentMethodType === 'debit' && styles.paymentTypeTextSelected]}>Débito</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <InputField
                        value={cardType}
                        onChangeText={setCardType}
                        placeholder="Bandeira (ex: Visa, Mastercard)"
                        icon={<Ionicons name="flag-outline" size={22} color="#6C757D" />}
                        keyboardType="default"
                    />
                    <Button
                        title={isSubmitting ? 'Adicionando...' : 'Adicionar Cartão'}
                        onPress={handleAddCard}
                        disabled={isSubmitting}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 30, 
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
        paddingTop: Platform.OS === 'android' ? 35 : 50,
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
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: '#212529',
        textAlign: 'center',
    },
    cardPreview: {
        marginHorizontal: 20,
        marginTop: 25,
        borderRadius: 15,
        padding: 20,
        height: 200, 
        justifyContent: 'space-between',
        overflow: 'hidden', 
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
        paddingHorizontal: 20,
        marginTop: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 18,
        height: 52,
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Poppins_400Regular',
        color: '#343A40',
        height: '100%',
    },
    rowInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    halfInput: {
        flex: 1,
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15, // Ajuste para alinhar com inputContainer
        marginBottom: 18,
        height: 52,
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    picker: {
        flex: 1,
        height: 50,
        color: '#343A40', // Cor do texto do Picker
        fontFamily: 'Poppins_400Regular',
        // Para remover a borda padrão no Android, se houver:
        // backgroundColor: 'transparent', // Pode não funcionar em todas as versões/dispositivos
        // Para estilização mais customizada, pode ser necessário envolver em uma <View>
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: Platform.OS === 'ios' ? 30 : 20,
        backgroundColor: '#F8F9FA', 
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    addButton: {
        backgroundColor: '#6CC51D',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    paymentTypeContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 5,
    },
    paymentTypeButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CED4DA',
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
    },
    paymentTypeButtonSelected: {
        backgroundColor: '#6CC51D',
        borderColor: '#6CC51D',
    },
    paymentTypeText: {
        color: '#343A40',
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
    },
    paymentTypeTextSelected: {
        color: '#FFF',
        fontFamily: 'Poppins_600SemiBold',
    },
});