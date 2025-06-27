import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, StatusBar } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useCallback, useState } from "react";
import deliveryAuthService, { DeliveryMan } from '../../utils/deliveryAuthService';
import { showAlert, showError } from '../../utils/alertService';

export default function DeliveryProfileScreen() {
    const [userData, setUserData] = useState<DeliveryMan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    let [fontsLoaded] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
    });
    const router = useRouter();

    const loadDeliveryProfile = async () => {
        try {
            console.log('=== Iniciando carregamento do perfil do entregador ===');
            setLoading(true);
            setError(null);
            
            // Buscar perfil do entregador no backend
            console.log('Chamando deliveryAuthService.getProfile()...');
            const profile = await deliveryAuthService.getProfile();
            console.log('Perfil carregado com sucesso:', profile);
            setUserData(profile);
        } catch (error) {
            console.error("Erro ao carregar perfil do entregador:", error);
            const errorMessage = error instanceof Error ? error.message : "Falha ao carregar o perfil do entregador";
            setError(errorMessage);
            
            // Se o erro for de autenticação, redirecionar para login
            if (errorMessage.includes('Token') || errorMessage.includes('autenticação')) {
                showError("Sessão Expirada", "Faça login novamente para continuar.");
                router.replace('/loginDelivery');
            } else {
                showError("Erro", errorMessage);
            }
        } finally {
            setLoading(false);
            console.log('=== Carregamento do perfil finalizado ===');
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDeliveryProfile();
            return () => {
                // Cleanup function
            };
        }, [])
    );

    const handleLogout = async () => {
        showAlert(
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
                            await deliveryAuthService.logout();
                            router.replace('/welcome2');
                        } catch (error) {
                            console.error("Erro ao fazer logout:", error);
                            showError("Erro", "Não foi possível fazer logout. Tente novamente.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleEditProfile = () => {
        router.push("/aboutDelivery");
    };

    const handleDeliveryHistory = () => {
        router.push("../deliveryHistory");
    };

    const handleEarnings = () => {
        router.push("/earnings");
    };

    const handleVehicleInfo = () => {
        router.push("/vehicleData");
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
                <Text style={styles.loadingText}>Carregando perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
                <Text style={styles.errorTitle}>Erro ao carregar perfil</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadDeliveryProfile}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
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
                        <TouchableOpacity style={styles.editImageButton} onPress={() => router.push("/aboutDelivery")}>
                            <Ionicons name="camera" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{userData?.name || "Entregador"}</Text>
                    <Text style={styles.userEmail}>{userData?.email || "entregador@email.com"}</Text>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadge, { backgroundColor: userData?.isActive ? '#32D74B' : '#FF3B30' }]}>
                            <Text style={styles.statusText}>
                                {userData?.isActive ? 'Ativo' : 'Inativo'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push("/aboutDelivery")}>
                        <Text style={styles.editProfileText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Entregas</Text>
                    
                    <TouchableOpacity onPress={handleDeliveryHistory}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="time-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Histórico de Entregas</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleEarnings}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="cash-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Meus Ganhos</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleVehicleInfo}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="car-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Dados do Veículo</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Conta</Text>
                    
                    <TouchableOpacity onPress={() => router.push("/aboutDelivery")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="person-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Dados Pessoais</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="settings-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Configurações</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="help-circle-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Ajuda e Suporte</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={styles.menuIcon} />
                        <Text style={styles.logoutText}>Sair da Conta</Text>
                    </TouchableOpacity>
                </View>
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
    statusContainer: {
        marginBottom: 15,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#FFFFFF",
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
    logoutSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: "#FFF0F0",
    },
    logoutText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#FF3B30",
        marginLeft: 10,
    },
    loadingText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 16,
        color: "#6CC51D",
        marginTop: 15,
        textAlign: "center",
    },
    errorTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 18,
        color: "#FF3B30",
        marginTop: 15,
        marginBottom: 10,
        textAlign: "center",
    },
    errorMessage: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "#777",
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: "#6CC51D",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    retryButtonText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#FFFFFF",
        textAlign: "center",
    },
});