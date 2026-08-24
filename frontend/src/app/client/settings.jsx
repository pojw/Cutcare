import { useRouter } from "expo-router";

import AccountSettingsScreen from "../../components/AccountSettingsScreen";

export default function ClientSettings() {
  const router = useRouter();

  return (
    <AccountSettingsScreen
      role="client"
      title="Settings"
      managementRows={[
        {
          icon: "cut-outline",
          title: "Hair Profile",
          onPress: () => router.push("/client/hairProfile"),
        },
        {
          icon: "color-palette-outline",
          title: "Style Preferences",
          onPress: () => router.push("/client/styles"),
        },
      ]}
    />
  );
}
