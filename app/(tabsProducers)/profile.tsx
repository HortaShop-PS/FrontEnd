import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { useCallback, useState, useEffect } from "react";
import { getProfile, logout } from "../../utils/authServices";
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { showAlert, showError, showSuccess } from '../../utils/alertService';
import { notificationService } from '../../utils/notificationService';
import { API_BASE_URL } from '../../utils/config';
import producerProfileService, { ProfileStatus } from '../../utils/producerProfileService';

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
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
    const [checkingProfile, setCheckingProfile] = useState(false);
    
    let [fontsLoaded] = useFonts({
        Poppins_600SemiBold,
        Poppins_400Regular,
        Poppins_700Bold,
        Poppins_500Medium,
    });
    const router = useRouter();

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            
            const userType = await SecureStore.getItemAsync('userType');
            if (userType !== 'producer') {
                console.error('Usuário não é produtor, redirecionando...');
                router.replace('/(tabs)');
                return;
            }
            
            const data = await getProfile();
            console.log('Dados do perfil recebidos:', data);
            setUserData({
                id: data.id.toString(),
                name: data.name,
                email: data.email,
                profileImage: data.profileImage,
            });
            
            if (data.profileImage) {
                const fullImageUrl = data.profileImage.startsWith('http') 
                    ? data.profileImage 
                    : `${API_BASE_URL}${data.profileImage}`;
                setProfileImage(fullImageUrl);
            }
            
            setError(null);
        } catch (error) {
            console.error("Erro no componente de perfil:", error);
            setError('Não foi possível carregar os dados do perfil');
        } finally {
            setLoading(false);
        }
    };

    const checkProfileStatus = async () => {
        try {
            setCheckingProfile(true);
            const status = await producerProfileService.getProfileStatus();
            setProfileStatus(status);
        } catch (error) {
            console.error('Erro ao verificar status do perfil:', error);
            // Não impede o carregamento da tela em caso de erro
        } finally {
            setCheckingProfile(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
            checkProfileStatus();
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
                            // Limpar token de notificação antes do logout
                            try {
                                console.log("Limpando token de notificação...");
                                await notificationService.clearToken();
                                console.log("Token de notificação limpo com sucesso");
                            } catch (notificationError) {
                                console.error("Erro ao limpar token de notificação:", notificationError);
                                // Não impedir o logout se houver erro com notificações
                            }
                            
                            await logout();
                            router.replace('/welcome2');
                        } catch (error) {
                            console.error("Erro ao fazer logout:", error);
                            showError("Erro", "Não foi possível fazer logout. Tente novamente.");
                        }
                    }
                }
            ]
        );
    };

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão necessária',
                'É necessário permitir o acesso à galeria para selecionar uma foto.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    const selectImageFromGallery = async () => {
        try {
            const hasPermission = await requestPermissions();
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                await uploadProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Erro ao abrir galeria:', error);
            Alert.alert('Erro', 'Não foi possível acessar a galeria');
        }
    };

    const uploadProfileImage = async (imageUri: string) => {
        try {
            setUploadingImage(true);
            
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }
            
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('file', {
                uri: imageUri,
                name: filename,
                type,
            } as any);

            const uploadUrl = `${API_BASE_URL}/upload/profile-image`;
            
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text().catch(() => '');
                let errorMessage = `Erro HTTP ${uploadResponse.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            const uploadResult = await uploadResponse.json();
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Erro ao processar upload');
            }
            
            const fullImageUrl = uploadResult.imageUrl.startsWith('http') 
                ? uploadResult.imageUrl 
                : `${API_BASE_URL}${uploadResult.imageUrl}`;
                
            setProfileImage(fullImageUrl);
            
            if (userData) {
                setUserData({
                    ...userData,
                    profileImage: uploadResult.imageUrl
                });
            }

            showSuccess('Sucesso', 'Foto de perfil atualizada com sucesso!');
            
        } catch (error: any) {
            console.error('Erro ao fazer upload:', error);
            showError('Erro no Upload', error.message || 'Não foi possível fazer upload da imagem. Tente novamente.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCompleteProfile = () => {
        router.push('/complete-profile');
    };

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6CC51D" />
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6CC51D" />
                <Text style={styles.loadingText}>Carregando perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                </View>
                <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    
                    {/* Profile Card Principal */}
                    <View style={styles.profileMainCard}>
                        <View style={styles.profileImageSection}>
                            <TouchableOpacity 
                                style={styles.imageContainer}
                                onPress={selectImageFromGallery}
                                disabled={uploadingImage}
                            >
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.defaultImageContainer}>
                                        <Ionicons name="person" size={40} color="#6CC51D" />
                                    </View>
                                )}
                                
                                <View style={styles.editImageOverlay}>
                                    {uploadingImage ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Informações do usuário */}
                        <View style={styles.profileDetails}>
                            <Text style={styles.profileName}>{userData?.name || "Produtor"}</Text>
                            <Text style={styles.profileEmail}>{userData?.email || "produtor@email.com"}</Text>
                            
                            {/* Profile Completion Status */}
                            {profileStatus && (
                                <View style={styles.profileStatusContainer}>
                                    {profileStatus.isComplete ? (
                                        <View style={styles.completedStatus}>
                                            <Ionicons name="checkmark-circle" size={16} color="#6CC51D" />
                                            <Text style={styles.completedStatusText}>Perfil Completo</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.incompleteStatus}>
                                            <Ionicons name="alert-circle" size={16} color="#F39C12" />
                                            <Text style={styles.incompleteStatusText}>
                                                Perfil {profileStatus.completionPercentage}% completo
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Profile Completion Banner */}
                    {profileStatus && !profileStatus.isComplete && (
                        <TouchableOpacity style={styles.profileCompletionBanner} onPress={handleCompleteProfile}>
                            <View style={styles.bannerLeft}>
                                <View style={styles.bannerIcon}>
                                    <Ionicons name="person-add" size={20} color="#6CC51D" />
                                </View>
                                <View style={styles.bannerContent}>
                                    <Text style={styles.bannerTitle}>Complete seu perfil</Text>
                                    <Text style={styles.bannerSubtitle}>
                                        Adicione suas informações para começar a vender
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#6CC51D" />
                        </TouchableOpacity>
                    )}

                    {/* Menu Sections */}
                    <View style={styles.menuSections}>
                        
                        {/* Conta Section */}
                        <View style={styles.menuSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconContainer}>
                                    <Ionicons name="person-circle-outline" size={20} color="#6CC51D" />
                                </View>
                                <Text style={styles.sectionTitle}>Minha Conta</Text>
                            </View>
                            
                            <View style={styles.menuItems}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/about")}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name="person-outline" size={20} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Sobre Mim</Text>
                                            <Text style={styles.menuItemSubtitle}>Gerencie suas informações pessoais</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={handleCompleteProfile}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name="document-text-outline" size={20} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Completar Perfil</Text>
                                            <Text style={styles.menuItemSubtitle}>
                                                {profileStatus?.isComplete 
                                                    ? "Ver informações do perfil comercial" 
                                                    : "Complete suas informações comerciais"
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.menuItemRight}>
                                        {!profileStatus?.isComplete && (
                                            <View style={styles.incompleteBadge}>
                                                <Text style={styles.incompleteBadgeText}>
                                                    {profileStatus?.completionPercentage || 0}%
                                                </Text>
                                            </View>
                                        )}
                                        <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Negócio & Produtos Section */}
                        <View style={styles.menuSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconContainer}>
                                    <Ionicons name="storefront-outline" size={20} color="#6CC51D" />
                                </View>
                                <Text style={styles.sectionTitle}>Meu Negócio</Text>
                            </View>
                            
                            <View style={styles.menuItems}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/registerProduct')}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name="add-circle-outline" size={20} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Registrar Produto</Text>
                                            <Text style={styles.menuItemSubtitle}>Adicione novos produtos para venda</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/manageProducts')}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name="grid-outline" size={20} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Gerenciar Produtos</Text>
                                            <Text style={styles.menuItemSubtitle}>Edite e organize seus produtos</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/producerOrderHistory')}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name="time-outline" size={20} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Pedidos Recebidos</Text>
                                            <Text style={styles.menuItemSubtitle}>Gerencie os pedidos dos seus produtos</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <View style={styles.logoutContent}>
                            <View style={styles.logoutIconContainer}>
                                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                            </View>
                            <Text style={styles.logoutText}>Sair da Conta</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FF6B6B" />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#6CC51D",
    },
    
    // Main Container
    mainContainer: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    container: {
        flex: 1,
        paddingTop: 20,
        paddingBottom: 30,
    },
    
    // Loading & Error States
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
    },
    loadingText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "#6C757D",
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#F8F9FA",
    },
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FFEBEE",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    errorTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 18,
        color: "#FF6B6B",
        marginBottom: 8,
        textAlign: "center",
    },
    errorMessage: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "#6C757D",
        textAlign: "center",
        marginBottom: 24,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: "#6CC51D",
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    retryButtonText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 14,
        color: "#FFFFFF",
        textAlign: "center",
    },
    
    // Profile Main Card
    profileMainCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 24,
        alignItems: "center",
    },
    profileImageSection: {
        position: "relative",
        marginBottom: 20,
    },
    imageContainer: {
        position: "relative",
        width: 100,
        height: 100,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 4,
        borderColor: "#E8F5E8",
    },
    profileImage: {
        width: "100%",
        height: "100%",
    },
    defaultImageContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#E8F5E8",
        justifyContent: "center",
        alignItems: "center",
    },
    editImageOverlay: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#6CC51D",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FFFFFF",
    },
    profileDetails: {
        alignItems: "center",
        width: "100%",
    },
    profileName: {
        fontFamily: "Poppins_700Bold",
        fontSize: 22,
        color: "#2C3E50",
        marginBottom: 4,
        textAlign: "center",
    },
    profileEmail: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "#6C757D",
        marginBottom: 12,
        textAlign: "center",
    },
    
    // Profile Status
    profileStatusContainer: {
        marginTop: 8,
    },
    completedStatus: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F5E8",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    completedStatusText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#6CC51D",
        marginLeft: 6,
    },
    incompleteStatus: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    incompleteStatusText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#F39C12",
        marginLeft: 6,
    },
    
    // Profile Completion Banner
    profileCompletionBanner: {
        backgroundColor: "#E8F5E8",
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#6CC51D",
    },
    bannerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 15,
        color: "#2C3E50",
        marginBottom: 2,
    },
    bannerSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6C757D",
    },
    
    // Menu Sections
    menuSections: {
        paddingHorizontal: 20,
        gap: 16,
    },
    menuSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#E8F5E8",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    sectionTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 16,
        color: "#2C3E50",
    },
    menuItems: {
        gap: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    menuItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F8F9FA",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    menuItemContent: {
        flex: 1,
    },
    menuItemTitle: {
        fontFamily: "Poppins_500Medium",
        fontSize: 15,
        color: "#2C3E50",
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6C757D",
    },
    menuItemRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    incompleteBadge: {
        backgroundColor: "#F39C12",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    incompleteBadgeText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10,
        color: "#FFFFFF",
    },
    
    // Logout Button
    logoutButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginHorizontal: 20,
        marginTop: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: "#FFEBEE",
    },
    logoutContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoutIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFEBEE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    logoutText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 15,
        color: "#FF6B6B",
        flex: 1,
    },
});