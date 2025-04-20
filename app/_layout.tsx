import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Rota inicial que redireciona */}
      <Stack.Screen name="index" options={{ headerShown: false }} /> 
      {/* Tela de boas-vindas */}
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      {/* Tela de boas-vindas 2 */}
      <Stack.Screen name="welcome2" options={{ headerShown: false }} /> 
      {/* Tela de login */}
      <Stack.Screen name="login" options={{ headerShown: false }} /> 
      {/* Grupo de abas */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
      {/* Tela de 'sobre' ou 'editar perfil' */}
      <Stack.Screen name="about" options={{ headerShown: true, headerTitle: "Editar Perfil" }} /> 
    </Stack>
  );
}