import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import ConfirmationModal from "../components/ConfirmationModal";

const AppAlertContext = createContext(null);

const DEFAULT_ALERT = {
  visible: false,
  title: "",
  detail: "",
  confirmLabel: "OK",
  secondaryLabel: "",
  onConfirm: null,
  onSecondary: null,
};

function normalizeAlertButton(button) {
  if (!button) {
    return null;
  }

  return {
    label: button.text || "OK",
    onPress: button.onPress || null,
    style: button.style,
  };
}

export function AppAlertProvider({ children }) {
  const [alert, setAlert] = useState(DEFAULT_ALERT);

  const closeAlert = useCallback(() => {
    setAlert((current) => ({
      ...current,
      visible: false,
    }));
  }, []);

  const runAndClose = useCallback(
    (callback) => {
      closeAlert();
      callback?.();
    },
    [closeAlert]
  );

  const showAppAlert = useCallback((title, detail, buttons = []) => {
    const normalizedButtons = Array.isArray(buttons)
      ? buttons.map(normalizeAlertButton).filter(Boolean)
      : [];
    const cancelButton =
      normalizedButtons.find((button) => button.style === "cancel") || null;
    const confirmButton =
      normalizedButtons.find((button) => button.style !== "cancel") ||
      normalizedButtons[0] ||
      null;

    setAlert({
      visible: true,
      title: title || "",
      detail: detail || "",
      confirmLabel: confirmButton?.label || "OK",
      secondaryLabel: cancelButton?.label || "",
      onConfirm: confirmButton?.onPress || null,
      onSecondary: cancelButton?.onPress || null,
    });
  }, []);

  const value = useMemo(
    () => ({
      showAppAlert,
    }),
    [showAppAlert]
  );

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <ConfirmationModal
        visible={alert.visible}
        title={alert.title}
        detail={alert.detail}
        confirmLabel={alert.confirmLabel}
        secondaryLabel={alert.secondaryLabel}
        onClose={closeAlert}
        onConfirm={() => runAndClose(alert.onConfirm)}
        onSecondary={() => runAndClose(alert.onSecondary)}
      />
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error("useAppAlert must be used inside AppAlertProvider");
  }

  return context;
}
