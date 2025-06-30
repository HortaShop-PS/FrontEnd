import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Image, Platform, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { cardService, ApiCard, UpdateCardPayload } from '../utils/cardService';
import { showAlert, showError, showSuccess } from '../utils/alertService';
import { Picker } from '@react-native-picker/picker';
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
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para loading individual do switch principal
    const [principalLoadingId, setPrincipalLoadingId] = useState<string | null>(null);

    // Hook para carregar fontes personalizadas
    let [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
        Poppins_500Medium,
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
            isPrincipal: cardToSave.isPrincipal,
            nickname: cardToSave.nickname,
            paymentMethodType: cardToSave.paymentMethodType,
            brand: cardToSave.brand,
        };
        
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
            return <Image source={CARD_LOGOS['Mastercard']} style={styles.cardLogo} resizeMode="contain" />;
        } else if (normalizedCardType.includes('visa')) {
            return <Image source={CARD_LOGOS['Visa']} style={styles.cardLogo} resizeMode="contain" />;
        }
        return (
            <View style={styles.cardLogoPlaceholder}>
                <Text style={styles.cardLogoText}>
                    {cardTypeInput ? cardTypeInput.substring(0,4) : 'Card'}
                </Text>
            </View>
        );
    };

    // Lógica de renderização condicional APÓS todos os Hooks
    if (!fontsLoaded || (isLoading && cards.length === 0 && !error)) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6CC51D" />
                    <Text style={styles.loadingText}>
                        {!fontsLoaded ? "Carregando fontes..." : "Carregando cartões..."}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (fontError) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
                <View style={styles.errorContainer}>
                    <View style={styles.errorIconContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
                    </View>
                    <Text style={styles.errorTitle}>Erro ao carregar fontes</Text>
                    <Text style={styles.errorMessage}>
                        {fontError.message || 'Erro desconhecido'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && cards.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
                <View style={styles.container}>
                    {/* Header seguindo padrão do design system */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerGreeting}>Seus</Text>
                            <Text style={styles.headerTitle}>Cartões</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => router.push('/addCard')} 
                            style={styles.addButton}
                        >
                            <Ionicons name="add" size={24} color="#6CC51D" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.errorContainer}>
                        <View style={styles.errorIconContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
                        </View>
                        <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchCardsData}>
                            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Renderização principal do componente
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
            <View style={styles.container}>
                {/* Header seguindo padrão do design system */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#2C3E50" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerGreeting}>Seus</Text>
                        <Text style={styles.headerTitle}>Cartões</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.push('/addCard')} 
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={24} color="#6CC51D" />
                    </TouchableOpacity>
                </View>

                {cards.length === 0 && !isLoading ? (
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="card-outline" size={64} color="#6CC51D" />
                        </View>
                        <Text style={styles.emptyTitle}>Nenhum cartão cadastrado</Text>
                        <Text style={styles.emptySubtitle}>
                            Adicione um cartão para facilitar seus pagamentos
                        </Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/addCard')} 
                            style={styles.addCardButton}
                        >
                            <Text style={styles.addCardButtonText}>Adicionar Cartão</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView 
                        style={styles.scrollView} 
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Stats Card - Total de cartões */}
                        {cards.length > 0 && (
                            <View style={styles.statsCard}>
                                <View style={styles.statsIconContainer}>
                                    <Ionicons name="card" size={20} color="#6CC51D" />
                                </View>
                                <Text style={styles.statsText}>
                                    {cards.length} {cards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}
                                </Text>
                            </View>
                        )}

                        {/* Lista de cartões */}
                        {cards.map((card) => (
                            <View key={card.id} style={styles.cardContainer}>
                                {card.isPrincipal && (
                                    <View style={styles.principalBadge}>
                                        <Text style={styles.principalBadgeText}>Principal</Text>
                                    </View>
                                )}
                                
                                <TouchableOpacity 
                                    onPress={() => toggleCardExpansion(card.id)} 
                                    style={styles.cardHeader}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardInfo}>
                                        <View style={styles.cardLogoContainer}>
                                            {getCardLogo(card.brand)}
                                        </View>
                                        <View style={styles.cardDetails}>
                                            <Text style={styles.cardName}>
                                                {card.nickname || card.brand}
                                            </Text>
                                            <Text style={styles.cardNumber}>
                                                •••• •••• •••• {card.last4Digits}
                                            </Text>
                                            <Text style={styles.cardMetadata}>
                                                {card.expiry} • {card.paymentMethodType === 'debit' ? 'Débito' : 'Crédito'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardActions}>
                                        <Ionicons
                                            name={expandedCardId === card.id ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={expandedCardId === card.id ? "#6CC51D" : "#BDC3C7"}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expandedCardId === card.id && (
                                    <View style={styles.expandedContent}>
                                        <View style={styles.divider} />
                                        
                                        <View style={styles.inputSection}>
                                            <Text style={styles.sectionTitle}>Informações do Cartão</Text>
                                            
                                            <InputField
                                                value={card.cardholderName}
                                                onChangeText={(text) => handleInputChange(card.id, 'cardholderName', text)}
                                                placeholder="Nome no cartão"
                                                icon={<Ionicons name="person-outline" size={20} color="#6CC51D" />}
                                                keyboardType="default"
                                            />
                                            
                                            <InputField
                                                value={`•••• •••• •••• ${card.last4Digits}`}
                                                onChangeText={() => {}}
                                                placeholder="Número do Cartão"
                                                icon={<Ionicons name="card-outline" size={20} color="#6CC51D" />}
                                                keyboardType="numeric"
                                                editable={false}
                                            />
                                            
                                            <View style={styles.rowInputs}>
                                                <View style={styles.halfInput}>
                                                    <InputField
                                                        value={card.expiry}
                                                        onChangeText={(text) => handleInputChange(card.id, 'expiry', text)}
                                                        placeholder="MM/AA"
                                                        icon={<Ionicons name="calendar-outline" size={20} color="#6CC51D" />}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                                <View style={styles.halfInput}>
                                                    <InputField
                                                        value={card.cvv || ''}
                                                        onChangeText={(text) => handleInputChange(card.id, 'cvv', text)}
                                                        placeholder="CVV"
                                                        icon={<Ionicons name="lock-closed-outline" size={20} color="#6CC51D" />}
                                                        keyboardType="numeric"
                                                        secureTextEntry
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.principalToggle}>
                                                <View style={styles.toggleInfo}>
                                                    <Text style={styles.toggleTitle}>Cartão Principal</Text>
                                                    <Text style={styles.toggleSubtitle}>
                                                        Será usado como padrão nos pagamentos
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={card.isPrincipal}
                                                    onValueChange={(value) => {
                                                        if (value) {
                                                            handleSetPrincipal(card.id);
                                                        }
                                                    }}
                                                    thumbColor={card.isPrincipal ? "#6CC51D" : "#BDC3C7"}
                                                    trackColor={{ false: "#F0F0F0", true: "#E8F8F5" }}
                                                    disabled={principalLoadingId === card.id}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity 
                                                style={styles.saveButton}
                                                onPress={() => handleSaveChanges(card.id)}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.saveButtonText}>
                                                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                                                </Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteCard(card.id)}
                                                disabled={isLoading}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.deleteButtonText}>Excluir Cartão</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    
    // Header seguindo padrão do design system
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: "#FAFAFA",
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    headerContent: {
        flex: 1,
    },
    headerGreeting: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "#7F8C8D",
        marginBottom: 4,
    },
    headerTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 24,
        color: "#2C3E50",
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#E8F8F5",
        justifyContent: "center",
        alignItems: "center",
    },

    // Loading & Error States
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    loadingText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 16,
        color: "#7F8C8D",
        marginTop: 12,
        textAlign: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FFEBEE",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    errorTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 20,
        color: "#E74C3C",
        marginBottom: 8,
        textAlign: "center",
    },
    errorMessage: {
        fontFamily: "Poppins_400Regular",
        fontSize: 15,
        color: "#7F8C8D",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: "#6CC51D",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    retryButtonText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 15,
        color: "#FFFFFF",
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E8F8F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 20,
        color: "#2C3E50",
        marginBottom: 12,
        textAlign: "center",
    },
    emptySubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 15,
        color: "#7F8C8D",
        marginBottom: 32,
        textAlign: "center",
        lineHeight: 22,
    },
    addCardButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#6CC51D",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    addCardButtonText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 15,
        color: "#FFFFFF",
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    // Stats Card seguindo padrão do design system
    statsCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginBottom: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    statsIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#E8F8F5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    statsText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 15,
        color: "#2C3E50",
        flex: 1,
    },

    // Card Container seguindo padrão do design system
    cardContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
        position: "relative",
        overflow: "hidden",
    },
    principalBadge: {
        position: "absolute",
        top: -1,
        right: 16,
        backgroundColor: "#6CC51D",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        zIndex: 1,
    },
    principalBadgeText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10,
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    cardInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    cardLogoContainer: {
        width: 48,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#F8F9FA",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    cardLogo: {
        width: 32,
        height: 20,
    },
    cardLogoPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    cardLogoText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10,
        color: "#7F8C8D",
    },
    cardDetails: {
        flex: 1,
    },
    cardName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#2C3E50",
        marginBottom: 4,
    },
    cardNumber: {
        fontFamily: "Poppins_500Medium",
        fontSize: 14,
        color: "#6CC51D",
        marginBottom: 4,
        letterSpacing: 1,
    },
    cardMetadata: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#7F8C8D",
    },
    cardActions: {
        marginLeft: 16,
    },

    // Expanded Content
    expandedContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginBottom: 20,
    },
    inputSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#2C3E50",
        marginBottom: 16,
    },
    rowInputs: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    principalToggle: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    toggleInfo: {
        flex: 1,
        marginRight: 16,
    },
    toggleTitle: {
        fontFamily: "Poppins_500Medium",
        fontSize: 15,
        color: "#2C3E50",
        marginBottom: 4,
    },
    toggleSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#7F8C8D",
        lineHeight: 16,
    },

    // Action Buttons
    actionButtons: {
        gap: 12,
    },
    saveButton: {
        backgroundColor: "#6CC51D",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    saveButtonText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 15,
        color: "#FFFFFF",
    },
    deleteButton: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E74C3C",
    },
    deleteButtonText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 15,
        color: "#E74C3C",
    },
});