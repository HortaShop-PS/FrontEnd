import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold, Poppins_500Medium } from '@expo-google-fonts/poppins';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { getProfile } from '../../utils/authServices';
import { logout } from '../../utils/authServices';
import { API_BASE_URL, apiConfig } from '../../utils/config';

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

            const data = await getProfile();
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
            console.error('Erro ao carregar perfil do usuário:', error);
            setError('Não foi possível carregar os dados do perfil');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/welcome2');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            Alert.alert('Erro', 'Não foi possível fazer logout');
        }
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

    const testBasicConnectivity = async (): Promise<{ isConnected: boolean; error?: string }> => {
        try {
            console.log('🔗 Testando conectividade básica...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('✅ Conectividade OK');
                return { isConnected: true };
            } else {
                console.log('❌ Servidor respondeu com erro:', response.status);
                return { isConnected: false, error: `HTTP ${response.status}` };
            }
        } catch (error: any) {
            console.error('❌ Erro de conectividade:', error);
            if (error.name === 'AbortError') {
                return { isConnected: false, error: 'Timeout' };
            }
            return { isConnected: false, error: error.message };
        }
    };

    const uploadProfileImage = async (imageUri: string) => {
        try {
            setUploadingImage(true);
            
            console.log('🔍 Iniciando upload da imagem de perfil...');
            console.log('📍 URI da imagem:', imageUri);
            console.log('🌐 API Base URL:', API_BASE_URL);
            
            let connectivityTest;
            try {
                if (typeof apiConfig !== 'undefined' && apiConfig.testConnectivity) {
                    console.log('🔗 Testando conectividade com apiConfig...');
                    connectivityTest = await apiConfig.testConnectivity();
                } else {
                    throw new Error('apiConfig não disponível');
                }
            } catch (configError) {
                console.log('⚠️ apiConfig não disponível, usando teste básico...');
                connectivityTest = await testBasicConnectivity();
            }
            
            if (!connectivityTest.isConnected) {
                throw new Error(`Erro de conectividade: ${connectivityTest.error}`);
            }
            
            console.log('✅ Conectividade confirmada');
            
            try {
                if (typeof apiConfig !== 'undefined' && apiConfig.testUploadEndpoint) {
                    console.log('🔗 Testando endpoint de upload...');
                    const uploadTest = await apiConfig.testUploadEndpoint();
                    if (!uploadTest.isAvailable) {
                        console.warn('⚠️ Endpoint de upload pode estar indisponível:', uploadTest.error);
                    } else {
                        console.log('✅ Endpoint de upload confirmado');
                    }
                }
            } catch (endpointError) {
                console.log('⚠️ Não foi possível testar endpoint de upload, continuando...');
            }
            
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }
            console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
            
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            console.log('📄 Detalhes do arquivo:', { filename, type });

            formData.append('file', {
                uri: imageUri,
                name: filename,
                type,
            } as any);

            const uploadUrl = `${API_BASE_URL}/upload/profile-image`;
            console.log('🚀 URL de upload:', uploadUrl);

            let uploadResponse: Response;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                attempts++;
                console.log(`🔄 Tentativa ${attempts}/${maxAttempts}`);
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => {
                        console.log('⏰ Timeout atingido, cancelando requisição...');
                        controller.abort();
                    }, 30000);
                    
                    uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    });
                    
                    clearTimeout(timeoutId);
                    break;
                    
                } catch (fetchError: any) {
                    console.error(`❌ Erro na tentativa ${attempts}:`, fetchError.message);
                    
                    if (attempts === maxAttempts) {
                        throw fetchError;
                    }
                    
                    console.log(`⏳ Aguardando ${2 * attempts}s antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
                }
            }

            console.log('📊 Status da resposta:', uploadResponse!.status);
            console.log('✅ Resposta OK:', uploadResponse!.ok);

            if (!uploadResponse!.ok) {
                const errorText = await uploadResponse!.text().catch(() => '');
                console.error('❌ Erro na resposta:', errorText);
                
                let errorMessage = `Erro HTTP ${uploadResponse!.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    if (errorText) errorMessage = errorText;
                }
                
                throw new Error(errorMessage);
            }

            const uploadResult = await uploadResponse!.json();
            console.log('📋 Resultado do upload:', uploadResult);
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Erro ao processar upload');
            }
            
            const fullImageUrl = uploadResult.imageUrl.startsWith('http') 
                ? uploadResult.imageUrl 
                : `${API_BASE_URL}${uploadResult.imageUrl}`;
                
            console.log('🖼️ URL da imagem final:', fullImageUrl);
            setProfileImage(fullImageUrl);
            
            if (userData) {
                setUserData({
                    ...userData,
                    profileImage: uploadResult.imageUrl
                });
            }

            Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
            
        } catch (error: any) {
            console.error('❌ Erro detalhado ao fazer upload:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            
            if (error.name === 'AbortError') {
                Alert.alert(
                    'Tempo Esgotado', 
                    'O upload demorou mais que o esperado. Verifique sua conexão e tente novamente.',
                    [
                        { text: 'OK' },
                        { 
                            text: 'Tentar Novamente', 
                            onPress: () => uploadProfileImage(imageUri) 
                        }
                    ]
                );
            } else if (error.message.includes('conectividade') || error.message.includes('Network request failed')) {
                Alert.alert(
                    'Erro de Conexão', 
                    'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
                    [
                        { text: 'OK' },
                        { 
                            text: 'Tentar Novamente', 
                            onPress: () => uploadProfileImage(imageUri) 
                        }
                    ]
                );
            } else if (error.message.includes('Token de autenticação')) {
                Alert.alert(
                    'Sessão Expirada', 
                    'Sua sessão expirou. Faça login novamente.',
                    [
                        { text: 'OK', onPress: () => handleLogout() }
                    ]
                );
            } else {
                Alert.alert(
                    'Erro no Upload', 
                    error.message || 'Não foi possível fazer upload da imagem. Tente novamente.',
                    [
                        { text: 'OK' },
                        { 
                            text: 'Tentar Novamente', 
                            onPress: () => uploadProfileImage(imageUri) 
                        }
                    ]
                );
            }
        } finally {
            setUploadingImage(false);
        }
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
                            <Text style={styles.profileName}>{userData?.name || "Usuário"}</Text>
                            <Text style={styles.profileEmail}>{userData?.email || "usuario@email.com"}</Text>
                        </View>
                    </View>

                   

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
                                        <View style={[styles.menuItemIcon, { backgroundColor: '#E8F8F5' }]}>
                                            <Ionicons name="person-outline" size={18} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Informações Pessoais</Text>
                                            <Text style={styles.menuItemSubtitle}>Edite seus dados pessoais</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/addresses")}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.menuItemIcon, { backgroundColor: '#E8F8F5' }]}>
                                            <Ionicons name="location-outline" size={18} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Endereços</Text>
                                            <Text style={styles.menuItemSubtitle}>Gerencie seus endereços</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Pedidos & Pagamentos Section */}
                        <View style={styles.menuSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconContainer}>
                                    <Ionicons name="card-outline" size={20} color="#6CC51D" />
                                </View>
                                <Text style={styles.sectionTitle}>Pedidos & Pagamentos</Text>
                            </View>
                            
                            <View style={styles.menuItems}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/orderHistory")}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.menuItemIcon, { backgroundColor: '#E8F8F5' }]}>
                                            <Ionicons name="bag-outline" size={18} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Histórico de Pedidos</Text>
                                            <Text style={styles.menuItemSubtitle}>Veja todos os seus pedidos</Text>
                                        </View>
                                    </View>
                                    <View style={styles.menuItemRight}>
                    
                                        <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/cards")}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.menuItemIcon, { backgroundColor: '#E8F8F5' }]}>
                                            <Ionicons name="card-outline" size={18} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Cartões de Pagamento</Text>
                                            <Text style={styles.menuItemSubtitle}>Gerencie seus cartões</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Preferências Section */}
                        <View style={styles.menuSection}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionIconContainer}>
                                    <Ionicons name="heart-outline" size={20} color="#6CC51D" />
                                </View>
                                <Text style={styles.sectionTitle}>Preferências</Text>
                            </View>
                            
                            <View style={styles.menuItems}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/favorites")}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.menuItemIcon, { backgroundColor: '#E8F8F5' }]}>
                                            <Ionicons name="heart-outline" size={18} color="#6CC51D" />
                                        </View>
                                        <View style={styles.menuItemContent}>
                                            <Text style={styles.menuItemTitle}>Lista de Favoritos</Text>
                                            <Text style={styles.menuItemSubtitle}>Seus produtos favoritos</Text>
                                        </View>
                                    </View>
                                    <View style={styles.menuItemRight}>
                    
                                        <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                                    </View>
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
    
    // Header com gradiente
    headerGradient: {
        backgroundColor: "#6CC51D",
        paddingBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerContent: {
        flex: 1,
    },
    headerGreeting: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
        marginBottom: 4,
    },
    headerTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 24,
        color: "#FFFFFF",
        marginBottom: 2,
    },
    headerSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
    },
    notificationButton: {
        position: "relative",
        padding: 8,
    },
    notificationBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FF6B6B",
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
        borderRadius: 10,
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
    profileBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 2,
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
        marginBottom: 20,
        textAlign: "center",
    },
    profileStats: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        borderRadius: 15,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: "100%",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        fontFamily: "Poppins_700Bold",
        fontSize: 18,
        color: "#6CC51D",
        marginBottom: 2,
    },
    statLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6C757D",
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#E9ECEF",
        marginHorizontal: 16,
    },
    
    // Quick Actions
    quickActionsContainer: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    quickActionsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    quickActionItem: {
        alignItems: "center",
        flex: 1,
        marginHorizontal: 4,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    quickActionText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#2C3E50",
        textAlign: "center",
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
        gap: 8,
    },
    badge: {
        backgroundColor: "#6CC51D",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: "center",
    },
    badgeText: {
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