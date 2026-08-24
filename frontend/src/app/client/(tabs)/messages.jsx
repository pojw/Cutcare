import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../config/firebase";
import {
  getConversationsForUser,
} from "../../../services/messageService";
import ConversationCard from "../../../components/messaging/conversationCard";
import AccountRequiredModal from "../../../components/AccountRequiredModal";

const MESSAGES_CACHE_KEY_PREFIX = "clientMessagesCache";
const messagesMemoryCache = new Map();

function getMessagesCacheKey(uid) {
  return `${MESSAGES_CACHE_KEY_PREFIX}:${uid}`;
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

function getBarberImageUrl(barber) {
  if (barber.profileImageUrl) {
    return barber.profileImageUrl;
  }

  if (Array.isArray(barber.portfolioImages)) {
    return barber.portfolioImages[0]?.url || "";
  }

  return "";
}

async function addBarberProfileImages(conversations) {
  return Promise.all(
    conversations.map(async (conversation) => {
      if (conversation.barberProfileImageUrl || !conversation.barberId) {
        return conversation;
      }

      try {
        const barberRef = doc(db, "barbers", conversation.barberId);
        const barberSnap = await getDoc(barberRef);

        if (!barberSnap.exists()) {
          return conversation;
        }

        return {
          ...conversation,
          barberProfileImageUrl: getBarberImageUrl(barberSnap.data()),
        };
      } catch (error) {
        console.log("Load conversation barber image error:", error);
        return conversation;
      }
    })
  );
}

export default function ClientMessagesScreen() {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  const currentUser = auth.currentUser;
  const isGuest = Boolean(currentUser?.isAnonymous);

  const loadCachedConversations = useCallback(async (uid) => {
    try {
      const memoryCache = messagesMemoryCache.get(uid);

      if (memoryCache?.conversations) {
        setConversations(
          memoryCache.conversations.map(reviveCachedConversation)
        );
        return true;
      }

      const cachedMessages = await AsyncStorage.getItem(
        getMessagesCacheKey(uid)
      );

      if (!cachedMessages) {
        return false;
      }

      const parsedCache = JSON.parse(cachedMessages);
      messagesMemoryCache.set(uid, parsedCache);

      if (Array.isArray(parsedCache.conversations)) {
        setConversations(
          parsedCache.conversations.map(reviveCachedConversation)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.log("Load cached conversations error:", error);
      return false;
    }
  }, []);

  const saveConversationsCache = useCallback(async ({
    uid,
    loadedConversations,
  }) => {
    try {
      const cachePayload = {
        conversations: loadedConversations,
        cachedAt: Date.now(),
      };

      messagesMemoryCache.set(uid, cachePayload);
      await AsyncStorage.setItem(
        getMessagesCacheKey(uid),
        JSON.stringify(cachePayload)
      );
    } catch (error) {
      console.log("Save conversations cache error:", error);
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
      const conversationsWithImages =
        await addBarberProfileImages(loadedConversations);

      setConversations(conversationsWithImages);

      await saveConversationsCache({
        uid: currentUser.uid,
        loadedConversations: conversationsWithImages,
      });
    } catch (error) {
      console.log("Load client conversations error:", error);

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

  useEffect(() => {
    if (isGuest) {
      return;
    }

    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) {
        return;
      }

      loadConversationsData({
        showLoader: true,
        useCache: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [isGuest, loadConversationsData]);

  function openConversation(conversationId) {
    router.push(`/client/conversation/${conversationId}`);
  }

function renderConversation({ item }) {
  return (
   <ConversationCard
  conversation={item}
  currentUserId={currentUser?.uid}
  displayName={
    item.businessName ||
    item.barberName ||
    "Barber"
  }
  secondaryName={
    item.businessName && item.barberName
      ? item.barberName
      : null
  }
  avatarUrl={item.barberProfileImageUrl || item.profileImageUrl || ""}
  onPress={() => openConversation(item.id)}
/>
  );
}

  if (isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-app-background px-6 py-6">
        <Text className="text-3xl font-bold text-app-text">
          Mess<Text className="text-app-primary">ages</Text>
        </Text>

        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-xl font-bold text-app-text">
            Create an account to message barbers
          </Text>

          <Text className="mt-3 text-center text-base leading-6 text-app-text-muted">
            Your guest browsing can become a full client account in one step.
          </Text>

          <Pressable
            onPress={() => setAccountModalVisible(true)}
            className="mt-6 rounded-2xl bg-app-primary px-6 py-4 active:bg-app-primary-pressed"
          >
            <Text className="font-bold text-app-text-inverse">
              Create Account
            </Text>
          </Pressable>
        </View>

        <AccountRequiredModal
          visible={accountModalVisible}
          detail="Create an account to message barbers and keep your conversations."
          onClose={() => setAccountModalVisible(false)}
        />
      </SafeAreaView>
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
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerClassName="flex-grow px-6 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-3xl font-bold text-app-text">
              Mess<Text className="text-app-primary">ages</Text>
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-xl font-bold text-app-text">
              No messages yet
            </Text>

            <Text className="mt-2 text-center text-base text-app-text-muted">
              Open a barber profile and tap Message Barber to start a conversation.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
