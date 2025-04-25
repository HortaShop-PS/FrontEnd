import React, { useState } from "react";
import { View, Text, ImageBackground, TextInput, TouchableOpacity, StyleSheet, StatusBar, Switch, Alert, ActivityIndicator } from "react-native"; // Adicionado Alert e ActivityIndicator
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingIndicator from "./loadingIndicator";
import { login } from "../utils/authServices"; // Importar a função de login

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false); // Lógica de 'rememberMe' não implementada no service ainda
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Estado para loading

    const [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert("Erro", "Por favor, preencha o email e a senha.");
            return;
        }
        setIsLoading(true); // Inicia o loading
        try {
            console.log("Tentativa de Login:", { email }); // Não logar senha
            await login({ email, password });
            Alert.alert("Sucesso", "Login realizado com sucesso!");
            // TODO: Atualizar estado global de autenticação (Context/Redux/Zustand)
            router.replace('/(tabs)'); // Navega para a área logada
        } catch (error: any) {
            console.error("Falha no login:", error.message);
            Alert.alert("Erro de Login", error.message || "Não foi possível fazer login. Verifique suas credenciais.");
        } finally {
            setIsLoading(false); // Termina o loading
        }
    }

    function handleForgotPassword() {
        console.log("Navegar para: Esqueci minha senha");
        Alert.alert("Indisponível", "Funcionalidade ainda não implementada.");
        // router.push('/forgot-password');
    }

    function handleGoToRegister() {
        console.log("Navegar para: Cadastro");
        // Idealmente, você teria uma tela de registro separada
        // router.push('/register');
        // Por enquanto, podemos voltar para a tela anterior que tem o botão "Criar conta"
        router.replace('/welcome2');
    }

    if (!fontsLoaded && !fontError) {
        return <LoadingIndicator />;
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ImageBackground
            source={require("../assets/images/auth-background.png")}
            style={styles.imageBackground}
            resizeMode="cover"
        />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isLoading}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.bottomContainer}>
                <Text style={styles.title}>Bem-Vindo de Volta!</Text>
                <Text style={styles.subtitle}>Entre na sua conta</Text>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Endereço de E-mail"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#A0A0A0"
                        editable={!isLoading} // Desabilita enquanto carrega
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        placeholderTextColor="#A0A0A0"
                        editable={!isLoading} // Desabilita enquanto carrega
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(prev => !prev)} disabled={isLoading}>
                        <Ionicons
                            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color="#A0A0A0"
                            style={styles.eyeIcon}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.optionsContainer}>
                    <View style={styles.rememberMeContainer}>
                        <Switch
                            trackColor={{ false: "#E0E0E0", true: "#AED581" }}
                            thumbColor={rememberMe ? "#7ABC00" : "#f4f3f4"}
                            ios_backgroundColor="#E0E0E0"
                            onValueChange={setRememberMe}
                            value={rememberMe}
                            style={styles.switch}
                            disabled={isLoading}
                        />
                        <Text style={styles.optionText}>Lembrar de mim</Text>
                    </View>
                    <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                        <Text style={styles.linkText}>Esqueci minha senha</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]} // Estilo desabilitado
                    onPress={handleLogin}
                    disabled={isLoading} // Desabilita o botão
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" /> // Mostra loading no botão
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerLinkText}>Não tem uma conta? </Text>
                    <TouchableOpacity onPress={handleGoToRegister} disabled={isLoading}>
                        <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// Adicione o estilo para o botão desabilitado aos seus styles
const styles = StyleSheet.create({
    // ... (seus estilos existentes)
    button: {
        backgroundColor: '#7ABC00',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: "center",
        elevation: 3,
        width: '100%',
    },
    buttonDisabled: {
        backgroundColor: '#AED581', // Cor mais clara para indicar desabilitado
    },
    buttonText: {
        fontFamily: 'Poppins_600SemiBold',
        color: "#fff",
        fontSize: 16,
    },
    // ... (restante dos seus estilos)
    container: {
        flex: 1,
    },
    imageBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
        left: 20, // Ajustado para esquerda
        padding: 5,
        zIndex: 1,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    title: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 25,
        color: '#333',
        textAlign: 'left',
        marginBottom: 5,
    },
    subtitle: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 15,
        color: '#888',
        textAlign: 'left',
        marginBottom: 25,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontFamily: 'Poppins_400Regular',
        paddingVertical: 14,
        fontSize: 15,
        color: '#333',
    },
    eyeIcon: {
        marginLeft: 10,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switch: {
        transform: [{ scaleX: .8 }, { scaleY: .8 }],
        marginRight: 5,
    },
    optionText: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: '#555',
    },
    linkText: {
        // Corrigido: Poppins_400Regular
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: '#7ABC00',
    },
    footerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    footerLinkText: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        color: '#888',
    },
    footerLinkAction: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#333',
    },
});
