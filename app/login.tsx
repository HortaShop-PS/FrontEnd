import React, { useState } from "react";
// Removido ScrollView dos imports
import { View, Text, ImageBackground, TextInput, TouchableOpacity, StyleSheet, StatusBar, Switch } from "react-native"; 
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingIndicator from "./loadingIndicator";

export default function LoginScreen() {
    // ... (useState, useFonts, handlers - sem alterações) ...
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    function handleLogin() {
        console.log("Tentativa de Login:", { email, password, rememberMe });
        router.replace('/(tabs)');
    }

    function handleForgotPassword() {
        console.log("Navegar para: Esqueci minha senha");
        // router.push('/forgot-password');
    }

    function handleGoToRegister() {
        console.log("Navegar para: Cadastro");
        // router.push('/register');
    }

    if (!fontsLoaded && !fontError) {
        return <LoadingIndicator />;
    }

    return (
      // O container principal ainda precisa de flex: 1
      <View style={styles.container}> 
        <StatusBar barStyle="dark-content" />
        <ImageBackground
            source={require("../assets/images/auth-background.png")}
            style={styles.imageBackground} 
            resizeMode="cover"
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('./welcome')}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </ImageBackground>

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
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(prev => !prev)}>
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
                        />
                        <Text style={styles.optionText}>Lembrar de mim</Text>
                    </View>
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.linkText}>Esqueci minha senha</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Entrar</Text>
                </TouchableOpacity>

                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerLinkText}>Não tem uma conta? </Text>
                    <TouchableOpacity onPress={handleGoToRegister}>
                        <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Cadastrar</Text>
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
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
        paddingLeft: 20,
    },
    backButton: {
        padding: 5,
    },
    bottomContainer: {

        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        paddingHorizontal: 24,
        paddingTop: 30,
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
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: '#7ABC00',
    },
    button: {
        backgroundColor: '#7ABC00',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: "center",
        elevation: 3,
        width: '100%',
    },
    buttonText: {
        fontFamily: 'Poppins_600SemiBold',
        color: "#fff",
        fontSize: 15,
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