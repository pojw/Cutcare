import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@/components/icons/AppIcon";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../config/firebase";
import { getBarberClients } from "../../services/barberClientService";

const CLIENT_LIST_CACHE_KEY_PREFIX = "barberClientListCache";
const clientListMemoryCache = new Map();

function getClientListCacheKey(barberId) {
  return `${CLIENT_LIST_CACHE_KEY_PREFIX}:${barberId}`;
}

function normalizeClientForCache(client) {
  return {
    ...client,
    createdAt: null,
    updatedAt: null,
    privateNote: client.privateNote
      ? {
          body: client.privateNote.body || "",
          updatedAt: null,
        }
      : null,
  };
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getLocationText(location) {
  if (!location) {
    return "Location not added";
  }

  const city = location.city || "";
  const state = location.state || "";

  return [city, state].filter(Boolean).join(", ") || "Location not added";
}

function formatDateLong(dateString) {
  if (!dateString) {
    return "No booking date";
  }

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function ClientAvatar({ client, size = 52 }) {
  const displayName = client.clientName || "Client";

  if (client.clientProfileImageUrl) {
    return (
      <Image
        source={{ uri: client.clientProfileImageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
      className="items-center justify-center bg-app-primary-soft"
    >
      <Text className="text-xl font-bold text-app-primary">
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function StatPill({ label, value }) {
  return (
    <View className="flex-1 rounded-2xl bg-app-surface-elevated px-4 py-3">
      <Text className="text-xs font-semibold uppercase text-app-text-muted">
        {label}
      </Text>

      <Text className="mt-1 text-base font-bold text-app-text">
        {value}
      </Text>
    </View>
  );
}

function ClientCard({ client, onPress }) {
  return (
    <Pressable
      onPress={() => onPress(client)}
      className="rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-center">
        <ClientAvatar client={client} />

        <View className="ml-4 flex-1">
          <Text
            numberOfLines={1}
            className="text-lg font-bold text-app-text"
          >
            {client.clientName || "Client"}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#8292A6"
        />
      </View>
    </Pressable>
  );
}

function DetailRow({ label, value }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <Text className="text-base font-medium text-app-text">
        {value || "Not added"}
      </Text>
    </View>
  );
}

function ClientContactModal({
  visible,
  client,
  onClose,
}) {
  if (!client) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="max-h-[85%] w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row flex-1 items-center pr-4">
              <ClientAvatar client={client} size={58} />

              <View className="ml-4 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-xl font-bold text-app-text"
                >
                  {client.clientName || "Client"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
            >
              <Text className="text-base font-bold text-app-primary">
                X
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="mt-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row gap-3">
              <StatPill
                label="Booked"
                value={client.amountsBooked || 0}
              />

              <StatPill
                label="Paid"
                value={formatMoney(client.amountPayed)}
              />
            </View>

            <View className="mt-5 rounded-2xl bg-app-surface-elevated p-4">
              <DetailRow
                label="Email"
                value={client.clientEmail || "Email not added"}
              />

              <DetailRow
                label="Location"
                value={getLocationText(client.clientLocation)}
              />

              <DetailRow
                label="Last Booking"
                value={formatDateLong(client.lastBookedAt)}
              />

              <View>
                <Text className="mb-1 text-sm font-semibold text-app-text-muted">
                  Private Note
                </Text>

                <Text className="text-base font-medium text-app-text">
                  {client.privateNote?.body?.trim() ||
                    "No private note yet."}
                </Text>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BarberClientsScreen() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCachedClients = useCallback(async (barberId) => {
    try {
      const memoryCache = clientListMemoryCache.get(barberId);

      if (memoryCache?.clients) {
        setClients(memoryCache.clients);
        return true;
      }

      const cachedClients = await AsyncStorage.getItem(
        getClientListCacheKey(barberId)
      );

      if (!cachedClients) {
        return false;
      }

      const parsedCache = JSON.parse(cachedClients);
      clientListMemoryCache.set(barberId, parsedCache);

      setClients(parsedCache.clients || []);

      return true;
    } catch (error) {
      console.log("Load cached barber clients error:", error);
      return false;
    }
  }, []);

  const saveClientsCache = useCallback(async ({
    barberId,
    loadedClients,
  }) => {
    try {
      const cachePayload = {
        clients: loadedClients.map(normalizeClientForCache),
        cachedAt: Date.now(),
      };

      clientListMemoryCache.set(barberId, cachePayload);
      await AsyncStorage.setItem(
        getClientListCacheKey(barberId),
        JSON.stringify(cachePayload)
      );
    } catch (error) {
      console.log("Save barber clients cache error:", error);
    }
  }, []);

  const loadClients = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMessage("You must be logged in to view clients.");
        return;
      }

      setErrorMessage("");
      if (useCache) {
        hasCachedData = await loadCachedClients(currentUser.uid);

        if (hasCachedData) {
          setLoading(false);
          return;
        }
      }

      if (showLoader) {
        setLoading(true);
      }

      const barberClients = await getBarberClients(currentUser.uid);
      setClients(barberClients);

      await saveClientsCache({
        barberId: currentUser.uid,
        loadedClients: barberClients,
      });
    } catch (error) {
      console.log("Load barber clients error:", error);

      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Could not load clients. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedClients, saveClientsCache]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadClients({
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loadClients]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadClients({
      showLoader: false,
      showErrorOnFailure: false,
    });
    setRefreshing(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-app-text-secondary">
          Loading clients...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-6 py-6">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#1677FF"
            />
          </Pressable>

          <Text className="flex-1 text-center text-3xl font-bold text-app-text">
            Client<Text className="text-app-primary">List</Text>
          </Text>

          <View className="h-11 w-11" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {errorMessage ? (
          <View className="rounded-2xl border border-app-border bg-app-surface p-4">
            <Text className="text-base font-semibold text-app-error">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View className="gap-3">
          {clients.length === 0 ? (
            <View className="rounded-2xl border border-app-border bg-app-surface p-5">
              <Text className="text-lg font-bold text-app-text">
                No clients yet
              </Text>

              <Text className="mt-2 text-sm text-app-text-secondary">
                Confirmed clients will show here after bookings.
              </Text>
            </View>
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onPress={setSelectedClient}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ClientContactModal
        visible={Boolean(selectedClient)}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />
    </SafeAreaView>
  );
}
