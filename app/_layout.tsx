import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: "Home",
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="tier-sim" 
        options={{
          title: "Tier Simulator",
          headerShown: false
        }} 
      />
    </Stack>
  );
}
