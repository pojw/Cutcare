import { useState } from "react";
import { Image,
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import CenterScreen from "../../components/centerScreen";
import LocationPicker from "../../components/location/LocationPicker";
import { useAppAlert } from "../../context/AppAlertContext";

import { auth, db } from "../../config/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import {
  pickImage,
  uploadBarberPortfolioImage,
  uploadBarberProfileImage,
} from "../../services/barberImageService";

const MAX_ONBOARDING_PORTFOLIO_IMAGES = 4;
const PAYMENT_OPTIONS = [
  { id: "cash", label: "Cash" },
  { id: "venmo", label: "Venmo" },
  { id: "cash_app", label: "Cash App" },
  { id: "zelle", label: "Zelle" },
  { id: "apple_pay", label: "Apple Pay" },
  { id: "card", label: "Card" },
];

export default function BarberOnboarding() {
  const { showAppAlert } = useAppAlert();
  const { refreshUserData } = useAuth();
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState({
    city: "",
    state: "",
    stateCode: "",
    countryCode: "US",
  });
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [acceptedPayments, setAcceptedPayments] = useState([]);

  function togglePaymentOption(paymentId) {
    setAcceptedPayments((currentPayments) => {
      if (currentPayments.includes(paymentId)) {
        return currentPayments.filter((id) => id !== paymentId);
      }

      return [...currentPayments, paymentId];
    });
  }

  async function handlePickProfileImage() {
    try {
      const selectedImage = await pickImage({
        aspect: [1, 1],
      });

      setProfileImage(selectedImage);
    } catch (error) {
      if (error.message === "Image selection was canceled.") {
        return;
      }

      console.log("Pick barber profile image error:", error);
      showAppAlert("Image error", "Could not select that image.");
    }
  }

  async function handleAddPortfolioImage() {
    if (portfolioImages.length >= MAX_ONBOARDING_PORTFOLIO_IMAGES) {
      showAppAlert(
        "Portfolio limit reached",
        `You can add up to ${MAX_ONBOARDING_PORTFOLIO_IMAGES} images during setup.`
      );
      return;
    }

    try {
      const selectedImage = await pickImage();

      setPortfolioImages((currentImages) => [
        ...currentImages,
        {
          ...selectedImage,
          id: `${Date.now()}-${currentImages.length}`,
        },
      ]);
    } catch (error) {
      if (error.message === "Image selection was canceled.") {
        return;
      }

      console.log("Pick barber portfolio image error:", error);
      showAppAlert("Image error", "Could not select that image.");
    }
  }

  function handleRemovePortfolioImage(imageId) {
    setPortfolioImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId)
    );
  }

  async function handleFinish() {
    const user = auth.currentUser;

    if (!user) {
      showAppAlert("Error", "No logged-in user found.");
      return;
    }

    if (!businessName || !phone || !location.city || !location.stateCode) {
      showAppAlert("Missing information", "Please fill out the required fields.");
      return;
    }

    if (acceptedPayments.length === 0) {
      showAppAlert(
        "Payment option required",
        "Please select at least one accepted payment option."
      );
      return;
    }

    try {
      await setDoc(doc(db, "barbers", user.uid), {
        userId: user.uid,
        businessName: businessName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        location: {
          city: location.city,
          state: location.state,
          stateCode: location.stateCode,
          countryCode: "US",
        },
        services: [],
        specialties: [],
        acceptedPayments,
        portfolioImages: [],
        availability: {},
        googleCalendarConnected: false,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (profileImage?.uri) {
        await uploadBarberProfileImage({
          barberId: user.uid,
          imageUri: profileImage.uri,
          mimeType: profileImage.mimeType,
        });
      }

      if (portfolioImages.length > 0) {
        await Promise.all(
          portfolioImages.map((image) =>
            uploadBarberPortfolioImage({
              barberId: user.uid,
              imageUri: image.uri,
              mimeType: image.mimeType,
            })
          )
        );
      }

      await updateDoc(doc(db, "users", user.uid), {
        role: "barber",
        onboarded: true,
        updatedAt: serverTimestamp(),
      });
      await refreshUserData();

      router.replace("/barber/dashboard");
    } catch (error) {
      console.log(error);
      showAppAlert("Barber setup failed", error.message);
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
            Barber<Text className="text-app-primary">Setup</Text>
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
                    {(businessName || "B").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text className="mt-3 text-sm font-semibold text-app-primary">
                {profileImage?.uri
                  ? "Change Profile Photo"
                  : "Add Profile Photo"}
              </Text>

              <Text className="mt-1 text-xs font-semibold text-app-text-muted">
                (Optional)
              </Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Business name
            </Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Jaylin Cuts"
              placeholderTextColor="#8292A6"
              autoCapitalize="words"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="765-123-4567"
              placeholderTextColor="#8292A6"
              keyboardType="phone-pad"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <LocationPicker value={location} onChange={setLocation} />

          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell clients about your services..."
              placeholderTextColor="#8292A6"
              multiline
              textAlignVertical="top"
              className="min-h-24 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Payment Options
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((paymentOption) => {
                const isSelected = acceptedPayments.includes(
                  paymentOption.id
                );

                return (
                  <Pressable
                    key={paymentOption.id}
                    onPress={() => togglePaymentOption(paymentOption.id)}
                    className={`rounded-full border px-4 py-2 ${
                      isSelected
                        ? "border-app-primary bg-app-primary"
                        : "border-app-border bg-app-surface-elevated"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected
                          ? "text-app-text-inverse"
                          : "text-app-text-secondary"
                      }`}
                    >
                      {paymentOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-app-text-secondary">
                Portfolio Images
              </Text>

              <Text className="text-xs font-semibold text-app-text-muted">
                (Optional)
              </Text>
            </View>

            {portfolioImages.length > 0 ? (
              <View className="flex-row flex-wrap gap-3">
                {portfolioImages.map((image) => (
                  <View key={image.id} className="relative">
                    <Image
                      source={{ uri: image.uri }}
                      style={{ width: 88, height: 88, borderRadius: 14 }}
                      className="bg-app-surface-elevated"
                    />

                    <Pressable
                      onPress={() => handleRemovePortfolioImage(image.id)}
                      style={{
                        position: "absolute",
                        right: 4,
                        top: 4,
                        width: 20,
                        height: 20,
                        borderRadius: 16,
                      }}
                      className="items-center justify-center bg-app-primary"
                    >
                      <Text className="text-sm font-bold text-app-text-inverse">
                        X
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View className="rounded-2xl bg-app-surface-elevated px-4 py-5">
                <Text className="text-center text-sm text-app-text-muted">
                  Add a few haircut photos clients can preview.
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleAddPortfolioImage}
              disabled={
                portfolioImages.length >= MAX_ONBOARDING_PORTFOLIO_IMAGES
              }
              className={
                portfolioImages.length >= MAX_ONBOARDING_PORTFOLIO_IMAGES
                  ? "mt-3 rounded-xl bg-app-disabled px-4 py-3"
                  : "mt-3 rounded-xl bg-app-primary-soft px-4 py-3 active:bg-app-surface-elevated"
              }
            >
              <Text className="text-center text-sm font-semibold text-app-primary">
                Add Portfolio Image
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleFinish}
            className="rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              Finish Barber Setup
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
