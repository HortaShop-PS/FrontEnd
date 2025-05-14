import React, { useEffect, useState } from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert } from "react-native";
import { router, useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Ionicons, AntDesign } from '@expo/vector-icons';
import LoadingIndicator from "./loadingIndicator";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import { handleOAuthCallback } from "../utils/authServices";
import * as SecureStore from 'expo-secure-store';
import { showAlert, showSuccess, showError } from '../utils/alertService';
import Config from "react-native-config";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
    const router = useRouter();
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    const userType = await SecureStore.getItemAsync('userType');
                    if (userType === 'producer') {
                        router.replace('/(tabsProducers)');
                    } else {
                        router.replace('/(tabs)');
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
            } finally {
                setIsCheckingAuth(false);
            }
        };
        
        checkAuthentication();
    }, [router]);

    useEffect(() => {
        if (response) {
            handleResponse();
        }
    }, [response]);

    const handleResponse = async () => {
        if (response) {
            setIsLoadingGoogle(false);
            console.log("Resposta do AuthSession:", JSON.stringify(response, null, 2));

            if (response.type === 'success') {
                const { url } = response.params;
                console.log("URL de redirecionamento recebida:", url);

                try {
                    const token = await handleOAuthCallback(url);
                    if (token) {
                        showSuccess("Sucesso", "Login com Google realizado!");
                        router.replace('/(tabs)');
                    } else {
                        showError("Erro", "Não foi possível obter o token da resposta do servidor.");
                    }
                } catch (error: any) {
                    showError("Erro", `Falha ao processar callback: ${error.message}`);
                }

            } else if (response.type === 'error') {
                console.error("Erro do AuthSession:", response.error);
                showError("Erro de Autenticação", `Não foi possível completar o login com Google: ${response.error?.message || response.type}`);
            } else if (response.type === 'cancel' || response.type === 'dismiss') {
                console.log("Autenticação com Google cancelada ou dispensada.");
            }
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoadingGoogle(true);
        await promptAsync();
    };

    function handleCreateAccount() {
        console.log("Ir para criar conta");
        router.push('/register');
    }

    function handleGoToLogin() {
        console.log("Ir para login com email/senha");
        router.push('/login');
    }

    if (!fontsLoaded && !fontError) {
        return <LoadingIndicator />;
    }

    if (isCheckingAuth) {
        return <LoadingIndicator />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require("../assets/images/auth-background-2.png")}
                style={styles.imageBackground}
                resizeMode="cover"
            />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isLoadingGoogle}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.bottomContainer}>
                <Text style={styles.title}>Bem-Vindo</Text>
                <Text style={styles.subtitle}>
                    Faça login ou crie uma conta para ter acesso a todo o frescor da horta.
                </Text>

                <TouchableOpacity
                    style={[styles.button, styles.googleButton, isLoadingGoogle && styles.buttonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={!request || isLoadingGoogle}
                >
                    {isLoadingGoogle ? (
                        <ActivityIndicator size="small" color="#555" />
                    ) : (
                        <>
                            <AntDesign name="google" size={20} color="#DB4437" style={styles.icon} />
                            <Text style={[styles.buttonText, styles.googleButtonText]}>Continuar com Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.createButton, isLoadingGoogle && styles.buttonDisabled]}
                    onPress={handleCreateAccount}
                    disabled={isLoadingGoogle}
                >
                    <Text style={[styles.buttonText, styles.createButtonText]}>Criar conta</Text>
                </TouchableOpacity>

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
        fontFamily: 'Poppins_700Bold',
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
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
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
        marginRight: 12,
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
    linkDisabled: {
        opacity: 0.6,
    }
});