import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
  Pressable,
  Image,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@/components/icons/AppIcon";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../../../config/firebase";

const SEARCH_CACHE_KEY_PREFIX = "clientSearchCache";
const searchMemoryCache = new Map();

function getSearchCacheKey(uid) {
  return `${SEARCH_CACHE_KEY_PREFIX}:${uid}`;
}

function getBarberDisplayName(barber) {
  return (
    barber.businessName ||
    barber.barberName ||
    barber.fullName ||
    barber.name ||
    "Unnamed Barber"
  );
}

function getSearchableBarberText(barber) {
  return [
    getBarberDisplayName(barber),
    barber.businessName,
    barber.barberName,
    barber.fullName,
    barber.name,
    barber.location?.city,
    barber.location?.state,
    barber.location?.stateCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getBarberImageUrl(barber) {
  if (barber.profileImageUrl) {
    return barber.profileImageUrl;
  }

  if (Array.isArray(barber.portfolioImages)) {
    return barber.portfolioImages[0]?.url || "";
  }

  return "";
}

function BarberAvatar({ barber }) {
  const imageUrl = getBarberImageUrl(barber);
  const displayName = getBarberDisplayName(barber);

  return (
    <View className="h-16 w-16 overflow-hidden rounded-full bg-app-primary-soft">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text className="text-2xl font-bold text-app-text">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

function RatingStars({ rating = 0, reviewCount = 0 }) {
  const roundedRating = Math.round(Number(rating) || 0);

  return (
    <View className="mt-3 flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < roundedRating ? "star" : "star-outline"}
          size={16}
          color="#1677FF"
        />
      ))}

      <Text className="ml-2 text-sm font-semibold text-app-text-muted">
        ({reviewCount ?? 0})
      </Text>
    </View>
  );
}

export default function ClientSearch() {
  const router = useRouter();

  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBarbers = barbers.filter((barber) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return getSearchableBarberText(barber).includes(query);
  });

  function clickableBarberItem(barber) {
    router.push(`/client/barber/${barber.id}`);
  }

  const loadCachedSearchData = useCallback(async (uid) => {
    try {
      const memoryCache = searchMemoryCache.get(uid);

      if (memoryCache) {
        if (Array.isArray(memoryCache.barbers)) {
          setBarbers(memoryCache.barbers);
        }

        return true;
      }

      const cachedSearchData = await AsyncStorage.getItem(
        getSearchCacheKey(uid)
      );

      if (!cachedSearchData) {
        return false;
      }

      const parsedCache = JSON.parse(cachedSearchData);
      searchMemoryCache.set(uid, parsedCache);

      if (Array.isArray(parsedCache.barbers)) {
        setBarbers(parsedCache.barbers);
      }

      return true;
    } catch (error) {
      console.log("Load cached search data error:", error);
      return false;
    }
  }, []);

  const saveSearchCache = useCallback(async ({
    uid,
    barberList,
    loadedClientData,
  }) => {
    try {
      const cachePayload = {
        barbers: barberList,
        clientData: loadedClientData,
        cachedAt: Date.now(),
      };

      searchMemoryCache.set(uid, cachePayload);
      await AsyncStorage.setItem(
        getSearchCacheKey(uid),
        JSON.stringify(cachePayload)
      );
    } catch (error) {
      console.log("Save search cache error:", error);
    }
  }, []);

  const loadSearchData = useCallback(async ({
    showLoader = false,
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
        hasCachedData = await loadCachedSearchData(currentUser.uid);

        if (hasCachedData) {
          setLoading(false);
          return;
        }
      }

      if (showLoader) {
        setLoading(true);
      }

      // Reference to the logged-in client's specific document.
      const clientRef = doc(db, "clients", currentUser.uid);

      // Reference to the entire barbers collection.
      const barbersRef = collection(db, "barbers");

      // Fetch the client document and all barber documents together.
      const [clientSnap, barbersSnap] = await Promise.all([
        getDoc(clientRef),
        getDocs(barbersRef),
      ]);

      if (!clientSnap.exists()) {
        setErrorMessage("Client profile could not be found.");
        return;
      }

      const loadedClientData = clientSnap.data();

      const barberList = barbersSnap.docs.map((barberDoc) => ({
        id: barberDoc.id,
        ...barberDoc.data(),
      }));

      setBarbers(barberList);

      await saveSearchCache({
        uid: currentUser.uid,
        barberList,
        loadedClientData,
      });
    } catch (error) {
      console.log("Find barbers error:", error);

      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Something went wrong while loading barbers.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedSearchData, router, saveSearchCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSearchData({
      showErrorOnFailure: false,
    });
    setRefreshing(false);
  }, [loadSearchData]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadSearchData({
        showLoader: true,
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loadSearchData]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Finding barbers...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-xl font-bold text-app-text">
          Search Error
        </Text>

        <Text className="mt-2 text-center text-app-text-muted">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <FlatList
        data={filteredBarbers}
        keyExtractor={(item) => item.id}
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
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-3xl font-bold text-app-text">
              Find<Text className="text-app-primary">Barbers</Text>
            </Text>

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, city, or state"
              placeholderTextColor="#8292A6"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-4 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-3xl border border-app-border bg-app-surface p-5">
            <Text className="text-center text-app-text-muted">
              No barbers were found.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => clickableBarberItem(item)}>
            <View className="mb-4 flex-row items-center rounded-3xl border border-app-border bg-app-surface p-3">
              <BarberAvatar barber={item} />

              <View
                className="flex-1"
                style={{ marginLeft: 20 }}
              >
                <Text
                  numberOfLines={1}
                  className="text-xl font-bold text-app-text"
                >
                  {getBarberDisplayName(item)}
                </Text>

                <Text className="mt-1 text-app-text-muted">
                  {item.location?.city || "City not added"},{" "}
                  {item.location?.state || "State not added"}
                </Text>

                <Text
                  numberOfLines={2}
                  className="mt-2 text-app-text-secondary"
                >
                  {item.bio || "No bio added yet."}
                </Text>

                <RatingStars
                  rating={item.rating}
                  reviewCount={item.reviewCount}
                />
              </View>

              <Ionicons
                name="chevron-forward"
                size={26}
                color="#52657A"
              />
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
