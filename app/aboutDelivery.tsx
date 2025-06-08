import { useEffect, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, StyleSheet } from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import deliveryAuthService, { DeliveryMan, UpdateDeliveryProfileData } from "../utils/deliveryAuthService"
import { showAlert, showSuccess, showError } from "../utils/alertService"

export default function AboutDelivery() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<DeliveryMan | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cnhNumber: "",
    isAvailable: true,
  })

  useEffect(() => {
    loadDeliveryProfile()
  }, [])

  const loadDeliveryProfile = async () => {
    try {
      const profile = await deliveryAuthService.getProfile()
      if (profile) {
        setUserData(profile)
        setFormData({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          cpf: profile.cpf,
          cnhNumber: profile.cnhNumber,
          isAvailable: profile.isAvailable,
        })
      } else {
        showError("Erro", "Não foi possível obter os dados do entregador.")
        router.replace("/loginDelivery")
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      showError("Sessão expirada", "Por favor, faça login novamente.")
      router.replace("/loginDelivery")
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
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

    if (!formData.phone.trim()) {
      showError("Erro", "O telefone é obrigatório")
      return false
    }

    if (!formData.cpf.trim()) {
      showError("Erro", "O CPF é obrigatório")
      return false
    }

    if (!formData.cnhNumber.trim()) {
      showError("Erro", "O número da CNH é obrigatório")
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      
      const updateData: UpdateDeliveryProfileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        isAvailable: formData.isAvailable,
      }

      await deliveryAuthService.updateProfile(updateData)
      
      showSuccess("Sucesso", "Dados atualizados com sucesso!")
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
          headerTitle: "Meu Perfil",
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
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>

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

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="card-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.cpf}
              onChangeText={(text) => handleChange("cpf", text)}
              placeholder="CPF"
              placeholderTextColor="#868889"
              keyboardType="numeric"
              editable={false} // CPF não deve ser editável
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.cnhNumber}
              onChangeText={(text) => handleChange("cnhNumber", text)}
              placeholder="Número da CNH"
              placeholderTextColor="#868889"
              keyboardType="numeric"
              editable={false} // CNH não deve ser editável
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilidade</Text>
          
          <View style={styles.availabilityContainer}>
            <View style={styles.availabilityInfo}>
              <Ionicons name="time-outline" size={20} color="#6CC51D" />
              <Text style={styles.availabilityText}>
                Disponível para entregas
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, formData.isAvailable && styles.toggleButtonActive]}
              onPress={() => handleChange("isAvailable", !formData.isAvailable)}
              disabled={loading}
            >
              <View style={[styles.toggleCircle, formData.isAvailable && styles.toggleCircleActive]} />
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
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  availabilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  availabilityText: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 12,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: "#6CC51D",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
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
