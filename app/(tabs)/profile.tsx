import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular } from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
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
    })
    const router = useRouter();

    useEffect(() => {
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

        loadUserProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/welcome2');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#6CC51D" />
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <View style={styles.containerUser}>
                <View style={styles.containerCircle}>
                    <Ionicons name={'person'} color={"black"} size={110} style={styles.profileDP} />
                </View>
                <Text style={styles.textUserName}>{userData?.name || "Fulano de Tal"}</Text>
                <Text style={styles.textUserEmail}>{userData?.email || "fulano@fulanomail.com"}</Text>
            </View>
            <View style={styles.containerBottomSection}>
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
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="heart-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Meus Favoritos</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
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
                <TouchableOpacity onPress={handleLogout}>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="log-out-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Sair</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const SPACING = 13;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        paddingTop: SPACING * 4,
        paddingBottom: SPACING * 2,
        backgroundColor: "#F4F5F9",
    },
    containerUser: {
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginVertical: SPACING,
    },
    containerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: "#6CC51D",
        overflow: "hidden",
        marginBottom: SPACING,
        justifyContent: "center",
        alignItems: "center",
    },
    profileDP: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: SPACING / 2,
    },
    textUserName: {
        fontSize: 15,
        fontFamily: "Poppins_600SemiBold",
        marginVertical: SPACING / 16,
    },
    textUserEmail: {
        fontSize: 12,
        color: "#868889",
        fontFamily: "Poppins_400Regular",
        marginVertical: SPACING / 16,
    },
    containerBottomSection: {
        justifyContent: "center",
        flexDirection: "column",
        paddingHorizontal: SPACING * 3,
    },
    menuItemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: SPACING / 2,
    },
    menuIcon: {
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 12,
        fontFamily: "Poppins_600SemiBold",
        fontWeight: "semibold",
        color: "#333",
        flex: 1,
        marginVertical: SPACING / 2,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    chevronIcon: {
        marginLeft: 12,
    },

});