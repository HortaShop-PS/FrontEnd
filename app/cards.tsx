import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Image, Platform, /*Alert,*/ ActivityIndicator } from 'react-native'; // Alert removido
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { cardService, ApiCard, UpdateCardPayload } from '../utils/cardService';
import { showAlert, showError, showSuccess } from '../utils/alertService';

// Interface CardData now extends ApiCard directly, as ApiCard has been updated
interface CardData extends ApiCard {
    cvv?: string; // CVV is a temporary frontend state for input fields
}

const CARD_LOGOS = {
    'Mastercard': require('../assets/images/mastercard_logo.png'), // Key changed
    'Visa': require('../assets/images/visa_logo.png'),             // Key changed
};

const MOCKED_CARDS: CardData[] = [
    { id: '1', cardType: 'Mastercard', last4: '1234', expiry: '12/25', cvv: '123', name: 'JOHN DOE', isPrincipal: true }, // brand -> cardType, holderName -> name
    { id: '2', cardType: 'Visa', last4: '5678', expiry: '11/24', cvv: '456', name: 'JANE DOE', isPrincipal: false }, // brand -> cardType, holderName -> name
];

export default function MyCardsScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<CardData[]>([]);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hook para carregar fontes
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
            // Map ApiCard to CardData, spreading ApiCard and adding cvv
            setCards(fetchedApiCards.map(apiCard => ({ ...apiCard, cvv: '' })));
            const principal = fetchedApiCards.find(c => c.isPrincipal);
            setExpandedCardId(principal ? principal.id : (fetchedApiCards.length > 0 ? fetchedApiCards[0].id : null));
            console.log("Cards fetched successfully:", fetchedApiCards);
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
        const cardToUpdate = cards.find(c => c.id === cardId);
        if (!cardToUpdate || cardToUpdate.isPrincipal) return;

        const originalCards = [...cards];
        setCards(prevCards =>
            prevCards.map(card => ({ ...card, isPrincipal: card.id === cardId }))
        );
        setExpandedCardId(cardId);

        try {
            await cardService.updateCard(cardId, { isPrincipal: true });
            // Opcional: showSuccess("Sucesso", "Cartão definido como principal!");
            // fetchCardsData(); // Para reconfirmar o estado do backend, se necessário
        } catch (e: any) {
            const errorMessage = e.message || "Erro ao definir cartão principal.";
            setError(errorMessage); // Atualiza o estado de erro para exibição na UI, se houver
            setCards(originalCards); // Reverte
            showError("Erro", "Não foi possível definir o cartão como principal.");
        }
    }, [cards, fetchCardsData]); // Adicionado fetchCardsData se for usá-lo no try

    const handleSaveChanges = useCallback(async (cardId: string) => {
        const cardToSave = cards.find(c => c.id === cardId);
        if (!cardToSave) return;

        // Modify this payload:
        const payload: UpdateCardPayload = {
            name: cardToSave.name,
            expiry: cardToSave.expiry,
            // isPrincipal: cardToSave.isPrincipal, // <-- REMOVE THIS LINE
        };
        
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
                        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
                        if (expandedCardId === cardId) {
                            setExpandedCardId(null);
                        }
                        try {
                            await cardService.deleteCard(cardId);
                            showSuccess("Excluído", "Cartão excluído com sucesso.");
                            // Opcional: fetchCardsData(); para recarregar a lista
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

    const getCardLogo = (cardType: string) => { // Parameter changed from brand to cardType
        const normalizedCardType = cardType ? cardType.toLowerCase() : "";
        if (normalizedCardType.includes('mastercard')) { // Check for 'mastercard'
            return <Image source={CARD_LOGOS['Mastercard']} style={styles.mastercardLogo} resizeMode="contain" />;
        } else if (normalizedCardType.includes('visa')) {
            return <Image source={CARD_LOGOS['Visa']} style={styles.visaLogo} resizeMode="contain" />;
        }
        return <View style={styles.cardLogoPlaceholder}><Text style={{fontSize: 10, color: '#777'}}>{cardType ? cardType.substring(0,4) : 'N/A'}</Text></View>; // Use cardType
    };


    // Lógica de renderização condicional APÓS todos os Hooks
    if (!fontsLoaded || (isLoading && cards.length === 0 && !error)) {
        // Mostra loading se as fontes não carregaram OU se os dados estão carregando e não há cartões ainda (e não há erro)
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6CC51D" />
                <Text>{!fontsLoaded ? "Carregando fontes..." : "Carregando cartões..."}</Text>
            </View>
        );
    }

    if (fontError) {
        return <View style={styles.centered}><Text style={styles.errorText}>Erro ao carregar fontes: {fontError.message}</Text></View>;
    }

    if (error && cards.length === 0) { // Mostra erro apenas se não conseguiu carregar nenhum cartão
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchCardsData}>
                    <Text style={styles.retryText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Renderização principal do componente
    return (
        <View style={styles.container}>
            {/* ... Header ... */}
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
                // ... Empty state ...
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
                    <TouchableOpacity onPress={() => router.push('/addCard')} style={styles.addNewCardButtonEmpty}>
                        <>
                            <Ionicons name="add-circle-outline" size={22} color="#6CC51D" />
                            <Text style={styles.addNewCardButtonText}>Adicionar novo cartão</Text>
                        </>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                    {error && <Text style={styles.errorText}>Aviso: {error}</Text>}
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
                                       {getCardLogo(card.cardType)} {/* Use card.cardType */}
                                    </View>
                                    <View style={styles.cardTextContainer}>
                                        <Text style={styles.cardBrand}>{card.cardType}</Text> {/* Use card.cardType */}
                                        <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                                        <Text style={styles.cardDetails}>Validade: {card.expiry}</Text>
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
                                <View style={styles.cardExpandedContent}>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={card.name} // Changed from card.holderName
                                            onChangeText={(text) => handleInputChange(card.id, 'name', text)} // field changed to 'name'
                                            placeholder="Nome no cartão"
                                        />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, styles.disabledInput]}
                                            value={`•••• •••• •••• ${card.last4}`}
                                            editable={false}
                                        />
                                    </View>
                                    <View style={styles.rowInputContainer}>
                                        <View style={[styles.inputContainer, styles.halfInput]}>
                                            <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={card.expiry} // Ensure this uses card.expiry
                                                onChangeText={(text) => handleInputChange(card.id, 'expiry', text)} // field is 'expiry'
                                                placeholder="MM/AA"
                                                maxLength={5}
                                            />
                                        </View>
                                        <View style={[styles.inputContainer, styles.halfInput, { marginLeft: 10 }]}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={card.cvv || ''}
                                                onChangeText={(text) => handleInputChange(card.id, 'cvv', text)}
                                                placeholder="CVV"
                                                secureTextEntry
                                                keyboardType="number-pad"
                                                maxLength={3}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.switchContainer}>
                                        <Text style={styles.switchLabel}>Tornar principal</Text>
                                        <Switch
                                            trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
                                            thumbColor={card.isPrincipal ? "#6CC51D" : "#f4f3f4"}
                                            onValueChange={() => handleSetPrincipal(card.id)}
                                            value={card.isPrincipal}
                                            disabled={card.isPrincipal || isLoading} // Desabilita durante o loading
                                        />
                                    </View>
                                     <TouchableOpacity 
                                        style={[styles.saveButtonSmall, isLoading && styles.buttonDisabled]} 
                                        onPress={() => handleSaveChanges(card.id)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <ActivityIndicator color="#FFFFFF" size="small"/> : <Text style={styles.saveButtonTextSmall}>Salvar Alterações</Text>}
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteCard(card.id)} 
                                        style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
                                        disabled={isLoading}
                                    >
                                        <>
                                            <Ionicons name="trash-outline" size={20} color="#DC3545" style={styles.deleteIcon} />
                                            <Text style={styles.deleteButtonText}>Excluir Cartão</Text>
                                        </>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                    {cards.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => router.push('/addCard')} 
                            style={[styles.addNewCardButton, isLoading && styles.buttonDisabled]}
                            disabled={isLoading}
                        >
                            <>
                                <Ionicons name="add-circle-outline" size={22} color="#6CC51D" />
                                <Text style={styles.addNewCardButtonText}>Adicionar novo cartão</Text>
                            </>
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
    },
    disabledInput: {
        backgroundColor: '#E9ECEF',
        color: '#6C757D',
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
    principalCardBorder: {
        // borderColor: '#6CC51D', // Estilo opcional para cartão principal
        // borderWidth: 1.5,
    },
    principalBadge: {
        position: 'absolute',
        top: 12, 
        left: -8, 
        backgroundColor: '#E6FFD7', 
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        zIndex: 10, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    principalBadgeText: {
        color: '#388E3C', 
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 11,
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
    chevronIcon: {
        marginLeft: 10, 
    },
    cardExpandedContent: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5', 
        marginTop: 10, 
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA', 
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 12, 
        height: 48, 
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    inputIcon: {
        marginRight: 10,
        color: '#6C757D', 
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
        marginTop: 12,
    },
    halfInput: {
        flex: 1, 
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
    saveButtonTextSmall: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#FFF4F4', 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E57373', 
        marginTop: 10, // Ajuste de margem
    },
    deleteIcon: {
        marginRight: 8,
    },
    deleteButtonText: {
        color: '#DC3545', 
        fontSize: 15,
        fontFamily: 'Poppins_600SemiBold',
    },
    addNewCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6CC51D',
        borderStyle: 'dashed',
        backgroundColor: '#F1FFF0',
        marginTop: 25, 
    },
    addNewCardButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: '#6CC51D',
        marginLeft: 8,
    },
    buttonDisabled: { // Estilo para botões desabilitados durante o loading
        opacity: 0.7,
    }
});