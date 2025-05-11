import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const categorias = [
    { id: 1, nome: "Vegetais", icone: "leaf" },
    { id: 2, nome: "Frutas", icone: "nutrition" },
    { id: 3, nome: "Orgânicos", icone: "egg" },
    { id: 4, nome: "Laticínios", icone: "water" },
    { id: 5, nome: "Embutidos", icone: "basket" },
    { id: 6, nome: "Grãos", icone: "apps-outline" },
    { id: 7, nome: "Temperos", icone: "leaf-outline" },
    { id: 8, nome: "Bebidas", icone: "wine" },
    { id: 9, nome: "Doces", icone: "ice-cream" },
    { id: 10, nome: "Outros", icone: "ellipsis-horizontal" },
  ];

export default function Categories() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorias</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={24} color="#222" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={categorias}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icone} size={32} color="#6CC51D" />
            </View>
            <Text style={styles.cardLabel}>{item.nome}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#222",
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    flex: 1,
    alignItems: "center",
    margin: 8,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 18,
    elevation: 1,
    minWidth: 100,
    maxWidth: 120,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#222",
    textAlign: "center",
  },
});