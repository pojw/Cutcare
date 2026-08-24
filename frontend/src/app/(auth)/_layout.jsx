import {Stack} from "expo-router"


export default function TabLayout() {
    return (
        <Stack screenOptions={{headerShown:false}}>
            <Stack.Screen name="forgotPassword"></Stack.Screen>
            <Stack.Screen name="guestLogin"></Stack.Screen>
            <Stack.Screen name="signup"></Stack.Screen>
            <Stack.Screen name="login"></Stack.Screen>
        </Stack>
    );
    }
