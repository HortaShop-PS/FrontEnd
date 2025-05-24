import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Image, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Importações de fontes, se você estiver usando fontes personalizadas como Poppins
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";

// Tipagem para os dados do cartão
interface CardData {
    id: string;
    brand: 'Master Card' | 'Visa Card';
    last4: string;
    expiry: string;
    cvv: string;
    holderName: string;
    isPrincipal: boolean;
}

// Dados mockados para os cartões
const MOCKED_CARDS: CardData[] = [
    { id: '1', brand: 'Master Card', last4: '8790', expiry: '01/32', cvv: '908', holderName: 'Fulano de tal', isPrincipal: true },
    { id: '2', brand: 'Visa Card', last4: '5678', expiry: '09/30', cvv: '322', holderName: 'Fulano de tal', isPrincipal: false },
    { id: '3', brand: 'Master Card', last4: '6789', expiry: '06/25', cvv: '768', holderName: 'Fulano de tal', isPrincipal: false },
];

// URLs para logos de cartões (exemplo)
// Você precisará adicionar essas imagens ao seu projeto em assets/images/
// e descomentar as linhas abaixo, ajustando os caminhos se necessário.
const CARD_LOGOS = {
    'Master Card': require('../assets/images/mastercard_logo.png'), 
    'Visa Card': require('../assets/images/visa_logo.png'),       
};


export default function MyCardsScreen() {
    const router = useRouter();
    const [cards, setCards] = useState<CardData[]>(MOCKED_CARDS);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(MOCKED_CARDS.find(c => c.isPrincipal)?.id || null);
    
    // Se estiver usando fontes personalizadas:
    let [fontsLoaded] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    if (!fontsLoaded) {
        return <View style={styles.centered}><Text>Carregando fontes...</Text></View>;
    }

    const toggleCardExpansion = (cardId: string) => {
        setExpandedCardId(expandedCardId === cardId ? null : cardId);
    };

    const handleSetPrincipal = (cardId: string) => {
        setCards(prevCards =>
            prevCards.map(card =>
                card.id === cardId
                    ? { ...card, isPrincipal: true }
                    : { ...card, isPrincipal: false }
            )
        );
        // Após definir um novo principal, se ele estava expandido, mantenha-o expandido.
        // Se outro estava expandido, feche-o e expanda o novo principal.
        setExpandedCardId(cardId);
    };

    const handleInputChange = (cardId: string, field: keyof CardData, value: string | boolean) => {
        setCards(prevCards =>
            prevCards.map(card =>
                card.id === cardId ? { ...card, [field]: value } : card
            )
        );
    };
    
    const handleDeleteCard = (cardId: string) => {
        Alert.alert(
            "Excluir Cartão",
            "Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    onPress: () => {
                        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
                        if (expandedCardId === cardId) {
                            setExpandedCardId(null); // Fecha a expansão se o cartão excluído estava expandido
                        }
                        // Opcional: Lógica para lidar com a exclusão do cartão principal
                        // Por exemplo, se o cartão principal for excluído e houver outros cartões,
                        // você pode querer definir o próximo cartão como principal automaticamente.
                        // Ou, se não houver mais cartões, limpar alguma indicação de principal.
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const getCardLogo = (brand: 'Master Card' | 'Visa Card') => {
        try {
            if (brand === 'Master Card' && CARD_LOGOS['Master Card']) {
                 return <Image source={CARD_LOGOS['Master Card']} style={styles.mastercardLogo} resizeMode="contain" />;
            } else if (brand === 'Visa Card' && CARD_LOGOS['Visa Card']) {
                 return <Image source={CARD_LOGOS['Visa Card']} style={styles.visaLogo} resizeMode="contain" />;
            }
        } catch (error) {
            console.warn("Erro ao carregar logo do cartão. Verifique se as imagens mastercard_logo.png e visa_logo.png existem em assets/images/", error);
        }
        // Fallback para placeholder se a imagem não puder ser carregada
        if (brand === 'Master Card') {
            return <View style={[styles.cardLogoPlaceholder, {backgroundColor: '#F0F0F0'}]}><View style={[styles.cardLogoMCCircle, {backgroundColor: '#EB001B', right: -7}]}/><View style={[styles.cardLogoMCCircle, {backgroundColor: '#F79E1B', left: -7, opacity: 0.8}]}/></View>;
        }
        return <View style={styles.cardLogoPlaceholder}><Text style={{fontSize: 10, color: '#777'}}>{brand.substring(0,4)}</Text></View>;
    };


    return (
        <View style={styles.container}>
            {/* Cabeçalho */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Cartões</Text>
                <TouchableOpacity onPress={() => router.push('/addCard')} style={styles.headerButton}>
                    <Ionicons name="add" size={32} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
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
                                    <Text style={styles.cardBrand}>{card.brand}</Text>
                                    <Text style={styles.cardNumber}>XXXX XXXX XXXX {card.last4}</Text>
                                    <Text style={styles.cardDetails}>Expiry: {card.expiry}   CVV: {card.cvv}</Text>
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
                                        value={card.holderName}
                                        onChangeText={(text) => handleInputChange(card.id, 'holderName', text)}
                                        placeholder="Nome no cartão"
                                        placeholderTextColor="#AAA"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={`•••• •••• •••• ${card.last4}`} 
                                        editable={false} 
                                        placeholder="Número do cartão"
                                        placeholderTextColor="#AAA"
                                    />
                                </View>
                                <View style={styles.rowInputContainer}>
                                    <View style={[styles.inputContainer, styles.halfInput]}>
                                        <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={card.expiry}
                                            onChangeText={(text) => handleInputChange(card.id, 'expiry', text)}
                                            placeholder="MM/AA"
                                            placeholderTextColor="#AAA"
                                            maxLength={5} // MM/AA
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, styles.halfInput, { marginLeft: 10 }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={card.cvv}
                                            onChangeText={(text) => handleInputChange(card.id, 'cvv', text)}
                                            placeholder="CVV"
                                            placeholderTextColor="#AAA"
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
                                        ios_backgroundColor="#E0E0E0"
                                        onValueChange={() => handleSetPrincipal(card.id)}
                                        value={card.isPrincipal}
                                        disabled={card.isPrincipal} 
                                    />
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteCard(card.id)} style={styles.deleteButton}>
                                    <Ionicons name="trash-outline" size={20} color="#DC3545" style={styles.deleteIcon} />
                                    <Text style={styles.deleteButtonText}>Excluir Cartão</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}

                 <TouchableOpacity onPress={() => router.push('/addCard')} style={styles.addNewCardButton}>
                    <Ionicons name="add-circle-outline" size={22} color="#6CC51D" />
                    <Text style={styles.addNewCardButtonText}>Adicionar novo cartão</Text>
                </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={() => console.log('Configurações salvas:', cards)}>
                <Text style={styles.saveButtonText}>Salvar configuração</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', 
    },
    centered: { // Para loading de fontes, se necessário
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 25 + 15 : 40 + 15, // Ajuste para StatusBar + padding
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    headerButton: {
        padding: 8, // Aumenta a área de toque
    },
    headerTitle: {
        fontSize: 20,
        // fontFamily: 'Poppins_600SemiBold', 
        fontWeight: '600',
        color: '#212529',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 80, // Espaço para o botão Salvar não sobrepor o último card
    },
    cardItemContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 18,
        shadowColor: "#ADB5BD",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        position: 'relative', // Para o badge "Principal"
    },
    principalCardBorder: { // Estilo adicional para o card principal, se desejado (ex: borda mais grossa)
        // borderColor: '#6CC51D',
        // borderWidth: 1.5,
    },
    principalBadge: {
        position: 'absolute',
        top: 12, 
        left: -8, // Para sair um pouco da caixa do cartão
        backgroundColor: '#E6FFD7', 
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        zIndex: 10, // Para ficar acima de outros elementos
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    principalBadgeText: {
        color: '#388E3C', // Verde escuro para contraste
        // fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
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
        height: 32, // Proporção comum para logos de cartão
        borderRadius: 5, // Bordas levemente arredondadas
        backgroundColor: '#F1F3F5', // Fundo neutro para o logo
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden', 
    },
    mastercardLogo: { // Específico para o logo do Mastercard
        width: '70%',
        height: '70%',
    },
    visaLogo: { // Específico para o logo da Visa
        width: '80%',
        height: '80%',
    },
    cardLogoPlaceholder: { // Placeholder genérico
        width: 40,
        height: 25,
        borderRadius: 4,
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLogoMCCircle: { // Círculos para simular Mastercard
        width: 18,
        height: 18,
        borderRadius: 9,
        position: 'absolute',
    },
    cardTextContainer: {
        flex: 1,
    },
    cardBrand: {
        fontSize: 16,
        // fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
        color: '#343A40',
        marginBottom: 2,
    },
    cardNumber: {
        fontSize: 14,
        // fontFamily: 'Poppins_400Regular',
        color: '#495057',
        letterSpacing: 0.5, // Leve espaçamento para números
    },
    cardDetails: {
        fontSize: 12,
        // fontFamily: 'Poppins_400Regular',
        color: '#6C757D',
        marginTop: 3,
    },
    chevronIcon: {
        marginLeft: 10, // Espaço entre o texto e o ícone
    },
    cardExpandedContent: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#F1F3F5', // Linha divisória sutil
        marginTop: 10, // Espaço após o header do card
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA', // Fundo do input um pouco diferente do card
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 12, // Espaçamento entre inputs
        height: 48, // Altura padrão para inputs
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    inputIcon: {
        marginRight: 10,
        color: '#6C757D', // Cor do ícone
    },
    input: {
        flex: 1,
        fontSize: 15,
        // fontFamily: 'Poppins_400Regular',
        color: '#343A40',
        height: '100%',
    },
    rowInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    halfInput: {
        flex: 1, // Para ocupar o espaço disponível igualmente
        // Não precisa de width: '48%' se usar flex:1 e margin no segundo
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
        paddingVertical: 8, // Espaçamento vertical interno
    },
    switchLabel: {
        fontSize: 15,
        // fontFamily: 'Poppins_400Regular',
        color: '#343A40',
        marginRight: 10, // Espaço entre o texto e o switch
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20, // Espaço acima do botão de excluir
        paddingVertical: 12,
        backgroundColor: '#FFF4F4', // Fundo vermelho bem claro
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E57373', // Borda vermelha clara
    },
    deleteIcon: {
        marginRight: 8,
    },
    deleteButtonText: {
        color: '#DC3545', // Texto vermelho escuro
        fontSize: 15,
        // fontFamily: 'Poppins_500Medium', // Ou Poppins_600SemiBold
        fontWeight: '500',
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
        marginTop: 25, // Espaço após a lista de cartões
    },
    addNewCardButtonText: {
        // fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
        fontSize: 15,
        color: '#6CC51D',
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: '#6CC51D',
        paddingVertical: 16,
        marginHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute', // Para fixar na parte inferior
        bottom: 20,          // Distância da parte inferior
        left: 20,
        right: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        // fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
    },
});
