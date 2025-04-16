import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
                <TouchableOpacity onPress={() => router.push("/about")}>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="person-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Sobre Mim</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="cube-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Meus Pedidos</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="heart-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Meus Favoritos</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="location-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Meus Endereços</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="card-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Cartões De Crédito</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <MaterialCommunityIcons name="history" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Histórico de Transações</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="notifications-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Notificações</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <View style={styles.menuItemRow}>
                        <Ionicons name="log-out-outline" size={22} color="#6CC51D" style={styles.menuIcon} />
                        <Text style={styles.menuItemText}>Sair</Text>
                        <Ionicons name="chevron-forward" size={22} color="#BDBDBD" style={styles.chevronIcon} />
                    </View>
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
        justifyContent: "center",
        alignItems: "center",
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
    menuItemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: SPACING / 2,
    },
    menuIcon: {
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 18,
        color: "#333",
        flex: 1,
    },
    chevronIcon: {
        marginLeft: 12,
    },
});