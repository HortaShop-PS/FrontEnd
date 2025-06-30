import { useEffect, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, StyleSheet } from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import deliveryAuthService, { DeliveryMan, UpdateVehicleData } from "../utils/deliveryAuthService"
import { showAlert, showSuccess, showError } from "../utils/alertService"

export default function VehicleData() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<DeliveryMan | null>(null)
  const [formData, setFormData] = useState({
    vehicleType: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    vehiclePlate: "",
    vehicleColor: "",
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
          vehicleType: profile.vehicleType || "",
          vehicleBrand: profile.vehicleBrand || "",
          vehicleModel: profile.vehicleModel || "",
          vehicleYear: profile.vehicleYear || "",
          vehiclePlate: profile.vehiclePlate || "",
          vehicleColor: profile.vehicleColor || "",
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.vehicleType.trim()) {
      showError("Erro", "O tipo de veículo é obrigatório")
      return false
    }

    if (!formData.vehicleBrand.trim()) {
      showError("Erro", "A marca do veículo é obrigatória")
      return false
    }

    if (!formData.vehicleModel.trim()) {
      showError("Erro", "O modelo do veículo é obrigatório")
      return false
    }

    if (!formData.vehicleYear.trim()) {
      showError("Erro", "O ano do veículo é obrigatório")
      return false
    }

    const yearNum = parseInt(formData.vehicleYear)
    const currentYear = new Date().getFullYear()
    if (isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
      showError("Erro", `O ano deve estar entre 1980 e ${currentYear + 1}`)
      return false
    }

    if (!formData.vehiclePlate.trim()) {
      showError("Erro", "A placa do veículo é obrigatória")
      return false
    }

    // Validação básica de placa (formato brasileiro)
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
    if (!plateRegex.test(formData.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, ''))) {
      showError("Erro", "Formato de placa inválido (ex: ABC1234 ou ABC1D23)")
      return false
    }

    if (!formData.vehicleColor.trim()) {
      showError("Erro", "A cor do veículo é obrigatória")
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      const vehicleData: UpdateVehicleData = {
        vehicleType: formData.vehicleType,
        vehicleBrand: formData.vehicleBrand,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear,
        vehiclePlate: formData.vehiclePlate.toUpperCase(),
        vehicleColor: formData.vehicleColor,
      }

      await deliveryAuthService.updateVehicle(vehicleData)
      showSuccess("Sucesso", "Dados do veículo atualizados com sucesso!")
      router.back()
    } catch (error: any) {
      showError("Erro", error.message || "Ocorreu um erro ao salvar os dados do veículo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerTitle: "Dados do Veículo",
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
          <Text style={styles.sectionTitle}>Informações do Veículo</Text>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="car-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.vehicleType}
              onChangeText={(text) => handleChange("vehicleType", text)}
              placeholder="Tipo de veículo (ex: Moto, Carro, Bicicleta)"
              placeholderTextColor="#868889"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.vehicleBrand}
              onChangeText={(text) => handleChange("vehicleBrand", text)}
              placeholder="Marca (ex: Honda, Yamaha, Toyota)"
              placeholderTextColor="#868889"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="speedometer-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.vehicleModel}
              onChangeText={(text) => handleChange("vehicleModel", text)}
              placeholder="Modelo (ex: CG 160, Corolla)"
              placeholderTextColor="#868889"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.vehicleYear}
              onChangeText={(text) => handleChange("vehicleYear", text)}
              placeholder="Ano (ex: 2020)"
              placeholderTextColor="#868889"
              keyboardType="numeric"
              maxLength={4}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.vehiclePlate}
              onChangeText={(text) => handleChange("vehiclePlate", text.toUpperCase())}
              placeholder="Placa (ex: ABC1234)"
              placeholderTextColor="#868889"
              autoCapitalize="characters"
              maxLength={8}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="color-palette-outline" size={20} color="#868889" />
            </View>
            <TextInput
              style={styles.input}
              value={formData.vehicleColor}
              onChangeText={(text) => handleChange("vehicleColor", text)}
              placeholder="Cor (ex: Branco, Preto, Azul)"
              placeholderTextColor="#868889"
              editable={!loading}
            />
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
