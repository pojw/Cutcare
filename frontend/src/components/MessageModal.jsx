import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

export default function MessageModal({
  visible,
  title = "Notice",
  detail = "",
  buttonLabel = "OK",
  onClose,
}) {
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

          {detail ? (
            <Text className="mt-4 text-center text-base leading-6 text-app-text-secondary">
              {detail}
            </Text>
          ) : null}

          <View className="mt-6 items-center">
            <Pressable
              onPress={onClose}
              style={{ width: 160 }}
              className="rounded-xl bg-app-primary px-6 py-3 active:bg-app-primary-pressed"
            >
              <Text className="text-center font-semibold text-app-text-inverse">
                {buttonLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
