import { useEffect, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, StyleSheet } from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Platform } from 'react-native';
import { getProfile } from "../utils/authServices"
import * as authUtils from "../utils/authServices"
import { showAlert, showSuccess, showError } from "../utils/alertService"

const API_BASE_URL = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_URL,
  ios: process.env.EXPO_PUBLIC_API_BASE_URL_IOS,
  default: process.env.EXPO_PUBLIC_API_BASE_URL,
});

export default function AboutMe() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const profile = await getProfile()
      setName(profile.name)
      setEmail(profile.email)
      setPhone(profile.phoneNumber || "")
      setUserId(profile.id)
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      showError("Erro", "Não foi possível carregar os dados do usuário")
    }
  }

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      showError("Erro", "Nome é obrigatório")
      return
    }

    if (!userId) {
      showError("Erro", "ID do usuário não encontrado")
      return
    }

    try {
      setIsLoading(true)
      await authUtils.updateProfile(userId, {
        name: name.trim(),
        phoneNumber: phone.trim() || undefined
      })
      showSuccess("Sucesso", "Perfil atualizado com sucesso!")
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error)
      showError("Erro", error.message || "Não foi possível atualizar o perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Erro", "Preencha todos os campos de senha")
      return
    }

    if (newPassword !== confirmPassword) {
      showError("Erro", "A nova senha e confirmação não coincidem")
      return
    }

    if (newPassword.length < 6) {
      showError("Erro", "A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    if (!userId) {
      showError("Erro", "ID do usuário não encontrado")
      return
    }

    try {
      setIsLoading(true)
      await authUtils.updatePassword(userId, {
        currentPassword,
        newPassword
      })
      showSuccess("Sucesso", "Senha atualizada com sucesso!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error)
      showError("Erro", error.message || "Não foi possível atualizar a senha")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Sobre Mim",
          headerShown: true,
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#333",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>O e-mail não pode ser alterado</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleUpdateProfile}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Atualizando..." : "Atualizar Perfil"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alterar Senha</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha Atual</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Digite sua senha atual"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nova Senha</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Digite a nova senha"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme a nova senha"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]} 
            onPress={handleUpdatePassword}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
              {isLoading ? "Atualizando..." : "Alterar Senha"}
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#333333",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#666666",
  },
  helperText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#6CC51D",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#6CC51D",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondaryText: {
    color: "#6CC51D",
  },
})
