import { useEffect, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, StyleSheet } from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { getProfile } from "../utils/authServices"
import * as authUtils from "../utils/authServices"
import { showAlert, showSuccess, showError } from "../utils/alertService"
import Config from 'react-native-config';


const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function AboutMe() {
  const router = useRouter()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const userProfile = await getProfile()
      if (userProfile && userProfile.id) {
        setUserId(userProfile.id)
        setFormData((prev) => ({
          ...prev,
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone || "",
        }))
      } else {
        showError("Erro", "Não foi possível obter os dados do usuário.")
        router.replace("/welcome2")
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      showError("Sessão expirada", "Por favor, faça login novamente.")
      router.replace("/welcome2")
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError("Erro", "O nome é obrigatório")
      return false
    }

    if (!formData.email.trim()) {
      showError("Erro", "O email é obrigatório")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError("Erro", "Formato de email inválido")
      return false
    }

    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        showError("Erro", "A senha atual é obrigatória para alterar a senha")
        return false
      }

      if (!formData.newPassword) {
        showError("Erro", "A nova senha é obrigatória")
        return false
      }

      if (formData.newPassword !== formData.confirmPassword) {
        showError("Erro", "As senhas não coincidem")
        return false
      }

      if (formData.newPassword.length < 6) {
        showError("Erro", "A nova senha deve ter pelo menos 6 caracteres")
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm() || !userId) return

    try {
      setLoading(true)
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }

      // Obter o token JWT
      const token = await authUtils.getToken()
      if (!token) {
        throw new Error("Usuário não autenticado")
      }

      // Atualizar dados do perfil
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao salvar dados")
      }

      // Atualizar senha se necessário
      if (formData.currentPassword && formData.newPassword) {
        const passwordData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }
        
        const passwordResponse = await fetch(`${API_URL}/users/${userId}/password`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(passwordData),
        })
        
        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json()
          throw new Error(errorData.message || "Erro ao atualizar senha")
        }
      }

      showSuccess("Sucesso", "Dados atualizados com sucesso!")
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
      router.back()
    } catch (error: any) {
      showError("Erro", error.message || "Ocorreu um erro ao salvar os dados")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerTitle: "Sobre mim",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerShadowVisible: false,
          headerTintColor: "#000000",
          headerTitleStyle: {
            fontWeight: "500",
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes pessoais</Text>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Nome completo"
              placeholderTextColor="#868889"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Email"
              placeholderTextColor="#868889"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              placeholder="Telefone"
              placeholderTextColor="#868889"
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alterar a senha</Text>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.currentPassword}
              onChangeText={(text) => handleChange("currentPassword", text)}
              placeholder="Senha atual"
              placeholderTextColor="#868889"
              secureTextEntry={!showCurrentPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword((prev) => !prev)}
            >
              <Ionicons
                name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#868889"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.newPassword}
              onChangeText={(text) => handleChange("newPassword", text)}
              placeholder="Nova senha"
              placeholderTextColor="#868889"
              secureTextEntry={!showNewPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword((prev) => !prev)}
            >
              <Ionicons
                name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#868889"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              placeholder="Confirmar senha"
              placeholderTextColor="#868889"
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#868889"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? "Salvando..." : "Salvar"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f5f9",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 12,
    height: 56,
    position: "relative",
  },
  iconContainer: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#000000",
  },
  eyeIcon: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: "#6cc51d",
    borderRadius: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: "#a9d77c",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
