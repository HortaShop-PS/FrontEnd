import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
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
            
            // Carregar imagem de perfil se existir
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

    // ✅ Função auxiliar para testar conectividade sem depender do apiConfig
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
            
            // ✅ Usar conectividade básica como fallback
            let connectivityTest;
            try {
                // Tentar usar apiConfig primeiro
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
            
            // Testar endpoint de upload (opcional)
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
            
            // Obter token de autenticação
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }
            console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
            
            // Criar FormData para upload
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

            // ✅ Upload com retry e timeout
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
                    }, 30000); // 30 segundos
                    
                    uploadResponse = await fetch(uploadUrl, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    });
                    
                    clearTimeout(timeoutId);
                    break; // Sucesso
                    
                } catch (fetchError: any) {
                    console.error(`❌ Erro na tentativa ${attempts}:`, fetchError.message);
                    
                    if (attempts === maxAttempts) {
                        throw fetchError;
                    }
                    
                    // Aguardar antes da próxima tentativa
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
                    // Se não conseguir parsear JSON, usar texto da resposta
                    if (errorText) errorMessage = errorText;
                }
                
                throw new Error(errorMessage);
            }

            const uploadResult = await uploadResponse!.json();
            console.log('📋 Resultado do upload:', uploadResult);
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Erro ao processar upload');
            }
            
            // ✅ Atualizar estado local
            const fullImageUrl = uploadResult.imageUrl.startsWith('http') 
                ? uploadResult.imageUrl 
                : `${API_BASE_URL}${uploadResult.imageUrl}`;
                
            console.log('🖼️ URL da imagem final:', fullImageUrl);
            setProfileImage(fullImageUrl);
            
            // Atualizar dados do usuário
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
            
            // Tratamento específico de erros
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
                <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
                <Text style={styles.errorTitle}>Erro ao carregar perfil</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meu Perfil</Text>
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity 
                            style={styles.containerCircle}
                            onPress={selectImageFromGallery}
                            disabled={uploadingImage}
                        >
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />
                            ) : (
                                <Ionicons name="person" size={50} color="#6CC51D" />
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.editImageButton} 
                            onPress={selectImageFromGallery}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="camera" size={18} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.userName}>{userData?.name || "Usuário"}</Text>
                    <Text style={styles.userEmail}>{userData?.email || "usuario@email.com"}</Text>
                    <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push("/about")}>
                        <Text style={styles.editProfileText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Section - Conta */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Conta</Text>
                    
                    <TouchableOpacity onPress={() => router.push("/about")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="person-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Sobre Mim</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/addresses")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="location-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Meus Endereços</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/profile/orderHistory")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="bag-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Meus Pedidos</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/favorites")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="heart-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Favoritos</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/cards")}>
                        <View style={styles.menuItemRow}>
                            <Ionicons name="card-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                            <Text style={styles.menuItemText}>Cartões de Pagamento</Text>
                            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    loadingText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 16,
        color: "#6CC51D",
        marginTop: 15,
        textAlign: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#F0F8FF",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#6CC51D",
        overflow: "hidden",
    },
    profileImage: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
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
});