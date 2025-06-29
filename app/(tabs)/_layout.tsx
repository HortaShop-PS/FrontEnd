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
        tabBarActiveTintColor: "#6dc51c",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: {
            width: 0,
            height: 0,
          },
          borderTopWidth: 0.5,
          borderTopColor: "#f0f0f0",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              color="#6dc51c"
              size={24}
            />
          ),
          headerShown: false,
          title: "Início",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: "",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color="#6dc51c"
              size={24}
            />
          ),
          title: "Perfil",
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificações",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={{ position: "relative" }}>
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                color="#6dc51c"
                size={24}
              />
              <NotificationBadge count={unreadCount} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
