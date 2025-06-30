import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationBadge from "../../components/NotificationBadge";

export default function TabLayout() {
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6CC51D", // Alterado de #2ECC71 para #6CC51D
        tabBarInactiveTintColor: "#7F8C8D", // Cinza consistente
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 12,
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF", // Fundo branco clean
          height: 70, // Altura mais confortável
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 20,
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0", // Borda sutil consistente
          elevation: 8, // Sombra sutil no Android
          shadowColor: "#000", // Sombra no iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "",
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? "#E8F8F5" : "transparent",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                color={focused ? "#6CC51D" : "#7F8C8D"} // Alterado de #2ECC71 para #6CC51D
                size={24}
              />
            </View>
          ),
          headerShown: false,
          title: "Início",
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificações",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? "#E8F8F5" : "transparent",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}>
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                color={focused ? "#6CC51D" : "#7F8C8D"} // Alterado de #2ECC71 para #6CC51D
                size={24}
              />
              {/* Badge posicionado fora do círculo */}
              <View style={{
                position: "absolute",
                top: -2,
                right: -2,
              }}>
                <NotificationBadge count={unreadCount} />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoritos",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? "#E8F8F5" : "transparent",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                color={focused ? "#6CC51D" : "#7F8C8D"} // Alterado de #2ECC71 para #6CC51D
                size={24}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "",
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: focused ? "#E8F8F5" : "transparent",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={focused ? "#6CC51D" : "#7F8C8D"} // Alterado de #2ECC71 para #6CC51D
                size={24}
              />
            </View>
          ),
          title: "Perfil",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}