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
import { Ionicons } from "@/components/icons/AppIcon";
import { Link, useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";
import LegalLinksFooter from "../../components/LegalLinksFooter";
import { useAppAlert } from "../../context/AppAlertContext";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";


export default function Signup() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  function getSignupErrorMessage(error) {
    if (error?.code === "auth/email-already-in-use") {
      return "That email is already attached to an account. Try logging in instead.";
    }

    if (error?.code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }

    if (error?.code === "auth/weak-password") {
      return "Please choose a password with at least 6 characters.";
    }

    return "Could not create your account. Please try again.";
  }

  async function handleSignup() {
    if (!fullName || !email || !password) {
      showAppAlert("Missing information", "Please fill out all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        isGuest: false,
        role: "client",
        onboarded: false,
        profileComplete: false,
        createdAt: serverTimestamp(),
      });

      router.replace("/onboarding");
    } catch (error) {
      console.log(error);
      showAppAlert("Signup failed", getSignupErrorMessage(error));
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
              <Text
                style={{ fontSize: 25 }}
                className="text-center font-bold text-app-text"
              >
                Sign up
              </Text>
            </View>

            {/* Full Name */}
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
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
                Password
              </Text>
              <View className="min-h-14 flex-row items-center rounded-2xl border border-app-border bg-app-surface-elevated px-4">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#8292A6"
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 py-0 text-base text-app-text"
                />

                <Pressable
                  onPress={() => setPasswordVisible((current) => !current)}
                  className="h-14 pl-3 items-center justify-center"
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#8292A6"
                  />
                </Pressable>
              </View>
            </View>

            {/* Button */}
            <Pressable
              onPress={handleSignup}
              className="rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                Create Account
              </Text>
            </Pressable>

            {/* Login Link */}
            <View className="mt-6 flex-row justify-center">
              <Text className="text-app-text-muted">Already have an account? </Text>
              <Link
                href="/login"
                replace
                style={{ color: "#1677FF", fontWeight: "700" }}
              >
                Log in
              </Link>
            </View>

            <LegalLinksFooter className="mt-5" />
          </View>
        </View>
      </KeyboardAvoidingView>

    </CenterScreen>
  );
}
