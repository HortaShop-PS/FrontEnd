import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Alert 
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_600SemiBold, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { showError, showSuccess } from "../utils/alertService";
import { getProfile } from "../utils/authServices";
import * as authUtils from "../utils/authServices";

export default function AboutMe() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular,
    Poppins_700Bold,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await getProfile();
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phoneNumber || "");
      setUserId(profile.id);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      showError("Erro", "Não foi possível carregar os dados do usuário");
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      showError("Erro", "Nome é obrigatório");
      return;
    }

    if (!userId) {
      showError("Erro", "ID do usuário não encontrado");
      return;
    }

    try {
      setIsLoading(true);
      await authUtils.updateProfile(userId, {
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
      });
      showSuccess("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      showError("Erro", error.message || "Não foi possível atualizar o perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Erro", "Preencha todos os campos de senha");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Erro", "As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      showError("Erro", "A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setIsPasswordLoading(true);
      await authUtils.updatePassword(currentPassword, newPassword);
      showSuccess("Sucesso", "Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error);
      showError("Erro", error.message || "Não foi possível alterar a senha");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6CC51D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Header seguindo padrão do design system */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerGreeting}>Editar</Text>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>
      </View>

      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          {/* Informações Pessoais Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="person-outline" size={20} color="#6CC51D" />
              </View>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#BDC3C7"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={18} color="#BDC3C7" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: "#BDC3C7" }]}
                  value={email}
                  editable={false}
                  placeholder="seu@email.com"
                  placeholderTextColor="#BDC3C7"
                />
                <Ionicons name="lock-closed-outline" size={16} color="#BDC3C7" />
              </View>
              <Text style={styles.helperText}>O e-mail não pode ser alterado</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#BDC3C7"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, isLoading && styles.buttonDisabled]} 
              onPress={handleUpdateProfile}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.updateButtonText}>Atualizar Perfil</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Alterar Senha Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6CC51D" />
              </View>
              <Text style={styles.sectionTitle}>Alterar Senha</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha Atual</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={18} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor="#BDC3C7"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={18} 
                    color="#7F8C8D" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Digite a nova senha"
                  placeholderTextColor="#BDC3C7"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons 
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                    size={18} 
                    color="#7F8C8D" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme a nova senha"
                  placeholderTextColor="#BDC3C7"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={18} 
                    color="#7F8C8D" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.updateButton, styles.passwordButton, isPasswordLoading && styles.buttonDisabled]} 
              onPress={handleUpdatePassword}
              disabled={isPasswordLoading}
              activeOpacity={0.8}
            >
              {isPasswordLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.updateButtonText}>Alterar Senha</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#6CC51D" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Segurança da Conta</Text>
              <Text style={styles.infoText}>
                Mantenha seus dados sempre atualizados e use uma senha forte para proteger sua conta.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  
  // Header seguindo padrão estabelecido
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#FAFAFA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  headerContent: {
    flex: 1,
  },
  headerGreeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#2C3E50",
  },

  mainContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Section Cards seguindo padrão do design system
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#2C3E50",
  },

  // Input fields with flat design
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#2C3E50",
  },
  inputDisabled: {
    backgroundColor: "#F5F6FA",
    borderColor: "#E9ECEF",
  },
  helperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 6,
    marginLeft: 4,
  },

  // Buttons seguindo padrão flat
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6CC51D",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  passwordButton: {
    backgroundColor: "#6CC51D",
  },
  updateButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F4FDF0",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8F8E8",
    marginBottom: 10,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F8E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#2C3E50",
    marginBottom: 4,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#7F8C8D",
    lineHeight: 18,
  },
});