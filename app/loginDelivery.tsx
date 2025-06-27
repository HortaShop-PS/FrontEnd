import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, ImageBackground, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import deliveryAuthService from '../utils/deliveryAuthService';
import { showError, showSuccess } from '../utils/alertService';

export default function LoginDelivery() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible)
  }

  const validateForm = () => {
    if (!email.trim()) {
      showError("Erro", "O email é obrigatório")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showError("Erro", "Formato de email inválido")
      return false
    }

    if (!password) {
      showError("Erro", "A senha é obrigatória")
      return false
    }

    return true
  }

  const handleLogin = async () => {
    console.log("Tentando fazer login como entregador...")

    if (!validateForm()) return

    try {
      setLoading(true)

      const loginData = {
        email: email.trim(),
        password,
      }

      console.log("Enviando dados de login:", { email: loginData.email })

      await deliveryAuthService.login(loginData)

      console.log("Login de entregador bem-sucedido")

      showSuccess("Sucesso", "Login realizado com sucesso!", [
        { text: "OK", onPress: () => router.push("/deliveryDashboard") },
      ])
    } catch (error: any) {
      console.error("Erro ao fazer login:", error)

      let errorMessage = "Ocorreu um erro ao fazer login. Tente novamente."

      if (error.message) {
        errorMessage = error.message
      }

      showError("Erro", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToRegister = () => {
    router.push("/registerDelivery")
  }

  const handleGoToClientLogin = () => {
    router.push("/login")
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/images/registro_entregador.png")}
        style={styles.imageBackground}
        resizeMode="cover"
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.bottomContainer}>
          <Text style={styles.title}>Login Entregador</Text>
          <Text style={styles.subtitle}>Entre com sua conta de entregador</Text>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Endereço de E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#A0A0A0"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              placeholderTextColor="#A0A0A0"
              editable={!loading}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} disabled={loading}>
              <Ionicons
                name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#A0A0A0"
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar como Entregador</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={handleGoToRegister} disabled={loading}>
              <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Criar conta de entregador</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>Não é entregador? </Text>
            <TouchableOpacity onPress={handleGoToClientLogin} disabled={loading}>
              <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Login de cliente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
    left: 20,
    padding: 5,
    zIndex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24, 
    color: '#333',
    marginBottom: 4, 
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, 
    color: '#666',
    marginBottom: 16, 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 12, 
    paddingHorizontal: 15,
    height: 48, 
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#7ABC00',
    paddingVertical: 12, 
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    marginTop: 8, 
    marginBottom: 12, 
  },
  buttonDisabled: {
    backgroundColor: '#AED581',
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: "#fff",
    fontSize: 16,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6, 
  },
  footerLinkText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13, 
    color: '#666',
  },
  footerLinkAction: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
})