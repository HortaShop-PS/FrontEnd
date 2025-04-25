import React, { useEffect, useState } from "react"; // Adicionado useEffect, useState
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert } from "react-native"; // Adicionado ActivityIndicator, Alert
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins"; // Adicionado Poppins_700Bold se necessário
import { Ionicons, AntDesign } from '@expo/vector-icons';
import LoadingIndicator from "./loadingIndicator";
import * as WebBrowser from 'expo-web-browser'; // Adicionado
import * as Google from 'expo-auth-session/providers/google'; // Adicionado
import * as Linking from 'expo-linking'; // Adicionado
import { handleOAuthCallback } from "../utils/authServices"; // Adicionado

// Garante que o WebBrowser possa ser dispensado
WebBrowser.maybeCompleteAuthSession(); // Adicionado

export default function AuthScreen() {
    const router = useRouter();
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false); // Adicionado estado de loading

    const [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold, // Mantido se usado nos estilos
    });

    // --- Configuração do Expo Auth Session para Google --- (Adicionado)
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        // iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        // androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    });

    // --- Efeito para lidar com a resposta do Google --- (Adicionado)
    useEffect(() => {
        const handleResponse = async () => {
            if (response) {
                setIsLoadingGoogle(false); // Termina o loading ao receber resposta
                console.log("Resposta do AuthSession:", JSON.stringify(response, null, 2));

                if (response.type === 'success') {
                    const { url } = response.params;
                    console.log("URL de redirecionamento recebida:", url);

                    try {
                        const token = await handleOAuthCallback(url);
                        if (token) {
                            Alert.alert("Sucesso", "Login com Google realizado!");
                            // TODO: Atualizar estado global de autenticação
                            router.replace('/(tabs)');
                        } else {
                            Alert.alert("Erro", "Não foi possível obter o token da resposta do servidor.");
                        }
                    } catch (error: any) {
                         Alert.alert("Erro", `Falha ao processar callback: ${error.message}`);
                    }

                } else if (response.type === 'error') {
                    console.error("Erro do AuthSession:", response.error);
                    Alert.alert("Erro de Autenticação", `Não foi possível completar o login com Google: ${response.error?.message || response.type}`);
                } else if (response.type === 'cancel' || response.type === 'dismiss') {
                    console.log("Autenticação com Google cancelada ou dispensada.");
                }
            }
        };

        handleResponse();
    }, [response, router]);

    // --- Funções de Navegação ---

    // Atualizado handleGoogleLogin
    async function handleGoogleLogin() {
        console.log("Iniciando login com Google...");
        setIsLoadingGoogle(true);

        const backendGoogleAuthUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/google`;

        try {
            await promptAsync({ url: backendGoogleAuthUrl });
        } catch (error: any) {
            console.error("Erro ao iniciar promptAsync:", error);
            Alert.alert("Erro", `Não foi possível iniciar o login com Google: ${error.message}`);
            setIsLoadingGoogle(false);
        }
    }

    function handleCreateAccount() {
        console.log("Ir para criar conta");
        // router.push('/register');
    }

    function handleGoToLogin() {
        console.log("Ir para login com email/senha");
        router.push('/login');
    }

    // --- Renderização ---
    if (!fontsLoaded && !fontError) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require("../assets/images/auth-background-2.png")} // Verifique o nome da imagem
                style={styles.imageBackground}
                resizeMode="cover"
            />

            {/* Botão Voltar posicionado absolutamente */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isLoadingGoogle}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Container inferior posicionado absolutamente */}
            <View style={styles.bottomContainer}>
                <Text style={styles.title}>Bem-Vindo</Text>
                <Text style={styles.subtitle}>
                    Faça login ou crie uma conta para ter acesso a todo o frescor da horta.
                </Text>

                {/* Botão Google com loading e estado desabilitado */}
                <TouchableOpacity
                    style={[styles.button, styles.googleButton, isLoadingGoogle && styles.buttonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={!request || isLoadingGoogle} // Desabilita se request não pronto ou carregando
                >
                    {isLoadingGoogle ? (
                        <ActivityIndicator size="small" color="#555" /> // Indicador de loading
                    ) : (
                        <>
                            <AntDesign name="google" size={20} color="#DB4437" style={styles.icon} />
                            <Text style={[styles.buttonText, styles.googleButtonText]}>Continuar com Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Botão Criar Conta com estado desabilitado */}
                <TouchableOpacity
                    style={[styles.button, styles.createButton, isLoadingGoogle && styles.buttonDisabled]}
                    onPress={handleCreateAccount}
                    disabled={isLoadingGoogle} // Desabilita durante login Google
                >
                    <Text style={[styles.buttonText, styles.createButtonText]}>Criar conta</Text>
                </TouchableOpacity>

                {/* Link para Entrar com estado desabilitado */}
                <View style={styles.loginLinkContainer}>
                    <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
                    <TouchableOpacity onPress={handleGoToLogin} disabled={isLoadingGoogle}>
                        <Text style={[styles.loginLinkText, styles.loginLinkAction, isLoadingGoogle && styles.linkDisabled]}>Entrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// --- Estilos --- (Adicionado buttonDisabled e linkDisabled)
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageBackground: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100%', height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
        left: 20,
        padding: 5,
        zIndex: 1,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 30,
    },
    title: {
        fontFamily: 'Poppins_700Bold', // Certifique-se que Poppins_700Bold está carregada
        fontSize: 26,
        color: '#333',
        textAlign: 'left',
        marginBottom: 8,
        width: '100%',
    },
    subtitle: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: '#888',
        textAlign: 'left',
        marginBottom: 35,
        lineHeight: 20,
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 5, // Mantido como 5
    },
    buttonDisabled: { // Estilo para botões desabilitados
        opacity: 0.6,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    createButton: {
        backgroundColor: '#7ABC00', // Mantido verde
    },
    icon: {
        marginRight: 12, // Mantido 12
    },
    buttonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
    },
    googleButtonText: {
        color: '#555', // Mantido cinza escuro
    },
    createButtonText: {
        color: '#FFFFFF', // Mantido branco
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        width: '100%',
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
    linkDisabled: { // Estilo para link desabilitado
        opacity: 0.6,
    }
});