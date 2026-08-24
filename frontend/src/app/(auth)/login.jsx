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
import CenterScreen from "../../components/centerScreen";
import LegalLinksFooter from "../../components/LegalLinksFooter";
import { useAppAlert } from "../../context/AppAlertContext";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { createGuestAccount } from "../../services/guestAuthService";

export default function Login() {
  const { showAppAlert } = useAppAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [guestLoading, setGuestLoading] = useState(false);
const router = useRouter();
const { refreshUserData } = useAuth();

function getGuestModeErrorMessage(error) {
  if (
    error?.code === "auth/operation-not-allowed" ||
    error?.code === "auth/admin-restricted-operation"
  ) {
    return "Anonymous sign-in is not enabled in Firebase Authentication. Enable the Anonymous provider in Firebase Console, then try again.";
  }

  if (error?.code === "permission-denied") {
    return "Guest sign-in worked, but Firestore denied creating the guest profile. Make sure the latest Firestore rules are deployed.";
  }

  return error.message || "Could not start a guest session.";
}

async function handleLogin() {
  if (!email.trim() || !password) {
    showAppAlert(
      "Missing information",
      "Please enter your email and password."
    );
    return;
  }

  try {
    setLoading(true);

    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    // Let index.jsx route based on onboarded and role.
    router.replace("/");
  } catch (error) {
    console.log("Login error:", error);

    showAppAlert(
      "Login failed",
      "Please check your email and password."
    );
  } finally {
    setLoading(false);
  }
}

async function handleGuestLogin() {
  try {
    setGuestLoading(true);

    const guestUser = await createGuestAccount();
    await refreshUserData(guestUser);
    router.replace("/");
  } catch (error) {
    console.log("Guest login error:", error);

    showAppAlert(
      "Guest mode failed",
      getGuestModeErrorMessage(error)
    );
  } finally {
    setGuestLoading(false);
  }
}

  return (
    <CenterScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="w-full"
      >
        <View className="w-full px-6">
          {/* Logo / Brand */}
          <View className="mb-4 items-center">
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
            <View className="mb-2">
              <Text               style={{ fontSize: 25 }}
 className="text-center  font-bold text-app-text">
                Welcome back
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

            {/* Password */}
            <View className="mb-3">
              <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
                Password
              </Text>

              {/* toggle view later */}
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#8292A6"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
              />
            </View>

            {/* Forgot Password */}
            <View className="mb-6 items-end">
              <Pressable onPress={() => router.push("/forgotPassword")}>
                <Text className="text-sm font-semibold text-app-text-muted">
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Login Button */}
         <Pressable
  onPress={handleLogin}
  disabled={loading}
  className={`rounded-2xl px-4 py-4 active:opacity-80 ${
    loading ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
  }`}
>
  <Text className="text-center text-base font-bold text-app-text-inverse">
    {loading ? "Logging in..." : "Log In"}
  </Text>
</Pressable>

            {/* Sign up link */}
            <View className="mt-6 flex-row justify-center">
              <Text className="text-app-text-muted">
                {"Don't have an account? "}
              </Text>
              <Link
                href="/signup"
                replace
                style={{ color: "#1677FF", fontWeight: "700" }}
              >
                Sign up
              </Link>
            </View>
             {/* Guest */}
          <Pressable
            onPress={handleGuestLogin}
            disabled={guestLoading}
            className={`mt-4 flex-row items-center justify-center rounded-2xl border border-app-border px-4 py-4 active:opacity-80 ${
              guestLoading ? "bg-app-disabled" : "bg-app-surface"
            }`}
          >
            <Text className="font-semibold text-app-text-muted">
              {guestLoading ? "Starting Guest Mode..." : "Continue as Guest"}
            </Text>
          </Pressable>

          <LegalLinksFooter className="mt-5" />
          </View>
       
        </View>
      </KeyboardAvoidingView>
    </CenterScreen>
  );
}
