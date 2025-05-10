import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert, StatusBar } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useCallback, useState } from "react";
import { getProfile, logout } from "../../utils/authServices";
import * as SecureStore from 'expo-secure-store';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
}

export default function ProfileScreen() {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    let [fontsLoaded] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });
    const router = useRouter();

    const loadUserProfile = async () => {
        try {
            setLoading(true);

            const data = await getProfile();
            setUserData({
                id: data.id.toString(),
                name: data.name,
                email: data.email,
            });
        } catch (error) {
            console.error("Erro no componente de perfil:", error);
            setError(error instanceof Error ? error.message : "Falha ao carregar o perfil do usuário");
            router.replace('/welcome2');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
            return () => {
                // Cleanup function
            };
        }, [])
    );

    const handleLogout = async () => {
        Alert.alert(
            "Sair da conta",
            "Tem certeza que deseja sair?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Sair",
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/welcome2');
                        } catch (error) {
                            console.error("Erro ao fazer logout:", error);
                            Alert.alert("Erro", "Não foi possível fazer logout. Tente novamente.");
                        }
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        router.push("/about");
    };

    const handleFavorites = () => {
            router.push('/favorites');
    };

    if (!fontsLoaded) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#6CC51D" />
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#6CC51D" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meu Perfil</Text>
                </View>

                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <View style={styles.containerCircle}>
                            <Ionicons name="person" color="#555" size={60} style={styles.profileDP} />
                        </View>
                        <TouchableOpacity style={styles.editImageButton} onPress={() => router.push("/about")}>
                            <Ionicons name="camera" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{userData?.name || "Fulano de Tal"}</Text>
                    <Text style={styles.userEmail}>{userData?.email || "fulano@fulanomail.com"}</Text>
                    <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push("/about")}>
                        <Text style={styles.editProfileText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Conta</Text>
                    <TouchableOpacity onPress={() => router.push("/about")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="person-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Sobre Mim</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="cube-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Meus Pedidos</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleFavorites()}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="heart-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Meus Favoritos</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Configurações</Text>
                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="location-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Meus Endereços</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="card-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Cartões De Crédito</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <MaterialCommunityIcons name="history" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Histórico de Transações</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="notifications-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Notificações</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#FF6B6B" style={styles.logoutIcon} />
                    <Text style={styles.logoutText}>Sair da Conta</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 18,
        color: "#333",
    },
    profileSection: {
        alignItems: "center",
        paddingVertical: 20,
        borderBottomWidth: 8,
        borderBottomColor: "#F5F5F5",
    },
    profileImageContainer: {
        position: "relative",
        marginBottom: 15,
    },
    containerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#6CC51D",
        overflow: "hidden",
    },
    profileDP: {
        width: "100%",
        height: "100%",
        textAlign: "center",
        textAlignVertical: "center",
    },
    editImageButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#6CC51D",
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    userName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 18,
        color: "#333",
        marginBottom: 4,
    },
    userEmail: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "#777",
        marginBottom: 15,
    },
    editProfileButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#6CC51D",
    },
    editProfileText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 14,
        color: "#6CC51D",
    },
    menuSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 8,
        borderBottomColor: "#F5F5F5",
    },
    menuSectionTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#333",
        marginBottom: 15,
    },
    menuItemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    menuIcon: {
        marginRight: 15,
    },
    menuItemText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 15,
        color: "#333",
        flex: 1,
    },
    chevronIcon: {
        marginLeft: "auto",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: "#FFF0F0",
        marginBottom: 20,
    },
    logoutIcon: {
        marginRight: 10,
    },
    logoutText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#FF6B6B",
    },
    versionInfo: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 30,
    },
    versionText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#999",
    },
});