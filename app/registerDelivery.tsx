import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, ImageBackground, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import deliveryAuthService, { RegisterDeliveryData } from '../utils/deliveryAuthService';
import { showError, showSuccess } from '../utils/alertService';

export default function RegisterDelivery() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cpf, setCpf] = useState("")
  const [cnhNumber, setCnhNumber] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible)
  }

  const validateForm = () => {
    if (!name.trim()) {
      showError("Erro", "O nome é obrigatório")
      return false
    }

    if (!email.trim()) {
      showError("Erro", "O email é obrigatório")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showError("Erro", "Formato de email inválido")
      return false
    }

    if (!phone.trim()) {
      showError("Erro", "O telefone é obrigatório")
      return false
    }

    if (!cpf.trim()) {
      showError("Erro", "O CPF é obrigatório")
      return false
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      showError("Erro", "CPF deve ter 11 dígitos")
      return false
    }

    if (!cnhNumber.trim()) {
      showError("Erro", "O número da CNH é obrigatório")
      return false
    }

    if (!password) {
      showError("Erro", "A senha é obrigatória")
      return false
    }

    if (password.length < 6) {
      showError("Erro", "A senha deve ter pelo menos 6 caracteres")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    console.log("Tentando criar conta de entregador...")

    if (!validateForm()) return

    try {
      setLoading(true)

      const deliveryData: RegisterDeliveryData = {
        name,
        email,
        password,
        phone: phone.replace(/\D/g, ''),
        cpf: cpf.replace(/\D/g, ''),
        cnhNumber,
      }

      console.log("Enviando dados para registro:", deliveryData)

      await deliveryAuthService.register(deliveryData)

      console.log("Entregador registrado com sucesso")

      showSuccess("Sucesso", "Conta de entregador criada com sucesso! Faça login para continuar.", [
        { text: "OK", onPress: () => router.push("/loginDelivery") },
      ])
    } catch (error: any) {
      console.error("Erro ao registrar entregador:", error)

      let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente."

      if (error.message) {
        errorMessage = error.message
      }

      showError("Erro", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push("/loginDelivery")
  }

  const handleGoToRegister = () => {
    router.push("/register")
  }

  const formatPhoneNumber = (text: string) => {
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

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text))
  }

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, "")
    
    let formatted = cleaned
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 3)
      if (cleaned.length > 3) {
        formatted += `.${cleaned.substring(3, 6)}`
        if (cleaned.length > 6) {
          formatted += `.${cleaned.substring(6, 9)}`
          if (cleaned.length > 9) {
            formatted += `-${cleaned.substring(9, 11)}`
          }
        }
      }
    }

    return formatted
  }

  const handleCpfChange = (text: string) => {
    setCpf(formatCPF(text))
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
          <Text style={styles.title}>Cadastro Entregador</Text>
          <Text style={styles.subtitle}>Crie sua conta e comece a fazer entregas</Text>

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
            <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="CPF"
              value={cpf}
              onChangeText={handleCpfChange}
              keyboardType="numeric"
              placeholderTextColor="#A0A0A0"
              editable={!loading}
              maxLength={14}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="card-text-outline" size={22} color="#A0A0A0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Número da CNH"
              value={cnhNumber}
              onChangeText={setCnhNumber}
              keyboardType="numeric"
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
              <Text style={styles.buttonText}>Criar Conta de Entregador</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={handleGoToLogin} disabled={loading}>
              <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>Não é entregador? </Text>
            <TouchableOpacity onPress={handleGoToRegister} disabled={loading}>
              <Text style={[styles.footerLinkText, styles.footerLinkAction]}>Criar conta de cliente</Text>
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