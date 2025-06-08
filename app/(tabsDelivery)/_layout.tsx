import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import deliveryOrderService from "../../utils/deliveryOrderService";

export default function DeliveryTabsLayout() {
  const [hasActiveDelivery, setHasActiveDelivery] = useState(false);

  useEffect(() => {
    checkActiveDelivery();
  }, []);

  const checkActiveDelivery = async () => {
    try {
      const activeDelivery = await deliveryOrderService.getCurrentActiveDelivery();
      setHasActiveDelivery(!!activeDelivery);
    } catch (error) {
      console.error('Erro ao verificar entrega ativa:', error);
      setHasActiveDelivery(false);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6CC51D",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Entregas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: hasActiveDelivery ? "Entrega Atual" : "Sem Entregas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons 
              name={hasActiveDelivery ? "location" : "location-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}