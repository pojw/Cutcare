import { Image, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import CenterScreen from "../../components/centerScreen";

export default function OnboardingChoice() {
  const router = useRouter();

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <Pressable
          onPress={() => router.replace("/login")}
          className="mb-6 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#1677FF"
          />
        </Pressable>

        <View className="mb-8 items-center">
          <Image
            source={require("../../../assets/images/icon.png")}
            className="mb-4 h-20 w-20 rounded-3xl"
          />

          <Text
            style={{ fontSize: 38 }}
            className="text-center font-bold text-app-text"
          >
            Cut<Text className="text-app-primary">Care</Text>
          </Text>

          <Text className="mt-6 text-center text-3xl font-bold text-app-text">
            How are you using CutCare?
          </Text>

        </View>

        <Pressable
          onPress={() => router.push("/onboarding/client")}
          className="mb-4 rounded-2xl border border-app-border bg-app-surface px-4 py-5 active:bg-app-primary"
        >
          <Text className="text-center text-lg font-bold text-app-text active:text-app-text-inverse">
            I’m a Client
          </Text>
          <Text className="mt-1 text-center text-sm text-app-text-secondary active:text-app-text-inverse">
            Find barbers, book appointments, and chat with AI Assistant.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/onboarding/barber")}
          className="rounded-2xl border border-app-border bg-app-surface px-4 py-5 active:bg-app-primary"
        >
          <Text className="text-center text-lg font-bold text-app-text active:text-app-text-inverse">
            I’m a Barber
          </Text>
          <Text className="mt-1 text-center text-sm text-app-text-secondary active:text-app-text-inverse">
            Manage your profile, services, and bookings.
          </Text>
        </Pressable>
      </View>
    </CenterScreen>
  );
}
