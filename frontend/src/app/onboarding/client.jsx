import { useState } from "react";
import { Image,
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@/components/icons/AppIcon";
import CenterScreen from "../../components/centerScreen";
import LocationPicker from "../../components/location/LocationPicker";
import { useAppAlert } from "../../context/AppAlertContext";

import { auth, db, storage } from "../../config/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
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

  return {
    url: downloadUrl,
    storagePath,
  };
}

export default function ClientOnboarding() {
  const { showAppAlert } = useAppAlert();
  const { refreshUserData } = useAuth();
  const router = useRouter();

  const [preferredName, setPreferredName] = useState("");
  const [location, setLocation] = useState({
    city: "",
    state: "",
    stateCode: "",
    countryCode: "US",
  });
  const [profileImage, setProfileImage] = useState(null);

  async function handlePickProfileImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      setProfileImage(result.assets[0]);
    } catch (error) {
      console.log("Pick client profile image error:", error);
      showAppAlert("Image error", "Could not select that image.");
    }
  }

  async function handleFinish() {
    const user = auth.currentUser;

    if (!user) {
      showAppAlert("Error", "No logged-in user found.");
      return;
    }

    if (!preferredName || !location.city || !location.stateCode) {
      showAppAlert("Missing information", "Please fill out all fields.");
      return;
    }

    try {
      let uploadedProfileImage = null;

      if (profileImage?.uri) {
        uploadedProfileImage = await uploadClientProfileImage({
          clientId: user.uid,
          imageUri: profileImage.uri,
          mimeType: profileImage.mimeType || "image/jpeg",
        });
      }

      await setDoc(doc(db, "clients", user.uid), {
        userId: user.uid,
        preferredName: preferredName.trim(),
        location: {
          city: location.city,
          state: location.state,
          stateCode: location.stateCode,
          countryCode: "US",
        },
        profileImageUrl: uploadedProfileImage?.url || "",
        profileImagePath: uploadedProfileImage?.storagePath || "",
        favoriteBarbers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        isGuest: false,
        role: "client",
        onboarded: true,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
      await refreshUserData();


      router.replace("/client/home");
    } catch (error) {
      console.log(error);
      showAppAlert("Client setup failed", error.message);
    }
  }

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-4 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons name="arrow-back" size={24} color="#1677FF" />
          </Pressable>

          <Text className="flex-1 text-center text-3xl font-bold text-app-text">
            Client<Text className="text-app-primary">Setup</Text>
          </Text>

          <View className="h-11 w-11" />
        </View>

        <View className="p-5">
          <View className="mb-6 items-center">
            <Pressable
              onPress={handlePickProfileImage}
              className="items-center"
            >
              {profileImage?.uri ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  className="h-20 w-20 rounded-3xl bg-app-surface-elevated"
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-app-primary-soft">
                  <Text className="text-3xl font-bold text-app-primary">
                    {(preferredName || "C").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text className="mt-3 text-sm font-semibold text-app-primary">
                {profileImage?.uri ? "Change Photo" : "Add Photo"}
              </Text>

              <Text className="mt-1 text-xs font-semibold text-app-text-muted">
                (Optional)
              </Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Preferred name
            </Text>
            <TextInput
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="Jaylin"
              placeholderTextColor="#8292A6"
              autoCapitalize="words"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>
          <LocationPicker value={location} onChange={setLocation} />

          <Pressable
            onPress={handleFinish}
            className="rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              Finish Client Setup
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-app-text-muted">
              Back
            </Text>
          </Pressable>
        </View>
      </View>
    </CenterScreen>
  );
}
