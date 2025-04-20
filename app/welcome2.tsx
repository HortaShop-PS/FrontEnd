import React from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Ionicons, AntDesign } from '@expo/vector-icons';
import LoadingIndicator from "./loadingIndicator";

export default function AuthScreen() {
    const router = useRouter();

    let [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    function handleGoogleLogin() {
        console.log("Iniciar login com Google");
        // TODO: Adicionar lógica de login com Google
        // Se sucesso: router.replace('/(tabs)');
    }

    function handleCreateAccount() {
        console.log("Ir para criar conta");
        // TODO: Navegar para a tela de cadastro
        // router.push('/register'); 
    }

    function handleGoToLogin() {
        console.log("Ir para login com email/senha");
        // Navegar para a tela de login tradicional
        router.push('/login'); 
    }

    if (!fontsLoaded && !fontError) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            {/* Ajuste barStyle conforme a cor do topo da imagem */}
            <StatusBar barStyle="light-content" /> 
            <ImageBackground
                source={require("../assets/images/auth-background-2.png")} // Verifique se esta é a imagem correta
                style={styles.imageBackground} // Estilo ajustado
                resizeMode="cover"
            >
                {/* Botão Voltar ajustado */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

            </ImageBackground>

            {/* Container inferior branco */}
            <View style={styles.bottomContainer}>
                {/* ... (conteúdo do bottomContainer) ... */}
                <Text style={styles.title}>Bem-Vindo</Text>
                <Text style={styles.subtitle}>
                    Faça login ou crie uma conta para ter acesso a todo o frescor da horta.
                </Text>

                {/* Botão Google */}
                <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleLogin}>
                    <AntDesign name="google" size={20} color="#DB4437" style={styles.icon} />
                    <Text style={[styles.buttonText, styles.googleButtonText]}>Continuar com Google</Text>
                </TouchableOpacity>

                {/* Botão Criar Conta*/}
                <TouchableOpacity style={[styles.button, styles.createButton]} onPress={handleCreateAccount}>
                    <Text style={[styles.buttonText, styles.createButtonText]}>Criar conta</Text>
                </TouchableOpacity>

                {/* Link para Entrar */}
                <View style={styles.loginLinkContainer}>
                    <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
                    <TouchableOpacity onPress={handleGoToLogin}>
                        <Text style={[styles.loginLinkText, styles.loginLinkAction]}>Entrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F6F6', 
    },
    imageBackground: {
        flex: 1,
        width: '70%', // Corrigido para 100%
        // height removido
        justifyContent: 'flex-start', 
        alignItems: 'flex-start', 
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50, 
        paddingLeft: 20, 
        marginTop: 50, // Adicionado marginTop para "descer" a imagem
    },
    backButton: {
        padding: 5, 
    },
    bottomContainer: {
        // flex: -1, // Removido flex inválido
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 20, 
    },
    // ... (restante dos estilos) ...
    title: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 26,
        color: '#333',
        textAlign: 'left',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: '#888',
        textAlign: 'left',
        marginBottom: 35,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 5,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    createButton: {
        backgroundColor: '#7ABC00',
    },
    icon: {
        marginRight: 20,
    },
    buttonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
    },
    googleButtonText: {
        color: '#555',
    },
    createButtonText: {
        color: '#FFFFFF',
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20, 
    },
    loginLinkText: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: '#888', 
    },
    loginLinkAction: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#333', 
    },
});