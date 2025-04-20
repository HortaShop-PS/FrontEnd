import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>

      <Stack.Screen name="index" options={{ headerShown: false }} /> 

      <Stack.Screen name="welcome" options={{ headerShown: false }} />

      <Stack.Screen name="welcome2" options={{ headerShown: false }} /> 

      <Stack.Screen name="login" options={{ headerShown: false }} /> 

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 

      <Stack.Screen name="about" options={{ headerShown: true, headerTitle: "Editar Perfil" }} /> 
    </Stack>
  );
}
