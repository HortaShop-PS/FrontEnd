import { Tabs } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
    return (
      <Tabs screenOptions={{
        tabBarActiveTintColor: "#6dc51c",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          elevation: 0,           
          shadowOpacity: 0,       
          shadowOffset: {
            width: 0,
            height: 0
          },
          borderTopWidth: 0.5,    
          borderTopColor: "#f0f0f0"
        }
      }}>
  
        <Tabs.Screen
          name="index"
          options={{
            headerTitle: "",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                color={"#6dc51c"}
                size={24}
              />
            ),
            headerShown: false,
            title: "Ínicio",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerTitle: "",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={"#6dc51c"}
                size={24}
              />
            ),
            headerShown: false,
            title: "Perfil",
          }}
        />
      </Tabs>
    );
  }
