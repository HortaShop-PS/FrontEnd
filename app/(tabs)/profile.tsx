import { Text, View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.containerUser}>
                <View style={styles.containerCircle}>
                <Ionicons name={'person'} color={"black"} size={110} style={styles.profileDP} />
                </View>
                <Text style={styles.textUserName}>Fulano de Tal</Text>
                <Text style={styles.textUserEmail}>fulano@fulanomail.com</Text>

            </View>
            <View style={styles.containerBottomSection}>
                <TouchableOpacity>
                    <Text style={styles.menuItemText} onPress={() => router.push("/about")}>Sobre Mim</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.menuItemText}>Meus Pedidos</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.menuItemText}>Meus Favoritos</Text></TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.menuItemText}>Meus Endereços</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.menuItemText}>Cartões De Crédito</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text>
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const SPACING = 16;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
        paddingTop: SPACING * 4,
        paddingBottom: SPACING * 2,
        backgroundColor: "#fff",
    },
    containerUser: {
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginVertical: SPACING * 2,
    },
    containerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: "#6CC51D",
        overflow: "hidden",
        marginBottom: SPACING,
    },
    profileDP: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: SPACING / 2,
    },
    textUserName: {
        fontSize: 25,
        fontWeight: "bold",
        marginVertical: SPACING / 16,
    },
    textUserEmail: {
        fontSize: 12,
        marginVertical: SPACING / 16,
    },
    containerBottomSection: {
        justifyContent: "center",
        flexDirection: "column",
        paddingHorizontal: SPACING * 2,
    },
    menuItemText: {
        fontSize: 18,
        marginVertical: SPACING / 2,
        color: "#333", 
    },
});
