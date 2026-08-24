import {
  useCallback,
  useEffect,
  useRef,
  useState,
  } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { auth } from "../../../config/firebase";
import {
  getConversationById,
  getOlderConversationMessages,
  listenToRecentConversationMessages,
  sendMessage,
  markConversationRead,
} from "../../../services/messageService";
import {
  markConversationNotificationsRead,
} from "../../../services/notificationService";
import { useAppAlert } from "../../../context/AppAlertContext";

function mergeMessages(firstMessages, secondMessages) {
  const messageMap = new Map();

  [...firstMessages, ...secondMessages].forEach((message) => {
    messageMap.set(message.id, message);
  });

  return Array.from(messageMap.values()).sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;

    return aTime - bTime;
  });
}

export default function ClientConversationScreen() {
  const { showAppAlert } = useAppAlert();
  const router = useRouter();
  const { conversationId } = useLocalSearchParams();

  const listRef = useRef(null);
  const oldestMessageDocRef = useRef(null);
  const hasLoadedOlderMessagesRef = useRef(false);
  const shouldScrollToBottomRef = useRef(false);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;
useFocusEffect(
  useCallback(() => {
    if (
      !currentUser?.uid ||
      !conversationId ||
      Array.isArray(conversationId)
    ) {
      return;
    }

    Promise.all([
  markConversationRead(
    conversationId,
    currentUser.uid
  ),
  markConversationNotificationsRead(
    currentUser.uid,
    conversationId
  ),
]).catch((error) => {
  console.log(
    "Mark conversation and notifications read error:",
    error
  );
});
  }, [conversationId, currentUser?.uid])
);
  useEffect(() => {
    async function loadConversation() {
      try {
        setLoading(true);
        setErrorMessage("");

        if (!currentUser) {
          setErrorMessage("You must be logged in to view this conversation.");
          return;
        }

        if (!conversationId || Array.isArray(conversationId)) {
          setErrorMessage("A valid conversation ID was not provided.");
          return;
        }

        const loadedConversation = await getConversationById(conversationId);

        if (!loadedConversation) {
          setErrorMessage("This conversation could not be found.");
          return;
        }

        if (!loadedConversation.participants?.includes(currentUser.uid)) {
          setErrorMessage("You do not have access to this conversation.");
          return;
        }

        setConversation(loadedConversation);
      } catch (error) {
        console.log("Load conversation error:", error);
        setErrorMessage("Failed to load conversation.");
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [conversationId, currentUser]);

  useEffect(() => {
    if (!conversationId || Array.isArray(conversationId)) {
      return;
    }

    oldestMessageDocRef.current = null;
    hasLoadedOlderMessagesRef.current = false;

    const resetTimer = setTimeout(() => {
      setMessages([]);
      setHasMoreMessages(false);
    }, 0);

    const unsubscribe = listenToRecentConversationMessages(
      conversationId,
     (loadedMessages, pageInfo) => {
  shouldScrollToBottomRef.current = true;

  setMessages((currentMessages) =>
    mergeMessages(currentMessages, loadedMessages)
  );

  if (!hasLoadedOlderMessagesRef.current) {
    oldestMessageDocRef.current = pageInfo.oldestDoc;
    setHasMoreMessages(pageInfo.hasMore);
  }

  const latestMessage =
    loadedMessages[loadedMessages.length - 1];

  if (
    currentUser?.uid &&
    latestMessage &&
    latestMessage.senderId !== currentUser.uid
  ) {
  Promise.all([
  markConversationRead(
    conversationId,
    currentUser.uid
  ),
  markConversationNotificationsRead(
    currentUser.uid,
    conversationId
  ),
]).catch((error) => {
  console.log(
    "Mark incoming message and notification read error:",
    error
  );
});
  }

  setTimeout(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, 100);
},
      (error) => {
        console.log("Listen to messages error:", error);
        setErrorMessage("Failed to load messages.");
      }
    );

    return () => {
      clearTimeout(resetTimer);
      unsubscribe();
    };
  }, [conversationId,currentUser?.uid]);

  async function handleLoadOlderMessages() {
    if (
      loadingOlderMessages ||
      !hasMoreMessages ||
      !oldestMessageDocRef.current ||
      !conversationId ||
      Array.isArray(conversationId)
    ) {
      return;
    }

    try {
      setLoadingOlderMessages(true);
      shouldScrollToBottomRef.current = false;

      const olderPage = await getOlderConversationMessages({
        conversationId,
        oldestMessageDoc: oldestMessageDocRef.current,
      });

      if (olderPage.messages.length > 0) {
        hasLoadedOlderMessagesRef.current = true;
        oldestMessageDocRef.current = olderPage.oldestDoc;
        setMessages((currentMessages) =>
          mergeMessages(olderPage.messages, currentMessages)
        );
      }

      setHasMoreMessages(olderPage.hasMore);
    } catch (error) {
      console.log("Load older client messages error:", error);
      setErrorMessage("Failed to load older messages.");
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  async function handleSendMessage() {
    try {
      const trimmedText = messageText.trim();

      if (!currentUser) {
        showAppAlert("Login required", "You must be logged in to send messages.");
        return;
      }

      if (!conversationId || Array.isArray(conversationId)) {
        showAppAlert("Missing conversation", "Could not find this conversation.");
        return;
      }

      if (!trimmedText) {
        return;
      }

      setSending(true);

      await sendMessage({
        conversationId,
        senderId: currentUser.uid,
        senderName:
          conversation?.clientName ||
          currentUser.displayName ||
          "Client",
        text: trimmedText,
      });

      setMessageText("");
    } catch (error) {
      console.log("Send message error:", error);
      showAppAlert("Message failed", "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }) {
    const isMyMessage = item.senderId === currentUser?.uid;

    return (
      <View
        style={{
          alignSelf: isMyMessage ? "flex-end" : "flex-start",
          maxWidth: "80%",
        }}
        className={`mb-3 rounded-2xl px-4 py-3 ${
          isMyMessage
            ? "bg-app-primary"
            : "bg-app-surface-elevated"
        }`}
      >
        <Text
          className={`text-base font-semibold ${
            isMyMessage
              ? "text-app-text-inverse"
              : "text-app-text"
          }`}
        >
          {item.text}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-app-text-muted">
          Loading conversation...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !conversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Conversation Not Found
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage || "This conversation could not be loaded."}
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-8 rounded-2xl bg-app-primary px-6 py-4 active:bg-app-primary-pressed"
        >
          <Text className="font-bold text-app-text-inverse">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View className="border-b border-app-border-subtle px-5 py-4">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
            >
              <Ionicons name="arrow-back" size={24} color="#1677FF" />
            </Pressable>

            <Text className="flex-1 text-center text-xl font-bold text-app-text">
              {conversation.businessName ||
                conversation.barberName ||
                "Barber"}
            </Text>

            <View className="h-11 w-11" />
          </View>

          {conversation.businessName && conversation.barberName ? (
            <Text className="mt-1 text-center text-sm text-app-text-muted">
              {conversation.barberName}
            </Text>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerClassName="flex-grow px-5 py-4"
          ListHeaderComponent={
            loadingOlderMessages ? (
              <View className="items-center pb-3">
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-base text-app-text-muted">
                No messages yet. Send the first message.
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            if (shouldScrollToBottomRef.current) {
              shouldScrollToBottomRef.current = false;
              listRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y <= 24) {
              handleLoadOlderMessages();
            }
          }}
          scrollEventThrottle={16}
        />

        <View className="border-t border-app-border-subtle bg-app-background px-4 py-3">
          <View className="flex-row items-end rounded-2xl border border-app-border bg-app-surface px-4 py-2">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor="#8292A6"
              multiline
              className="max-h-28 flex-1 py-2 text-base text-app-text"
            />

            <Pressable
              onPress={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className={`ml-3 h-11 w-11 items-center justify-center rounded-full ${
                sending || !messageText.trim()
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              {sending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
