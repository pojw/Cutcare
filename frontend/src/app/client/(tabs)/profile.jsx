import { useCallback, useEffect, useState } from "react";
import {
  Image,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import AccountRequiredModal from "../../../components/AccountRequiredModal";
import { useAuth } from "../../../context/AuthContext";

const PROFILE_CACHE_KEY_PREFIX = "clientProfileCache";

function getProfileCacheKey(uid) {
  return `${PROFILE_CACHE_KEY_PREFIX}:${uid}`;
}

function InfoRow({ label, value }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-app-text-muted">{label}</Text>
      <Text className="text-base font-medium text-app-text">
        {value || "Not added yet"}
      </Text>
    </View>
  );
}

function ListSection({ label, items }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">{label}</Text>

      {safeItems.length === 0 ? (
        <Text className="text-base text-app-text-secondary">None added yet</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {safeItems.map((item, index) => (
            <View
              key={`${item}-${index}`}
              className="rounded-full bg-app-primary-soft px-3 py-2"
            >
              <Text className="text-sm font-medium text-app-primary">{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ClientProfile() {
  const router = useRouter();
  const { logout } = useAuth();

  const [userData, setUserData] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadCachedProfile = useCallback(async (uid) => {
    try {
      const cachedProfile = await AsyncStorage.getItem(
        getProfileCacheKey(uid)
      );

      if (!cachedProfile) {
        return false;
      }

      const parsedCache = JSON.parse(cachedProfile);

      setUserData(parsedCache.userData || null);
      setClientData(parsedCache.clientData || null);

      return true;
    } catch (error) {
      console.log("Load cached client profile error:", error);
      return false;
    }
  }, []);

  const saveProfileCache = useCallback(async ({
    uid,
    loadedUserData,
    loadedClientData,
  }) => {
    try {
      await AsyncStorage.setItem(
        getProfileCacheKey(uid),
        JSON.stringify({
          userData: loadedUserData,
          clientData: loadedClientData,
          cachedAt: Date.now(),
        })
      );
    } catch (error) {
      console.log("Save client profile cache error:", error);
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

      if (showLoader) {
        setLoading(true);
      }

      setErrorMessage("");

      if (useCache) {
        hasCachedData = await loadCachedProfile(currentUser.uid);

        if (hasCachedData) {
          setLoading(false);
        }
      }

      const userRef = doc(db, "users", currentUser.uid);
      const clientRef = doc(db, "clients", currentUser.uid);

      const [userSnap, clientSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(clientRef),
      ]);

      if (!userSnap.exists()) {
        setErrorMessage("User account data could not be found.");
        return;
      }

      if (!clientSnap.exists()) {
        setErrorMessage("Client profile data could not be found.");
        return;
      }

      const loadedUserData = userSnap.data();
      const loadedClientData = clientSnap.data();

      setUserData(loadedUserData);
      setClientData(loadedClientData);

      await saveProfileCache({
        uid: currentUser.uid,
        loadedUserData,
        loadedClientData,
      });
    } catch (error) {
      console.log("Client profile load error:", error);

      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Something went wrong while loading your profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedProfile, router, saveProfileCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile({
      showLoader: false,
      showErrorOnFailure: false,
    });
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProfile({
        showLoader: true,
        useCache: true,
      });
    });

    return () => clearTimeout(timeoutId);
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
    clientData?.preferredName ||
    userData?.fullName ||
    "Client";
  const city = clientData?.location?.city;
  const state = clientData?.location?.state;
  const locationText =
    city && state
      ? `${city}, ${state}`
      : city || state || "Location not added";
  const profileImageUrl =
    clientData?.profileImageUrl ||
    userData?.profileImageUrl ||
    "";
  const profileInitial = profileName
    .trim()
    .charAt(0)
    .toUpperCase();
  const isGuest = Boolean(userData?.isGuest || auth.currentUser?.isAnonymous);

  function requireAccount() {
    setAccountModalVisible(true);
  }

  async function handleGuestLogout() {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/login");
    } catch (error) {
      console.log("Guest logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
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
            Client<Text className="text-app-primary">Profile</Text>
          </Text>

          <Pressable
            onPress={() => {
              if (isGuest) {
                requireAccount();
                return;
              }

              router.push("/client/settings");
            }}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:opacity-80"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color="#1677FF"
            />
          </Pressable>
        </View>

        <View className="mb-8 items-center">
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

          <Text className="mt-4 text-2xl font-bold text-app-text">
            {profileName}
          </Text>
        </View>

        <View className="mb-6 rounded-3xl bg-app-surface p-5">
          <InfoRow label="Preferred Name" value={clientData?.preferredName} />

          <ListSection
            label="Favorite Barbers"
            items={clientData?.favoriteBarbers}
          />

          <InfoRow label="Location" value={locationText} />
        </View>

        {isGuest ? (
          <View className="items-center">
            <Pressable
              onPress={requireAccount}
              className="rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
              style={{ width: "88%" }}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                Create Account
              </Text>
            </Pressable>

            <Pressable
              onPress={handleGuestLogout}
              disabled={loggingOut}
              className={`mt-4 rounded-2xl border border-app-border px-4 py-4 active:opacity-80 ${
                loggingOut ? "bg-app-disabled" : "bg-app-surface"
              }`}
              style={{ width: "88%" }}
            >
              <Text className="text-center text-base font-bold text-app-text-muted">
                {loggingOut ? "Logging Out..." : "Log Out"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <AccountRequiredModal
          visible={accountModalVisible}
          detail="Create an account to edit your profile, save preferences, and keep your activity."
          onClose={() => setAccountModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
