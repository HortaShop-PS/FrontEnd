import React, { useEffect, useState, useRef } from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import LoadingIndicator from "./loadingIndicator";
import * as SecureStore from 'expo-secure-store';

export default function WelcomeScreen() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const hasNavigated = useRef(false);

    const [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    useEffect(() => {
        const initializeWelcome = async () => {
            try {
                // Marcar que viu a tela de welcome
                await SecureStore.setItemAsync('hasSeenWelcome', 'true');
                console.log('✅ Welcome screen marcada como vista');
                
                // Aguardar um pouco para garantir que tudo está carregado e o usuário vê a tela
                setTimeout(() => {
                    console.log('✅ Welcome screen pronta para mostrar');
                    setIsReady(true);
                }, 2000); // 2 segundos para o usuário ver a tela
            } catch (error) {
                console.error('Erro ao inicializar welcome:', error);
                setIsReady(true);
            }
        };
        
        if (fontsLoaded) {
            initializeWelcome();
        }
    }, [fontsLoaded]);

    function handleStart() {
        if (hasNavigated.current) return;
        
        console.log('🔄 Navegando para welcome2');
        hasNavigated.current = true;
        router.replace("/welcome2");
    }

    if (!fontsLoaded && !fontError) {
        return <LoadingIndicator />;
    }

    if (!isReady) {
        return <LoadingIndicator />;
    }

    return (
        <ImageBackground
            source={require("../assets/images/onboarding-bag.png")}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={styles.contentOverlay}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        <Text style={styles.titleBold}>Bem-Vindo ao{"\n"}</Text>
                        <Text style={styles.titleGreen}>HortaShop</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Encontre hortifruti fresquinho e de qualidade direto do produtor para a sua mesa.
                    </Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleStart}>
                    <Text style={styles.buttonText}>Começar</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    contentOverlay: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 60,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        textAlign: "center",
        marginBottom: 8,
        color: '#000',
    },
    titleBold: {
        fontFamily: 'Poppins_600SemiBold',
        fontWeight: '600',
    },
    titleGreen: {
        fontFamily: 'Poppins_700Bold',
        fontWeight: '700',
        color: '#6CC51D',
    },
    subtitle: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 16,
        textAlign: "center",
        color: '#666',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: '#6CC51D',
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
    },
});