import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Image, Platform, /*Alert,*/ ActivityIndicator } from 'react-native'; // Alert removido
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { cardService, ApiCard, UpdateCardPayload } from '../utils/cardService';
import { showAlert, showError, showSuccess } from '../utils/alertService';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import InputField from '../components/InputField';
import Button from '../components/Button';

// CARD_LOGOS movido para o topo para ser acessível por getCardLogo
const CARD_LOGOS = {
    'Mastercard': require('../assets/images/mastercard_logo.png'),
    'Visa': require('../assets/images/visa_logo.png'),
    // Adicione outros tipos de cartão se necessário
};

interface CardData extends ApiCard {
    cvv?: string; // Campo para input local, não vem do backend
    // outros campos como last4 (agora last4Digits), name (agora cardholderName), expiry (precisa de formatação)
    // serão tratados ao mapear de ApiCard
}

// MOCKED_CARDS pode precisar de ajuste se usado como fallback, para refletir a estrutura de CardData
const MOCKED_CARDS: CardData[] = [
    { id: '1', brand: 'Mastercard', last4Digits: '1234', expiry: '12/25', cvv: '123', cardholderName: 'JOHN DOE', isPrincipal: true, paymentMethodType: 'credit', nickname: 'Meu Master', number: '************1234', expiryMonth: '12', expiryYear: '2025' },
    { id: '2', brand: 'Visa', last4Digits: '5678', expiry: '11/24', cvv: '456', cardholderName: 'JANE DOE', isPrincipal: false, paymentMethodType: 'debit', nickname: 'Visa Principal', number: '************5678', expiryMonth: '11', expiryYear: '2024' },
];


export default function MyCardsScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<CardData[]>([]);
    // Não expandir nenhum cartão por padrão
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para loading individual do switch principal
    const [principalLoadingId, setPrincipalLoadingId] = useState<string | null>(null);

    // Hook para carregar fontes
    // Hook para carregar fontes personalizadas
    let [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    // Função para buscar cartões, memoizada com useCallback
    const fetchCardsData = useCallback(async () => {
        console.log("Attempting to fetch cards...");
        setIsLoading(true);
        setError(null);
        try {
            const fetchedApiCards = await cardService.getCards();
            const formattedCards = fetchedApiCards.map(apiCard => {
                // Construct expiry from month and year
                const expiry = apiCard.expiryMonth && apiCard.expiryYear 
                               ? `${apiCard.expiryMonth}/${apiCard.expiryYear.slice(-2)}` 
                               : apiCard.expiry || 'N/A';
                
                // Ensure last4Digits is valid, defaulting to 'XXXX'
                let last4 = apiCard.last4Digits || apiCard.number?.slice(-4);
                if (!last4 || last4 === 'undefined') { // Check for undefined string or falsy
                    last4 = 'XXXX';
                }
                
                return {
                    ...apiCard,
                    cardholderName: apiCard.cardholderName || 'N/A',
                    last4Digits: last4, // Use the cleaned-up version
                    expiry: expiry,
                    brand: apiCard.brand || 'N/A', // Use brand consistently
                    cvv: '', // CVV is for input only, not from API
                };
            });
            setCards(formattedCards);
            console.log("Cards fetched and formatted successfully:", formattedCards);
        } catch (e: any) {
            console.error("Failed to fetch cards:", e);
            const errorMessage = e.message || "Falha ao carregar os cartões.";
            setError(errorMessage);
            setCards(MOCKED_CARDS); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Hook para buscar dados quando a tela ganha foco E as fontes estão carregadas
    useFocusEffect(
        useCallback(() => {
            if (fontsLoaded) {
                fetchCardsData();
            } else {
                // setError(null); // Limpa erros anteriores
                setIsLoading(true); 
            }
        }, [fontsLoaded, fetchCardsData]) 
    );

    const toggleCardExpansion = (cardId: string) => {
        setExpandedCardId(prevId => (prevId === cardId ? null : cardId));
    };

    const handleInputChange = (cardId: string, field: keyof CardData, value: string | boolean) => {
        setCards(prevCards =>
            prevCards.map(card =>
                card.id === cardId ? { ...card, [field]: value } : card
            )
        );
    };

    const handleSetPrincipal = useCallback(async (cardId: string) => {
        if (principalLoadingId) return; // Evita múltiplos cliques
        setPrincipalLoadingId(cardId);
        try {
            await cardService.updateCard(cardId, { isPrincipal: true });
            showSuccess("Sucesso", "Cartão definido como principal!");
            await fetchCardsData(); // Atualiza lista após backend
        } catch (e: any) {
            const errorMessage = e.message || "Erro ao definir cartão principal.";
            showError("Erro", `Não foi possível definir o cartão como principal. ${errorMessage}`);
        } finally {
            setPrincipalLoadingId(null);
        }
    }, [fetchCardsData, principalLoadingId]);

    const handleSaveChanges = useCallback(async (cardId: string) => {
        const cardToSave = cards.find(c => c.id === cardId);
        if (!cardToSave) return;

        const payload: UpdateCardPayload = {
            cardholderName: cardToSave.cardholderName,
            // expiry: cardToSave.expiry, // Expiry is not typically updated directly, but split into month/year if needed by backend
            isPrincipal: cardToSave.isPrincipal,
            nickname: cardToSave.nickname,
            paymentMethodType: cardToSave.paymentMethodType,
            brand: cardToSave.brand, // Use brand instead of cardType
        };

        // Se a expiração precisar ser atualizada, ela deve ser dividida em mês e ano.
        // Por ora, vamos assumir que a expiração não é editável ou é tratada de outra forma.
        // Se for editável, você precisaria adicionar lógica para parsear 'MM/AA' de cardToSave.expiry
        // e enviar expiryMonth e expiryYear separadamente, se for o que o backend espera.
        // Exemplo: 
        // if (cardToSave.expiry && cardToSave.expiry.includes('/')) {
        //   const [month, yearSuffix] = cardToSave.expiry.split('/');
        //   payload.expiryMonth = month;
        //   payload.expiryYear = `20${yearSuffix}`;
        // }
        
        // Remove undefined fields from payload to prevent issues with backend validation
        Object.keys(payload).forEach(key => {
            if ((payload as any)[key] === undefined) {
                delete (payload as any)[key];
            }
        });

        const originalCards = [...cards];
        setIsLoading(true);
        try {
            await cardService.updateCard(cardId, payload);
            showSuccess("Sucesso", "Cartão atualizado!");
            await fetchCardsData(); 
        } catch (e: any) {
            const errorMessage = e.message || "Erro ao salvar alterações.";
            setError(errorMessage);
            setCards(originalCards); 
            showError("Erro", "Não foi possível salvar as alterações.");
        } finally {
            setIsLoading(false);
        }
    }, [cards, fetchCardsData]);

    const handleDeleteCard = useCallback((cardId: string) => {
        showAlert(
            "Excluir Cartão",
            "Tem certeza que deseja excluir este cartão?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    onPress: async () => {
                        const originalCards = [...cards];
                        setCards(prevCards => prevCards.filter((card) => card.id !== cardId));
                        if (expandedCardId === cardId) {
                            setExpandedCardId(null);
                        }
                        try {
                            await cardService.deleteCard(cardId);
                            // showSuccess("Excluído", "Cartão excluído com sucesso.");
                            fetchCardsData(); // Recarrega a lista após a exclusão bem-sucedida
                        } catch (e: any) {
                            const errorMessage = e.message || "Erro ao excluir cartão.";
                            setError(errorMessage);
                            setCards(originalCards);
                            showError("Erro", "Não foi possível excluir o cartão.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    }, [cards, expandedCardId, fetchCardsData]);

    const getCardLogo = (cardTypeInput: string) => {
        const normalizedCardType = cardTypeInput ? cardTypeInput.toLowerCase() : "";
        if (normalizedCardType.includes('mastercard')) {
            return <Image source={CARD_LOGOS['Mastercard']} style={styles.mastercardLogo} resizeMode="contain" />;
        } else if (normalizedCardType.includes('visa')) {
            return <Image source={CARD_LOGOS['Visa']} style={styles.visaLogo} resizeMode="contain" />;
        }
        // Ensure text is always within a Text component
        return <View style={styles.cardLogoPlaceholder}><Text style={{fontSize: 10, color: '#777'}}>{cardTypeInput ? cardTypeInput.substring(0,4) : 'N/A'}</Text></View>;
    };


    // Lógica de renderização condicional APÓS todos os Hooks
    if (!fontsLoaded || (isLoading && cards.length === 0 && !error)) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6CC51D" />
                <Text style={styles.emptyText}>{!fontsLoaded ? "Carregando fontes..." : "Carregando cartões..."}</Text>
            </View>
        );
    }

    if (fontError) {
        return <View style={styles.centered}><Text style={styles.errorText}>Erro ao carregar fontes: {fontError.message || 'Erro desconhecido'}</Text></View>;
    }

    if (error && cards.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Ocorreu um erro.'}</Text>
                <TouchableOpacity onPress={fetchCardsData} style={styles.addNewCardButtonEmpty}>
                    <Ionicons name="refresh" size={22} color="#6CC51D" />
                    <Text style={styles.emptyText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Renderização principal do componente
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Cartões</Text>
                <TouchableOpacity onPress={() => router.push('/addCard')} style={styles.headerButton}>
                    <Ionicons name="add" size={32} color="#333" />
                </TouchableOpacity>
            </View>

            {cards.length === 0 && !isLoading ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
                    <TouchableOpacity onPress={() => router.push('/addCard')} style={styles.addNewCardButtonEmpty}>
                        <Ionicons name="add-circle-outline" size={22} color="#6CC51D" />
                        <Text style={styles.emptyText}>Adicionar novo cartão</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                    {/* Garante que a mensagem de erro esteja dentro de um componente Text */}
                    {error && <Text style={styles.errorText}>Aviso: {error || 'Ocorreu um erro.'}</Text>}
                    {cards.map((card) => (
                        <View key={card.id} style={[styles.cardItemContainer, card.isPrincipal && styles.principalCardBorder]}>
                            {card.isPrincipal && (
                                <View style={styles.principalBadge}>
                                    <Text style={styles.principalBadgeText}>Principal</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={() => toggleCardExpansion(card.id)} style={styles.cardHeader}>
                                <View style={styles.cardInfo}>
                                    <View style={styles.cardLogoContainer}>
                                       {getCardLogo(card.brand)}
                                    </View>
                                    <View style={styles.cardTextContainer}>
                                        <Text style={styles.cardBrand}>{card.nickname || card.brand.toUpperCase()}</Text>
                                        <Text style={styles.cardNumber}>•••• •••• •••• {card.last4Digits}</Text>
                                        <Text style={styles.cardDetails}>
                                            Validade: {card.expiry || 'N/A'} - {card.paymentMethodType === 'debit' ? 'Débito' : 'Crédito'}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons
                                    name={expandedCardId === card.id ? "chevron-up-outline" : "chevron-down-outline"}
                                    size={24}
                                    color={expandedCardId === card.id ? "#6CC51D" : "#888"}
                                    style={styles.chevronIcon}
                                />
                            </TouchableOpacity>

                            {expandedCardId === card.id && (
                                <View style={styles.cardExpandedContentPadronizado}>
                                    <InputField
                                        value={card.cardholderName}
                                        onChangeText={(text) => handleInputChange(card.id, 'cardholderName', text)}
                                        placeholder="Nome no cartão"
                                        icon={<Ionicons name="person-outline" size={22} color="#6C757D" />}
                                        keyboardType="default"
                                    />
                                    {/* InputField for nickname REMOVED */}
                                    <InputField
                                        value={`•••• •••• •••• ${card.last4Digits}`}
                                        onChangeText={() => {}}
                                        placeholder="Número do Cartão"
                                        icon={<Ionicons name="card-outline" size={22} color="#6C757D" />}
                                        keyboardType="numeric"
                                        editable={false}
                                    />
                                    <View style={styles.rowInputContainerPadronizado}>
                                        <View style={[{ flex: 1, marginRight: 7 }]}> {/* metade esquerda */}
                                            <InputField
                                                value={card.expiry}
                                                onChangeText={(text) => handleInputChange(card.id, 'expiry', text)}
                                                placeholder="Mês / Ano (MM/AA)"
                                                icon={<Ionicons name="calendar-outline" size={22} color="#6C757D" />}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={[{ flex: 1, marginLeft: 7 }]}> {/* metade direita */}
                                            <InputField
                                                value={card.cvv || ''}
                                                onChangeText={(text) => handleInputChange(card.id, 'cvv', text)}
                                                placeholder="CVV"
                                                icon={<Ionicons name="lock-closed-outline" size={22} color="#6C757D" />}
                                                keyboardType="numeric"
                                                secureTextEntry
                                            />
                                        </View>
                                    </View>
                                    {/* Payment type selection REMOVED */}
                                    <View style={styles.switchContainer}>
                                        <Text style={styles.switchLabel}>Tornar principal</Text>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            {principalLoadingId === card.id ? (
                                                <ActivityIndicator size="small" color="#6CC51D" />
                                            ) : (
                                                <Switch
                                                    trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
                                                    thumbColor={card.isPrincipal ? "#6CC51D" : "#f4f3f4"}
                                                    onValueChange={() => handleSetPrincipal(card.id)}
                                                    value={card.isPrincipal}
                                                    disabled={card.isPrincipal || isLoading}
                                                />
                                            )}
                                        </View>
                                    </View>
                                    <Button
                                        title={isLoading ? 'Salvando...' : 'Salvar Alterações'}
                                        onPress={() => handleSaveChanges(card.id)}
                                        disabled={isLoading}
                                    />
                                    <View style={{ height: 12 }} />
                                    <Button
                                        title="Excluir Cartão"
                                        onPress={() => handleDeleteCard(card.id)}
                                        disabled={isLoading}
                                    />
                                </View>
                            )}
                        </View>
                    ))}
                    {cards.length > 0 && (
                        <TouchableOpacity
                            onPress={() => router.push('/addCard')}
                            style={[styles.addNewCardButtonEmpty, isLoading && styles.buttonDisabled]}
                            disabled={isLoading}
                        >
                            <Ionicons name="add-circle-outline" size={22} color="#6CC51D" style={styles.addNewCardIcon} />
                            <Text style={styles.addNewCardButtonText}>Adicionar novo cartão</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    // ... (seus estilos existentes) ...
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    retryText: {
        color: '#6CC51D',
        fontSize: 16,
        fontWeight: 'bold',
        padding: 10,
    },
    emptyText: {
        fontSize: 18,
        color: '#6C757D',
        marginBottom: 20,
        textAlign: 'center',
    },
    addNewCardButtonEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6CC51D',
        backgroundColor: '#F1FFF0',
        marginTop: 20, // Added margin for spacing from the list
    },
    addNewCardIcon: {
        // marginRight: 8, // Icon already has some natural spacing, adjust if needed
    },
    addNewCardButtonText: {
        fontSize: 18,
        color: '#6C757D',
        // marginBottom: 20, // Removed, not suitable for button
        textAlign: 'center',
        textAlignVertical: 'center', // For Android vertical alignment
        includeFontPadding: false, // For Android to remove extra padding
        marginLeft: 8, // Space between icon and text
        fontFamily: 'Poppins_400Regular', // Ensure font family is consistent
    },
    disabledInput: {
        backgroundColor: '#F0F0F0', // Cor de fundo para input desabilitado
        color: '#888', // Cor do texto para input desabilitado
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 25 + 15 : 40 + 15, 
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    headerButton: {
        padding: 8, 
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold', 
        color: '#212529',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 100,
    },
    cardItemContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 18,
        shadowColor: "#ADB5BD",
        shadowOffset: { width: 0, height: 2, },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        position: 'relative', 
    },
    chevronIcon: {
        marginLeft: 'auto', // Garante que o ícone fique à direita
    },
    principalCardBorder: {
        borderColor: '#6CC51D', // Cor da borda para o cartão principal
        borderWidth: 2,
        borderRadius: 15, // Para combinar com o cardItemContainer
        // marginVertical: 5, // Ajuste para compensar a borda se necessário
    },
    principalBadge: {
        position: 'absolute',
        top: -10,
        right: 10,
        backgroundColor: '#6CC51D',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        zIndex: 1, // Para garantir que fique sobreposto
        elevation: 2, // Sombra para Android
        shadowColor: '#000', // Sombra para iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    principalBadgeText: {
        color: '#FFFFFF',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 15,
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardLogoContainer: {
        width: 50,
        height: 32, 
        borderRadius: 5, 
        backgroundColor: '#F1F3F5', 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden', 
    },
    mastercardLogo: { 
        width: '70%',
        height: '70%',
    },
    visaLogo: { 
        width: '80%',
        height: '80%',
    },
    cardLogoPlaceholder: { 
        width: 40,
        height: 25,
        borderRadius: 4,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTextContainer: {
        flex: 1,
    },
    cardBrand: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#343A40',
        marginBottom: 2,
    },
    cardNumber: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#495057',
        letterSpacing: 0.5, 
    },
    cardDetails: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#6C757D',
        marginTop: 3,
    },
    cardExpandedContentPadronizado: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 18,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        marginBottom: 5,
    },
    rowInputContainerPadronizado: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    inputContainerPadronizado: {
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
    paymentTypeContainerPadronizado: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 5,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
        paddingVertical: 8, 
    },
    switchLabel: {
        fontSize: 15,
        fontFamily: 'Poppins_400Regular',
        color: '#343A40',
        marginRight: 10, 
    },
    saveButtonSmall: { // Botão de salvar alterações dentro do cartão
        backgroundColor: '#6CC51D',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    buttonDisabled: { // Estilo para botões desabilitados durante o loading
        opacity: 0.7,
    },
    pickerStyle: { // Estilo para o Picker
        flex: 1,
        height: 50,
        color: '#343A40',
        fontFamily: 'Poppins_400Regular',
        // backgroundColor: '#FFFFFF', // Garante fundo branco se necessário
        // borderWidth: 1, // Opcional: adicionar borda se desejar
        // borderColor: '#CED4DA', // Opcional: cor da borda
        // borderRadius: 8, // Opcional: borda arredondada
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
    paymentTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
});