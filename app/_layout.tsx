import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>

      <Stack.Screen name="index" options={{ headerShown: false }} /> 

      <Stack.Screen name="welcome" options={{ headerShown: false }} />

      <Stack.Screen name="welcome2" options={{ headerShown: false }} /> 

      <Stack.Screen name="login" options={{ headerShown: false }} /> 

      <Stack.Screen name="register" options={{ headerShown: false }} /> 

      <Stack.Screen name="registerproducer" options={{ headerShown: false }} /> 

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 

      <Stack.Screen name='about' options={{headerShown: true, headerTitle: "Sobre mim", headerTitleAlign: "center", headerTitleStyle: {fontFamily: "Poppins_400Medium", fontSize: 18}}}/>
      
      <Stack.Screen name='productDetails' options={{ headerShown: false }} />
      <Stack.Screen name='favorites' options={{ headerShown: false }} />
      <Stack.Screen name='search' options={{ headerShown: false }} />
    </Stack>
  );
}
