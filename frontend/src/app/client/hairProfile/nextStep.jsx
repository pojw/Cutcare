import { Text, View, Pressable } from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

function HairProfileHeader({ onBack }) {
  return (
    <View className="mb-6 flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons name="arrow-back" size={24} color="#1677FF" />
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-bold text-app-text">
        Next<Text className="text-app-primary">Step</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function NextStep() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="flex-1 px-6 py-6">
        <HairProfileHeader onBack={() => router.back()} />

        <View className="rounded-3xl bg-app-surface p-6">
          <Text className="text-xl font-bold text-app-text">
            Ready to use your profile?
          </Text>

          <Text className="mt-3 text-base leading-6 text-app-text-secondary">
            Find a barber and bring your hair profile into the booking flow.
          </Text>

          <Pressable
            onPress={() => router.push("/client/search")}
            className="mt-6 rounded-2xl bg-app-primary px-5 py-4 active:bg-app-primary-pressed"
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              Find Barbers
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
