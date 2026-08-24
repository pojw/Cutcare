import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../../../config/firebase";

const PROFILE_CACHE_KEY_PREFIX = "barberProfileCache";
const profileMemoryCache = new Map();

function getProfileCacheKey(barberId) {
  return `${PROFILE_CACHE_KEY_PREFIX}:${barberId}`;
}

const PAYMENT_OPTION_LABELS = {
  cash: "Cash",
  venmo: "Venmo",
  cash_app: "Cash App",
  zelle: "Zelle",
  apple_pay: "Apple Pay",
  card: "Card",
};

function InfoRow({ label, value, compact = false }) {
  return (
    <View className={compact ? "" : "mb-5"}>
      <Text className="mb-1 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <Text className="text-base font-semibold text-app-text">
        {value === undefined || value === null || value === ""
          ? "Not added yet"
          : String(value)}
      </Text>
    </View>
  );
}

function InfoPair({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <View className="mb-5 flex-row gap-4">
      <View className="flex-1">
        <InfoRow label={leftLabel} value={leftValue} compact />
      </View>

      <View className="flex-1">
        <InfoRow label={rightLabel} value={rightValue} compact />
      </View>
    </View>
  );
}

function PaymentOptionsSection({ acceptedPayments }) {
  const safePayments = Array.isArray(acceptedPayments)
    ? acceptedPayments
    : [];

  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        Accepted Payments
      </Text>

      {safePayments.length === 0 ? (
        <Text className="text-base font-semibold text-app-text">
          Not added yet
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {safePayments.map((paymentId) => (
            <View
              key={paymentId}
              className="rounded-full bg-app-primary-soft px-3 py-2"
            >
              <Text className="text-sm font-semibold text-app-primary">
                {PAYMENT_OPTION_LABELS[paymentId] || paymentId}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function BarberProfile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [barberData, setBarberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCachedProfile = useCallback(async (barberId) => {
    try {
      const memoryCache = profileMemoryCache.get(barberId);

      if (memoryCache) {
        setUserData(memoryCache.userData || null);
        setBarberData(memoryCache.barberData || null);
        return true;
      }

      const cachedProfile = await AsyncStorage.getItem(
        getProfileCacheKey(barberId)
      );

      if (!cachedProfile) {
        return false;
      }

      const parsedCache = JSON.parse(cachedProfile);
      profileMemoryCache.set(barberId, parsedCache);
      setUserData(parsedCache.userData || null);
      setBarberData(parsedCache.barberData || null);

      return true;
    } catch (error) {
      console.log("Load cached barber profile error:", error);
      return false;
    }
  }, []);

  const saveProfileCache = useCallback(async ({
    barberId,
    loadedUserData,
    loadedBarberData,
  }) => {
    try {
      const cachePayload = {
        userData: loadedUserData,
        barberData: loadedBarberData,
        cachedAt: Date.now(),
      };

      profileMemoryCache.set(barberId, cachePayload);
      await AsyncStorage.setItem(
        getProfileCacheKey(barberId),
        JSON.stringify(cachePayload)
      );
    } catch (error) {
      console.log("Save barber profile cache error:", error);
    }
  }, []);

  const loadProfile = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setErrorMessage("");

      if (useCache) {
        hasCachedData = await loadCachedProfile(currentUser.uid);

        if (hasCachedData) {
          setLoading(false);
          return;
        }
      }

      if (showLoader) {
        setLoading(true);
      }

      const userRef = doc(db, "users", currentUser.uid);
      const barberRef = doc(db, "barbers", currentUser.uid);

      const [userSnap, barberSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(barberRef),
      ]);

      if (!userSnap.exists()) {
        setErrorMessage("User account data could not be found.");
        return;
      }

      if (!barberSnap.exists()) {
        setErrorMessage("Barber profile data could not be found.");
        return;
      }

      const loadedUserData = userSnap.data();
      const loadedBarberData = barberSnap.data();

      setUserData(loadedUserData);
      setBarberData(loadedBarberData);
      await saveProfileCache({
        barberId: currentUser.uid,
        loadedUserData,
        loadedBarberData,
      });
    } catch (error) {
      console.log("Barber profile load error:", error);
      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Something went wrong while loading your profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedProfile, router, saveProfileCache]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadProfile({
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadProfile({
        showLoader: false,
        showErrorOnFailure: false,
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Profile Error
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage}
        </Text>

      </SafeAreaView>
    );
  }

  const profileName =
    barberData?.businessName ||
    userData?.fullName ||
    "Barber";
  const city = barberData?.location?.city;
  const state = barberData?.location?.state;
  const locationText =
    city && state
      ? `${city}, ${state}`
      : city || state || "Location not added";
  const profileImageUrl =
    barberData?.profileImageUrl ||
    userData?.profileImageUrl ||
    "";
  const profileInitial = profileName.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
      >
        <View className="mb-8 flex-row items-start justify-between">
          <Text className="text-3xl font-bold text-app-text">
            Barber<Text className="text-app-primary">Profile</Text>
          </Text>

          <Pressable
            onPress={() => router.push("/barber/settings")}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color="#1677FF"
            />
          </Pressable>
        </View>

        <View className="mb-8 items-center self-center" style={{ width: "88%" }}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
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

          <Text className="mt-4 text-center text-2xl font-bold text-app-text">
            {profileName}
          </Text>
        </View>

        <View className="mb-6 self-center" style={{ width: "88%" }}>
          <InfoPair
            leftLabel="Full Name"
            leftValue={userData?.fullName}
            rightLabel="Phone"
            rightValue={barberData?.phone}
          />

          <InfoRow label="Location" value={locationText} />

          <PaymentOptionsSection
            acceptedPayments={barberData?.acceptedPayments}
          />

          <InfoRow label="Bio" value={barberData?.bio} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
