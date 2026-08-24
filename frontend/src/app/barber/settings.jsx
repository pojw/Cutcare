import { useRouter } from "expo-router";

import AccountSettingsScreen from "../../components/AccountSettingsScreen";

export default function BarberSettings() {
  const router = useRouter();

  return (
    <AccountSettingsScreen
      role="barber"
      title="Settings"
      managementRows={[
        {
          icon: "cut-outline",
          title: "Services",
          onPress: () => router.push("/barber/services"),
        },
        {
          icon: "time-outline",
          title: "Availability",
          onPress: () => router.push("/barber/availability"),
        },
        {
          icon: "people-outline",
          title: "Clients",
          onPress: () => router.push("/barber/clients"),
        },
      ]}
    />
  );
}
