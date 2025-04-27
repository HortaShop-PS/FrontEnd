import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, Dimensions, ImageBackground,} from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter, Stack } from "expo-router"
import axios from "axios"

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible)
  }

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Erro", "O nome é obrigatório")
      return false
    }

    if (!email.trim()) {
      Alert.alert("Erro", "O email é obrigatório")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Formato de email inválido")
      return false
    }

    if (!password) {
      Alert.alert("Erro", "A senha é obrigatória")
      return false
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    console.log("Tentando criar conta...")

    if (!validateForm()) return

    try {
      setLoading(true)

      const userData = {
        name,
        email,
        password,
        phoneNumber: phone,
      }

      console.log("Enviando dados para registro:", userData)

      const response = await axios.post(`${API_URL}/auth/register`, userData)

      console.log("Resposta do servidor:", response.data)

      Alert.alert("Sucesso", "Conta criada com sucesso! Faça login para continuar.", [
        { text: "OK", onPress: () => router.push("/login") },
      ])
    } catch (error) {
      console.error("Erro ao registrar:", error)

      let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente."

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage
      }

      Alert.alert("Erro", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push("/login")
  }

  const handleGoToSellerRegister = () => {
    console.log("Ir para criar conta de vendedor")
    Alert.alert("Em breve", "Registro de vendedor em desenvolvimento")
  }

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, "")

    let formatted = cleaned
    if (cleaned.length > 0) {
      formatted = `(${cleaned.substring(0, 2)}`
      if (cleaned.length > 2) {
        formatted += `) ${cleaned.substring(2, 7)}`
        if (cleaned.length > 7) {
          formatted += `-${cleaned.substring(7, 11)}`
        }
      }
    }

    return formatted
  }

  const handlePhoneChange = (text) => {
    setPhone(formatPhoneNumber(text))
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/images/grocery-shopping.png")}
        style={styles.imageBackground}
        resizeMode="cover"
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Crie sua conta e comece a comprar</Text>

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="account-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#A0A0A0"
            editable={!loading}
          />
        </View>

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
          <MaterialCommunityIcons name="phone-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Número de telefone"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Criar Conta</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerLinkText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={handleGoToLogin} disabled={loading}>
            <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Entrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerLinkText}>É produtor? </Text>
          <TouchableOpacity onPress={handleGoToSellerRegister} disabled={loading}>
            <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Criar conta de vendedor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '65%', 
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
