import React, { useEffect } from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import LoadingIndicator from "./loadingIndicator";
import * as SecureStore from 'expo-secure-store';

export default function WelcomeScreen() {
    const router = useRouter();

    const [fontsLoaded, fontError] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });

    useEffect(() => {

        const markWelcomeScreenAsSeen = async () => {
            await SecureStore.setItemAsync('hasSeenWelcome', 'true');
        };
        
        markWelcomeScreenAsSeen();
    }, []);

    function handleStart() {
        router.replace("/welcome2");
    }

    if (!fontsLoaded && !fontError) {
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
        color: "#000",
        fontSize: 24,
    },
    titleGreen: {
        fontFamily: 'Poppins_700Bold',
        color: "#7ABC00",
        fontSize: 48,
    },
    subtitle: {
        fontFamily: 'Poppins_400Regular',
        color: "#000",
        fontSize: 14,
        textAlign: "center",
    },
    button: {
        backgroundColor: "#7ABC00",
        paddingVertical: 16,
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
        elevation: 5,
    },
    buttonText: {
        fontFamily: 'Poppins_600SemiBold',
        color: "#fff",
        fontSize: 16,
    },
});