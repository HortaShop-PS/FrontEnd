import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, ImageBackground, KeyboardAvoidingView, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { showError } from '../utils/alertService';
import Config from "react-native-config"

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL 

export default function RegisterProducer() {
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
      showError("Erro", "O nome é obrigatório")
      return false
    }

    if (email && !email.trim()) {
      showError("Erro", "O email não pode estar vazio")
      return false
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        showError("Erro", "Formato de email inválido")
        return false
      }
    }

    if (phone && !phone.trim()) {
      showError("Erro", "O telefone não pode estar vazio")
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

    if (!email && !phone) {
      showError("Erro", "Informe pelo menos um email ou telefone")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    console.log("Tentando criar conta de produtor...");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const producerData = {
        name: name,
        email: email || undefined,
        phoneNumber: phone || undefined,
        password
      };

      console.log("Enviando dados para registro de produtor:", producerData);

      const response = await fetch(`${API_URL}/producer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(producerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar conta de produtor");
      }

      const data = await response.json();
      console.log("Resposta do servidor:", data);

      Alert.alert("Sucesso", "Conta de produtor criada com sucesso! Faça login para continuar.", [
        { text: "OK", onPress: () => router.push("/login") },
      ]);
    } catch (error) {
      console.error("Erro ao registrar produtor:", error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Ocorreu um erro ao criar sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/login")
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/images/registro_produtor.png")}
        style={styles.imageBackground}
        resizeMode="cover"
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Bem-Vindo(a)</Text>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Crie sua conta e comece a vender</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={22} color="#AAAAAA" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={22} color="#AAAAAA" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Endereço de E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={22} color="#AAAAAA" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Número de telefone"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={22} color="#AAAAAA" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon} disabled={loading}>
            <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.buttonText}>Criar</Text>}
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Já tem uma conta de produtor? </Text>
          <TouchableOpacity onPress={handleGoToLogin} disabled={loading}>
            <Text style={styles.footerLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
    left: 20,
    padding: 5,
    zIndex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 50,
    width: "100%",
    alignItems: "center",
    zIndex: 1,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F8",
    borderRadius: 8,
    marginBottom: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#000000",
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: "#7ABC00",
    borderRadius: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: "#A5D28A",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: "#888888",
    fontSize: 14,
  },
  footerLink: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
})
