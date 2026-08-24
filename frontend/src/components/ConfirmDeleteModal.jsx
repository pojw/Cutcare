import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

export default function ConfirmDeleteModal({
  visible,
  title = "Delete Item?",
  detail = "This action cannot be undone.",
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  loading = false,
  error = "",
  onClose,
  onConfirm,
  children,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={loading ? undefined : onClose}
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

          <Text className="mt-5 text-center text-base leading-6 text-app-text-secondary">
            {detail}
          </Text>

          {children}

          {error ? (
            <Text className="mt-3 text-sm font-medium text-app-error">
              {error}
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={loading ? undefined : onClose}
              className="flex-1 rounded-xl border border-app-border px-4 py-3"
            >
              <Text className="text-center font-semibold text-app-text-secondary">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={loading ? undefined : onConfirm}
              className={`flex-1 rounded-xl px-4 py-3 ${
                loading
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center font-semibold text-app-text-inverse">
                {loading ? loadingLabel : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
