import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { auth } from "../../../config/firebase";
import { getConversationsForUser } from "../../../services/messageService";
import ConversationCard from "../../../components/messaging/conversationCard";

const MESSAGES_CACHE_KEY_PREFIX = "barberMessagesCache";
const messagesMemoryCache = new Map();

function getMessagesCacheKey(barberId) {
  return `${MESSAGES_CACHE_KEY_PREFIX}:${barberId}`;
}

function reviveCachedTimestamp(value) {
  if (!value || value.toDate) {
    return value;
  }

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds !== "number") {
    return value;
  }

  const millis = seconds * 1000 + Math.floor(nanoseconds / 1000000);

  return {
    ...value,
    toDate: () => new Date(millis),
    toMillis: () => millis,
  };
}

function reviveCachedConversation(conversation) {
  const readState = conversation.readState
    ? Object.fromEntries(
        Object.entries(conversation.readState).map(([userId, timestamp]) => [
          userId,
          reviveCachedTimestamp(timestamp),
        ])
      )
    : conversation.readState;

  return {
    ...conversation,
    createdAt: reviveCachedTimestamp(conversation.createdAt),
    lastMessageAt: reviveCachedTimestamp(conversation.lastMessageAt),
    readState,
    updatedAt: reviveCachedTimestamp(conversation.updatedAt),
  };
}

export default function BarberMessagesScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(Boolean(currentUser?.uid));
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    currentUser?.uid ? "" : "You must be logged in to view messages."
  );

  const loadCachedConversations = useCallback(async (barberId) => {
    try {
      const memoryCache = messagesMemoryCache.get(barberId);

      if (memoryCache?.conversations) {
        setConversations(
          memoryCache.conversations.map(reviveCachedConversation)
        );
        return true;
      }

      const cachedMessages = await AsyncStorage.getItem(
        getMessagesCacheKey(barberId)
      );

      if (!cachedMessages) {
        return false;
      }

      const parsedCache = JSON.parse(cachedMessages);
      messagesMemoryCache.set(barberId, parsedCache);

      if (Array.isArray(parsedCache.conversations)) {
        setConversations(
          parsedCache.conversations.map(reviveCachedConversation)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.log("Load cached barber conversations error:", error);
      return false;
    }
  }, []);

  const saveConversationsCache = useCallback(async ({
    barberId,
    loadedConversations,
  }) => {
    try {
      const cachePayload = {
        conversations: loadedConversations,
        cachedAt: Date.now(),
      };

      messagesMemoryCache.set(barberId, cachePayload);
      await AsyncStorage.setItem(
        getMessagesCacheKey(barberId),
        JSON.stringify(cachePayload)
      );
    } catch (error) {
      console.log("Save barber conversations cache error:", error);
    }
  }, []);

  const loadConversationsData = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      if (!currentUser?.uid) {
        setErrorMessage("You must be logged in to view messages.");
        return;
      }

      setErrorMessage("");

      if (useCache) {
        hasCachedData = await loadCachedConversations(currentUser.uid);

        if (hasCachedData) {
          setLoading(false);
          return;
        }
      }

      if (showLoader) {
        setLoading(true);
      }

      const loadedConversations =
        await getConversationsForUser(currentUser.uid);

      setConversations(loadedConversations);
      await saveConversationsCache({
        barberId: currentUser.uid,
        loadedConversations,
      });
    } catch (error) {
      console.log("Load barber conversations error:", error);
      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Failed to load conversations.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    currentUser?.uid,
    loadCachedConversations,
    saveConversationsCache,
  ]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadConversationsData({
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loadConversationsData]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadConversationsData({
        showLoader: false,
        showErrorOnFailure: false,
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadConversationsData]);

  function openConversation(conversationId) {
    router.push(`/barber/conversation/${conversationId}`);
  }

function renderConversation({ item }) {
  const displayName =
    item.clientName ||
    "Client";

  return (
   <ConversationCard
  conversation={item}
  currentUserId={currentUser?.uid}
  displayName={displayName}
  secondaryName={item.businessName || item.barberName || null}
  avatarUrl={item.clientProfileImageUrl || item.profileImageUrl || ""}
  onPress={() => openConversation(item.id)}
/>
  );
}

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-app-text-muted">
          Loading messages...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Messages Unavailable
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-5 pb-3 pt-4">
        <Text className="text-3xl font-bold text-app-text">
          Mess<Text className="text-app-primary">ages</Text>
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerClassName="flex-grow px-5 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-xl font-bold text-app-text">
              No messages yet
            </Text>

            <Text className="mt-2 text-center text-base text-app-text-muted">
              When a client messages you, the conversation will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
