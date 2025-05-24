import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Switch,
    Image,
    Platform,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Para ícones
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient'; // Para o gradiente do cartão

// Mock de logo, substitua pelo seu asset real se tiver
const mastercardLogo = require('../assets/images/mastercard_logo.png'); // Certifique-se que este caminho está correto

export default function AddCardScreen() {
    const router = useRouter();
    const [cardHolderName, setCardHolderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [saveCard, setSaveCard] = useState(true);

    let [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    if (!fontsLoaded) {
        return <View style={styles.centered}><Text>Carregando...</Text></View>; // Ou um ActivityIndicator
    }

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join('  ') || '';
        return formatted.substring(0, 22); // XXXX XXXX XXXX XXXX (16 digits + 3 spaces)
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 3) {
            return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
        }
        return cleaned;
    };
    
    const handleAddCard = () => {
        // Lógica para adicionar o cartão
        console.log({
            cardHolderName,
            cardNumber: cardNumber.replace(/\s/g, ''), // Remove espaços para salvar
            expiryDate,
            cvv,
            saveCard,
        });
        // Navegar de volta ou para uma tela de sucesso
        router.back();
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.screen}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                        <Ionicons name="arrow-back" size={24} color="#343A40" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Adicionar Cartão de Crédito</Text>
                    <View style={styles.headerButton} /> 
                </View>

                {/* Visualização do Cartão */}
                <LinearGradient
                    colors={['#8EE000', '#6CC51D']} // Cores do gradiente do cartão
                    style={styles.cardPreview}
                >
                    <Image source={mastercardLogo} style={styles.cardLogo} resizeMode="contain" />
                    <Text style={styles.cardNumberPreview}>
                        {cardNumber || 'XXXX  XXXX  XXXX  XXXX'}
                    </Text>
                    <View style={styles.cardDetailsPreview}>
                        <View>
                            <Text style={styles.cardLabelPreview}>TITULAR DO CARTÃO</Text>
                            <Text style={styles.cardValuePreview}>{cardHolderName.toUpperCase() || 'NOME DO TITULAR'}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.cardLabelPreview}>EXPIRES</Text>
                            <Text style={styles.cardValuePreview}>{expiryDate || 'MM/YY'}</Text>
                        </View>
                    </View>
                     {/* Elementos decorativos no cartão */}
                    <View style={[styles.decorativeCircle, styles.circle1]} />
                    <View style={[styles.decorativeCircle, styles.circle2]} />
                    <View style={[styles.decorativeDiamond, styles.diamond1]} />
                </LinearGradient>

                {/* Formulário */}
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={22} color="#6C757D" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome no Cartão"
                            placeholderTextColor="#6C757D"
                            value={cardHolderName}
                            onChangeText={setCardHolderName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="card-outline" size={22} color="#6C757D" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Número do Cartão"
                            placeholderTextColor="#6C757D"
                            value={cardNumber}
                            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                            keyboardType="numeric"
                            maxLength={22} 
                        />
                    </View>

                    <View style={styles.rowInputContainer}>
                        <View style={[styles.inputContainer, styles.halfInput]}>
                            <Ionicons name="calendar-outline" size={22} color="#6C757D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mês / Ano"
                                placeholderTextColor="#6C757D"
                                value={expiryDate}
                                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                                keyboardType="numeric"
                                maxLength={5} // MM/YY
                            />
                        </View>
                        <View style={[styles.inputContainer, styles.halfInput, { marginLeft: 15 }]}>
                            <Ionicons name="lock-closed-outline" size={22} color="#6C757D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="CVV"
                                placeholderTextColor="#6C757D"
                                value={cvv}
                                onChangeText={setCvv}
                                keyboardType="numeric"
                                maxLength={3}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Salvar cartão</Text>
                        <Switch
                            trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
                            thumbColor={saveCard ? "#6CC51D" : "#f4f3f4"}
                            ios_backgroundColor="#E0E0E0"
                            onValueChange={setSaveCard}
                            value={saveCard}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
                    <Text style={styles.addButtonText}>Adicionar cartão de crédito</Text>
                </TouchableOpacity>
            </View>
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
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        minWidth: 40, // Para garantir que o título fique centralizado
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
        height: 200, // Altura do cartão
        justifyContent: 'space-between',
        overflow: 'hidden', // Para os círculos decorativos não saírem
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    cardLogo: {
        width: 60,
        height: 38,
        alignSelf: 'flex-start', // Alinha o logo à esquerda
        opacity: 0.8,
    },
    cardNumberPreview: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 20,
        color: '#FFFFFF',
        letterSpacing: 1.5,
        textAlign: 'center', // Centraliza o número do cartão
        marginTop: 10, // Espaço acima do número
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
    // Elementos decorativos
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
        backgroundColor: 'rgba(255, 200, 0, 0.3)', // Cor amarelada/alaranjada
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
        marginRight: 12,
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
    },
    halfInput: {
        flex: 1,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingVertical: 10,
    },
    switchLabel: {
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
        color: '#343A40',
    },
    footer: {
        padding: 20,
        backgroundColor: '#F8F9FA', // Para garantir que não haja corte estranho com o scroll
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
});