import { useState } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAppAlert } from "../../context/AppAlertContext";

import CenterScreen from "../../components/centerScreen";
import { auth } from "../../config/firebase";

export default function ForgotPassword() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function showResetSentMessage() {
    showAppAlert(
      "Check your email",
      "If an account exists with that email, you will receive a password reset link.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]
    );
  }

  async function handleResetPassword() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showAppAlert("Missing email", "Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, trimmedEmail);

      showResetSentMessage();
    } catch (error) {
      console.log("Reset password error:", error);

      if (error?.code === "auth/invalid-email") {
        showAppAlert(
          "Invalid email",
          "Please enter a valid email address."
        );
        return;
      }

      if (error?.code === "auth/user-not-found") {
        showResetSentMessage();
        return;
      }

      showAppAlert(
        "Reset failed",
        "We could not send a reset link right now. Please try again."
      );
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
          {/* Brand */}
          <View className="mb-6 items-center">
            <Image
              source={require("../../../assets/images/icon.png")}
              className="mb-4 h-20 w-20 rounded-3xl"
            />

            <Text
              style={{ fontSize: 42 }}
              className="font-bold text-app-text"
            >
              Cut<Text className="text-app-primary">Care</Text>
            </Text>

          </View>

          {/* Form Card */}
          <View className="p-2">
            <View className="mb-4">
              <Text className="text-xl font-bold text-app-text">
                Forgot password?
              </Text>
            </View>

            {/* Email */}
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

            {/* Button */}
            <Pressable
              onPress={handleResetPassword}
              disabled={loading}
              className={`rounded-2xl px-4 py-4 ${
                loading
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {loading ? "Sending..." : "Send Reset Link"}
              </Text>
            </Pressable>

            {/* Back to Login */}
            <View className="mt-4 flex-row justify-center">
              <Text className="text-app-text-muted">Remember your password? </Text>
              <Link
                href="/login"
                style={{ color: "#1677FF", fontWeight: "700" }}
              >
                Log in
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </CenterScreen>
  );
}
