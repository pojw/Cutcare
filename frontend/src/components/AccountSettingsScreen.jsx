import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { signOut } from "firebase/auth";
import { useAppAlert } from "../context/AppAlertContext";

import { useAuth } from "../context/AuthContext";
import { auth } from "../config/firebase";
import { LEGAL_LINKS } from "../constants/legalLinks";
import { deleteCurrentAccount } from "../services/accountDeletionService";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

function SettingsRow({
  icon,
  title,
  onPress,
  destructive = false,
}) {
  const iconColor = destructive ? "#DC2626" : "#1677FF";

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
    >
      <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft">
        <Ionicons
          name={icon}
          size={22}
          color={iconColor}
        />
      </View>

      <View className="flex-1 pr-3">
        <Text
          className={`text-base font-bold ${
            destructive ? "text-red-600" : "text-app-text"
          }`}
        >
          {title}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={destructive ? "#DC2626" : "#8292A6"}
      />
    </Pressable>
  );
}

function SectionTitle({ children }) {
  return (
    <Text className="mb-3 mt-6 text-sm font-bold uppercase text-app-text-muted">
      {children}
    </Text>
  );
}

async function openExternalUrl(url) {
  await openBrowserAsync(url, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  });
}

export default function AccountSettingsScreen({
  role,
  title,
  managementRows = [],
}) {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();
  const { logout } = useAuth();
  const [busyAction, setBusyAction] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  async function handleLogout() {
    try {
      setBusyAction("logout");
      await logout();
      router.replace("/login");
    } catch (error) {
      console.log("Settings logout error:", error);
      showAppAlert("Log out failed", "Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteAccount() {
    try {
      setBusyAction("delete");

      await deleteCurrentAccount();

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.log(
          "Local sign out after account deletion failed:",
          signOutError
        );
      }

      router.replace("/login");
    } catch (error) {
      console.log("Delete account error:", error);

      setDeleteAccountError(
        error.message ||
          "We could not delete your account right now. Please try again."
      );
    } finally {
      setBusyAction("");
    }
  }

  function confirmDeleteAccount() {
    setDeleteAccountError("");
    setDeleteModalVisible(true);
  }

  function closeDeleteAccountModal() {
    if (busyAction === "delete") {
      return;
    }

    setDeleteModalVisible(false);
    setDeleteAccountError("");
  }

  const isBusy = Boolean(busyAction);

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="Delete account?"
        detail="This removes your CutCare sign-in account and main profile data. This cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={busyAction === "delete"}
        error={deleteAccountError}
        onClose={closeDeleteAccountModal}
        onConfirm={deleteAccount}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons name="arrow-back" size={24} color="#1677FF" />
          </Pressable>

          <Text className="flex-1 text-center text-3xl font-bold text-app-text">
            {title}
          </Text>

          <View className="h-11 w-11" />
        </View>

        <SectionTitle>Account</SectionTitle>

        <SettingsRow
          icon="person-outline"
          title="Edit Profile"
          onPress={() =>
            router.push(
              role === "barber"
                ? "/barber/editProfile"
                : "/client/editProfile"
            )
          }
        />

        {managementRows.length > 0 ? (
          <>
            <SectionTitle>
              {role === "barber" ? "Business" : "Profile Tools"}
            </SectionTitle>

            {managementRows.map((row) => (
              <SettingsRow key={row.title} {...row} />
            ))}
          </>
        ) : null}

        <SectionTitle>Legal & Support</SectionTitle>

        <SettingsRow
          icon="document-text-outline"
          title="Privacy Policy"
          onPress={() => openExternalUrl(LEGAL_LINKS.privacy)}
        />

        <SettingsRow
          icon="options-outline"
          title="Privacy Choices"
          onPress={() => openExternalUrl(LEGAL_LINKS.privacyChoices)}
        />

        <SettingsRow
          icon="reader-outline"
          title="Terms of Use"
          onPress={() => openExternalUrl(LEGAL_LINKS.terms)}
        />

        <SettingsRow
          icon="help-circle-outline"
          title="Support"
          onPress={() => openExternalUrl(LEGAL_LINKS.support)}
        />

        <SectionTitle>Session</SectionTitle>

        <Pressable
          disabled={isBusy}
          onPress={handleLogout}
          className={`mb-3 flex-row items-center rounded-2xl border px-4 py-4 ${
            isBusy
              ? "border-app-disabled bg-app-disabled"
              : "border-app-border bg-app-surface active:bg-app-surface-elevated"
          }`}
        >
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft">
            <Ionicons name="log-out-outline" size={22} color="#1677FF" />
          </View>

          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-app-text">
              Log Out
            </Text>
          </View>

          {busyAction === "logout" ? (
            <ActivityIndicator color="#0B1F3A" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#8292A6" />
          )}
        </Pressable>

        <SettingsRow
          icon="trash-outline"
          title={
            busyAction === "delete" ? "Deleting Account..." : "Delete Account"
          }
          destructive
          onPress={isBusy ? undefined : confirmDeleteAccount}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
