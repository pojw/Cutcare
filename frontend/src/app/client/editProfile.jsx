import { useCallback, useEffect, useState } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAppAlert } from "../../context/AppAlertContext";

import { auth, db, storage } from "../../config/firebase";
import LocationPicker from "../../components/location/LocationPicker";
import ConfirmationModal from "../../components/ConfirmationModal";

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8292A6"
        multiline={multiline}
        autoCapitalize="sentences"
        className={`rounded-2xl border border-app-border bg-app-surface px-4 py-4 text-base text-app-text ${
          multiline ? "min-h-28 text-top" : ""
        }`}
      />
    </View>
  );
}

function textToArray(text) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function arrayToText(value) {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

function uriToBlob(imageUri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(new Error("Failed to read the selected image."));
    };

    xhr.responseType = "blob";
    xhr.open("GET", imageUri, true);
    xhr.send(null);
  });
}

async function uploadClientProfileImage({
  clientId,
  imageUri,
  mimeType = "image/jpeg",
}) {
  const storagePath = `clients/${clientId}/profile/profile.jpg`;
  const imageRef = ref(storage, storagePath);
  const imageBlob = await uriToBlob(imageUri);

  await uploadBytes(imageRef, imageBlob, {
    contentType: mimeType,
  });

  const downloadUrl = await getDownloadURL(imageRef);
  const clientRef = doc(db, "clients", clientId);

  await updateDoc(clientRef, {
    profileImageUrl: downloadUrl,
    profileImagePath: storagePath,
    updatedAt: serverTimestamp(),
  });

  return {
    url: downloadUrl,
    storagePath,
  };
}

function EditProfileHeader({ onBack }) {
  return (
    <View className="mb-8 flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons name="arrow-back" size={24} color="#1677FF" />
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-bold text-app-text">
        Edit<Text className="text-app-primary">Profile</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function EditClientProfile() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();

  const [preferredName, setPreferredName] = useState("");
  const [location, setLocation] = useState({
    city: "",
    state: "",
    stateCode: "",
    countryCode: "US",
  });
  const [haircutPreferences, setHaircutPreferences] = useState("");
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveConfirmationVisible, setSaveConfirmationVisible] =
    useState(false);

  const loadClientProfile = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const clientRef = doc(db, "clients", currentUser.uid);
      const clientSnap = await getDoc(clientRef);

      if (!clientSnap.exists()) {
        showAppAlert("Profile not found", "Your client profile could not be found.");
        router.back();
        return;
      }

      const data = clientSnap.data();

      setPreferredName(data.preferredName || "");
      setLocation({
        city: data.location?.city || "",
        state: data.location?.state || "",
        stateCode: data.location?.stateCode || data.location?.state || "",
        countryCode: data.location?.countryCode || "US",
      });
      setHaircutPreferences(arrayToText(data.haircutPreferences));
      setProfileImageUrl(data.profileImageUrl || "");
    } catch (error) {
      console.log("Load client edit profile error:", error);
      showAppAlert("Error", "Something went wrong while loading your profile.");
    } finally {
      setLoading(false);
    }
  }, [router, showAppAlert]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadClientProfile();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadClientProfile]);

  async function handleSave() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!preferredName.trim()) {
        showAppAlert("Missing name", "Please enter your preferred name.");
        return;
      }

      if (!location.city || !location.stateCode) {
        showAppAlert("Missing location", "Please choose your city and state.");
        return;
      }

      setSaving(true);

      const clientRef = doc(db, "clients", currentUser.uid);

      await updateDoc(clientRef, {
        preferredName: preferredName.trim(),
        location: {
          city: location.city,
          state: location.state,
          stateCode: location.stateCode,
          countryCode: "US",
        },
        haircutPreferences: textToArray(haircutPreferences),
        updatedAt: serverTimestamp(),
      });

      setSaveConfirmationVisible(true);
    } catch (error) {
      console.log("Save client profile error:", error);
      showAppAlert("Save failed", "Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleProfileImageUpload() {
    if (uploadingProfileImage) {
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setProfileImageError("");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      const selectedImage = result.assets[0];

      setSelectedProfileImage(selectedImage);
      setUploadingProfileImage(true);

      const uploadedImage = await uploadClientProfileImage({
        clientId: currentUser.uid,
        imageUri: selectedImage.uri,
        mimeType: selectedImage.mimeType || "image/jpeg",
      });

      setProfileImageUrl(uploadedImage.url);
    } catch (error) {
      console.log("Client profile image upload error:", error);
      setProfileImageError("Unable to upload profile image. Please try again.");
    } finally {
      setUploadingProfileImage(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Loading edit profile...</Text>
      </SafeAreaView>
    );
  }

  const displayedProfileImage =
    selectedProfileImage?.uri ||
    profileImageUrl ||
    "";
  const profileInitial = (preferredName || "C").trim().charAt(0).toUpperCase();

  function handleCloseSaveConfirmation() {
    setSaveConfirmationVisible(false);
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ConfirmationModal
        visible={saveConfirmationVisible}
        title="Profile Updated"
        detail="Your client profile has been saved."
        confirmLabel="OK"
        onClose={handleCloseSaveConfirmation}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          <EditProfileHeader onBack={() => router.back()} />

          <View className="rounded-3xl bg-app-surface p-5">
            <View className="mb-6 items-center">
              <Pressable
                onPress={handleProfileImageUpload}
                disabled={uploadingProfileImage}
                className="items-center"
              >
                {displayedProfileImage ? (
                  <Image
                    source={{ uri: displayedProfileImage }}
                    style={{ width: 108, height: 108, borderRadius: 54 }}
                    className="bg-app-surface-elevated"
                  />
                ) : (
                  <View
                    style={{ width: 108, height: 108, borderRadius: 54 }}
                    className="items-center justify-center bg-app-primary-soft"
                  >
                    <Text className="text-5xl font-bold text-app-primary">
                      {profileInitial}
                    </Text>
                  </View>
                )}

                <Text className="mt-3 text-sm font-semibold text-app-primary">
                  {uploadingProfileImage
                    ? "Uploading..."
                    : displayedProfileImage
                      ? "Change Photo"
                      : "Add Photo"}
                </Text>
              </Pressable>

              {profileImageError ? (
                <Text className="mt-2 text-center text-sm font-semibold text-app-error">
                  {profileImageError}
                </Text>
              ) : null}
            </View>

            <FormInput
              label="Preferred Name"
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="Jaylin"
            />

            <LocationPicker
              value={location}
              onChange={setLocation}
              disabled={saving}
            />

            <FormInput
              label="Haircut Preferences"
              value={haircutPreferences}
              onChangeText={setHaircutPreferences}
              placeholder="Fade and taper and beard trim"
              multiline
            />

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`rounded-2xl px-4 py-4 ${
                saving
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              className="mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
            >
              <Text className="text-center text-base font-bold text-app-text">
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
