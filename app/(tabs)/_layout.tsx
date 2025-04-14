import { Tabs } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
    return (
      <Tabs>
  
        <Tabs.Screen name = "index" options={{headerTitle: "", tabBarIcon: ({ color, focused }) => (
           <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
        ), headerShown: false, title: 'Ínicio'}}/>
        <Tabs.Screen name = "profile" options={{headerTitle: "", tabBarIcon: ({ color, focused }) => (
           <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
        ), headerShown: false, title: 'Perfil'}}/>
      </Tabs>
    );
  }