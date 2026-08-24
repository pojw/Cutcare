import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../../config/firebase";
import {
  analyzeHairProfile,
  pickHairProfileImage,
  uploadHairProfilePhotos,
} from "../../../services/hairProfileService";

const PHOTO_ANGLES = [
  {
    id: "front",
    label: "Front Photo",
    description:
      "Face the camera directly and keep your hairline, face, and top of your hair visible.",
    icon: "person-outline",
  },
  {
    id: "left",
    label: "Left Side Photo",
    description:
      "Turn your left side toward the camera and keep the full side of your hair visible.",
    icon: "arrow-back-circle-outline",
  },
  {
    id: "right",
    label: "Right Side Photo",
    description:
      "Turn your right side toward the camera and keep the full side of your hair visible.",
    icon: "arrow-forward-circle-outline",
  },
  {
    id: "back",
    label: "Back Photo",
    description:
      "Face away from the camera and keep the back of your head and neckline visible.",
    icon: "scan-outline",
  },
];

function HairProfileHeader({ onBack }) {
  return (
    <View className="mb-6 flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons name="arrow-back" size={24} color="#1677FF" />
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-bold text-app-text">
        Upload<Text className="text-app-primary">Profile</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function UploadHairProfile() {
  const router = useRouter();

  const [photosByAngle, setPhotosByAngle] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submittingRef = useRef(false);

  async function handleAddPhoto(angleId) {
    try {
      const image = await pickHairProfileImage();

      if (!image) {
        return;
      }

      setPhotosByAngle((currentPhotos) => ({
        ...currentPhotos,
        [angleId]: image,
      }));

      setErrorMessage("");
    } catch (error) {
      console.log("Error picking hair profile photo:", error);
      setErrorMessage("Could not add that photo. Please try again.");
    }
  }

  function handleRemovePhoto(angleId) {
    setPhotosByAngle((currentPhotos) => {
      const updatedPhotos = {
        ...currentPhotos,
      };

      delete updatedPhotos[angleId];

      return updatedPhotos;
    });

    setErrorMessage("");
  }

  async function handleSubmit() {
    if (submittingRef.current || loading) {
      return;
    }

    const selectedAngles = Object.keys(photosByAngle);

    if (selectedAngles.length === 0) {
      setErrorMessage("Please add at least one hair photo.");
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrorMessage("You must be logged in to analyze your hair.");
      return;
    }

    submittingRef.current = true;

    try {
      setLoading(true);
      setErrorMessage("");

const uploadResult = await uploadHairProfilePhotos({
  clientId: currentUser.uid,
  photosByAngle,
});

const result = await analyzeHairProfile({
  clientId: currentUser.uid,
  photoAngles: Object.keys(uploadResult.photos),
  sourcePhotos: uploadResult.photos,
});
  if (!result?.profileId) {
  throw new Error(
    "Analysis completed without returning a profile ID."
  );
}
      router.replace({
        pathname: "/client/hairProfile/results",
        params: {
          profileId: result.profileId,
        },
      });
    } catch (error) {
      console.log("Error analyzing hair profile:", error);

      setErrorMessage(
        "Could not analyze your hair profile. Please try again."
      );

      submittingRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  const photoCount = Object.keys(photosByAngle).length;
  const canSubmit = photoCount > 0 && !loading;

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HairProfileHeader onBack={() => router.back()} />

        <View className="rounded-3xl bg-app-surface p-6">
          <Text className="text-lg font-bold text-app-text">
            Recommendations
          </Text>

          <View className="mt-3">
            <Text className="text-base leading-6 text-app-text-secondary">
              • Clear photos
            </Text>
            <Text className="text-base leading-6 text-app-text-secondary">
              • Good lighting
            </Text>
            <Text className="text-base leading-6 text-app-text-secondary">
              • Full head visible in frame
            </Text>
          </View>

          <View className="mt-7">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-app-text">
                Your photos
              </Text>

              <Text className="text-sm font-semibold text-app-text-muted">
                {photoCount}/4 added
              </Text>
            </View>

            {PHOTO_ANGLES.map((angle) => {
              const photo = photosByAngle[angle.id];
              const hasPhoto = Boolean(photo);

              return (
                <View
                  key={angle.id}
                  className={`mb-4 overflow-hidden rounded-2xl border ${
                    hasPhoto
                      ? "border-app-primary bg-app-primary-soft"
                      : "border-app-border bg-app-surface"
                  }`}
                >
                  <View
                    className={`h-44 items-center justify-center ${
                      hasPhoto ? "bg-app-primary-soft" : "bg-app-surface-elevated"
                    }`}
                  >
                    {hasPhoto ? (
                      <>
                        <Image
                          source={{ uri: photo.uri }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />

                        <View className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-app-primary">
                          <Ionicons
                            name="checkmark"
                            size={22}
                            color="#FFFFFF"
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="h-14 w-14 items-center justify-center rounded-full bg-app-primary-soft">
                          <Ionicons
                            name={angle.icon}
                            size={28}
                            color="#1677FF"
                          />
                        </View>

                        <Text className="mt-3 text-sm font-semibold text-app-text-muted">
                          No photo added
                        </Text>
                      </>
                    )}
                  </View>

                  <View className="p-4">
                    <Text
                      className={`text-base font-bold ${
                        hasPhoto ? "text-app-primary" : "text-app-text"
                      }`}
                    >
                      {angle.label}
                    </Text>

                    <Text className="mt-1 text-sm leading-5 text-app-text-secondary">
                      {angle.description}
                    </Text>

                    <Pressable
                      onPress={() => {
                        if (hasPhoto) {
                          handleRemovePhoto(angle.id);
                          return;
                        }

                        handleAddPhoto(angle.id);
                      }}
                      disabled={loading}
                      className={`mt-4 flex-row items-center justify-center rounded-xl px-4 py-3 ${
                        hasPhoto
                          ? "border border-app-border bg-app-surface"
                          : "bg-app-primary"
                      } ${loading ? "opacity-60" : ""}`}
                    >
                      <Ionicons
                        name={
                          hasPhoto
                            ? "trash-outline"
                            : "images-outline"
                        }
                        size={19}
                        color={hasPhoto ? "#52657A" : "#FFFFFF"}
                      />

                      <Text
                        className={`ml-2 text-sm font-bold ${
                          hasPhoto ? "text-app-text-secondary" : "text-app-text-inverse"
                        }`}
                      >
                        {hasPhoto ? "Remove Photo" : "Add Photo"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="rounded-2xl bg-app-surface-elevated p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-app-text">
                Photos added
              </Text>

              <Text className="text-sm font-bold text-app-text-secondary">
                {photoCount} of 4
              </Text>
            </View>

            <View className="mt-3 h-2 overflow-hidden rounded-full bg-app-border">
              <View
                className="h-full rounded-full bg-app-primary"
                style={{
                  width: `${(photoCount / PHOTO_ANGLES.length) * 100}%`,
                }}
              />
            </View>

            <Text className="mt-2 text-sm leading-5 text-app-text-secondary">
              {photoCount === 4
                ? "All recommended photos have been added."
                : "Add all four angles for the most complete analysis."}
            </Text>
          </View>

          {errorMessage ? (
            <View className="mt-4 rounded-2xl bg-app-surface-elevated p-4">
              <Text className="text-sm font-semibold text-app-error">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className={`mt-6 flex-row items-center justify-center rounded-2xl px-5 py-4 ${
              canSubmit ? "bg-app-primary active:bg-app-primary-pressed" : "bg-app-disabled"
            }`}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text className="ml-2 text-center text-base font-bold text-app-text-inverse">
                  Analyzing...
                </Text>
              </>
            ) : (
              <>
                <Text className="text-center text-base font-bold text-app-text-inverse">
                  Submit Hair Analysis
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            className={`mt-3 rounded-2xl border border-app-border bg-app-surface px-5 py-4 active:bg-app-surface-elevated ${
              loading ? "opacity-50" : ""
            }`}
          >
            <Text className="text-center text-base font-semibold text-app-text">
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
