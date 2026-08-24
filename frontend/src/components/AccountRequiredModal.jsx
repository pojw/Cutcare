import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

export default function AccountRequiredModal({
  visible,
  title = "Account needed",
  detail = "Create an account to save this and keep your CutCare activity connected.",
  onClose,
}) {
  const router = useRouter();

  function handleCreateAccount() {
    onClose?.();
    router.push("/guestLogin");
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
        >
          <Text className="text-center text-xl font-bold text-app-text">
            {title}
          </Text>

          <Text className="mt-4 text-center text-base leading-6 text-app-text-secondary">
            {detail}
          </Text>

          <View className="mt-6 gap-3">
            <Pressable
              onPress={handleCreateAccount}
              className="rounded-xl bg-app-primary px-6 py-3 active:bg-app-primary-pressed"
            >
              <Text className="text-center font-semibold text-app-text-inverse">
                Create Account
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="rounded-xl border border-app-border px-6 py-3 active:bg-app-surface-elevated"
            >
              <Text className="text-center font-semibold text-app-text-secondary">
                Keep Browsing
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
