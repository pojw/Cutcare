import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

export default function ConfirmationModal({
  visible,
  title = "Saved",
  detail = "Your changes have been saved.",
  confirmLabel = "OK",
  secondaryLabel,
  onClose,
  onConfirm,
  onSecondary,
}) {
  function handleConfirm() {
    if (onConfirm) {
      onConfirm();
      return;
    }

    onClose?.();
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

          <View
            className={`mt-6 ${
              secondaryLabel ? "flex-row gap-3" : "items-center"
            }`}
          >
            {secondaryLabel ? (
              <Pressable
                onPress={onSecondary || onClose}
                className="flex-1 rounded-xl border border-app-border bg-app-surface-elevated px-5 py-3 active:bg-app-primary-soft"
              >
                <Text className="text-center font-semibold text-app-text-secondary">
                  {secondaryLabel}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleConfirm}
              style={secondaryLabel ? null : { width: 160 }}
              className={`rounded-xl bg-app-primary px-7 py-3 active:bg-app-primary-pressed ${
                secondaryLabel ? "flex-1" : ""
              }`}
            >
              <Text className="text-center font-semibold text-app-text-inverse">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
