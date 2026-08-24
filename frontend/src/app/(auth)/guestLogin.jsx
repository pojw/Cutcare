import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { useRouter } from "expo-router";
import { useAppAlert } from "../../context/AppAlertContext";

import CenterScreen from "../../components/centerScreen";
import LegalLinksFooter from "../../components/LegalLinksFooter";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { upgradeGuestAccount } from "../../services/guestAuthService";

export default function GuestLogin() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();
  const { refreshUserData } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    if (!fullName.trim() || !email.trim() || !password) {
      showAppAlert(
        "Missing information",
        "Please enter your name, email, and password."
      );
      return;
    }

    if (!auth.currentUser?.isAnonymous) {
      showAppAlert(
        "No guest session",
        "Please continue as guest first or use regular sign up.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/signup"),
          },
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const upgradedUser = await upgradeGuestAccount({
        fullName,
        email,
        password,
      });

      await refreshUserData(upgradedUser);
      router.replace("/onboarding/client");
    } catch (error) {
      console.log("Guest upgrade error:", error);

      const message =
        error?.code === "auth/email-already-in-use"
          ? "That email is already attached to an account. Please log in instead."
          : error.message || "Could not create your account.";

      showAppAlert("Account creation failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CenterScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="w-full"
      >
        <View className="w-full px-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-5 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons name="arrow-back" size={24} color="#1677FF" />
          </Pressable>

          <View className="mb-6 items-center">
            <Text className="text-center text-3xl font-bold text-app-text">
              Create Your <Text className="text-app-primary">Account</Text>
            </Text>

            <Text className="mt-3 text-center text-base leading-6 text-app-text-secondary">
              Keep your guest activity and finish your client setup.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Full name
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#8292A6"
              autoCapitalize="words"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8292A6"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor="#8292A6"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <Pressable
            onPress={handleCreateAccount}
            disabled={loading}
            className={`rounded-2xl px-4 py-4 active:opacity-80 ${
              loading ? "bg-app-disabled" : "bg-app-primary"
            }`}
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </Pressable>

          <LegalLinksFooter className="mt-5" />
        </View>
      </KeyboardAvoidingView>
    </CenterScreen>
  );
}
