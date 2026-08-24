import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useState ,useEffect , useRef,
} from "react";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@/components/icons/AppIcon";
import { sendChatRecommendation } from "../../services/aiChatService";
import { auth } from "../../config/firebase";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {createClientNote}from "../../services/clientNotesService"
import { getClientHairProfileState } from "../../services/hairProfileService";
import { useAppAlert } from "../../context/AppAlertContext";
function ChatBubble({
  message,
  onPinToNotes,
  pinnedMessageIds,
}) {
  const isUser = message.role === "user";
const isPinned =
  pinnedMessageIds.has(message.id);
  const canShowActions =
    message.role === "assistant" &&
    message.id !== "welcome-message";

  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(message.text);

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  }

  return (
    <View
      className={`mb-3 max-w-[75%] ${
        isUser
          ? "self-end items-end"
          : "self-start items-start"
      }`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-md bg-app-primary"
            : "rounded-bl-md bg-app-primary"
        }`}
      >
        <Text
          className="text-base font-semibold leading-6 text-app-text-inverse"
        >
          {message.text}
        </Text>
      </View>

      {canShowActions && (
        <View className="mt-2 flex-row items-center gap-5 px-1">
          <Pressable
            onPress={handleCopy}
            className="flex-row items-center gap-1.5 py-1"
          >
            <Ionicons
              name={
                isCopied
                  ? "checkmark"
                  : "copy-outline"
              }
              size={16}
              color="#8292A6"
            />

            <Text className="text-sm text-app-text-muted">
              {isCopied ? "Copied" : "Copy"}
            </Text>
          </Pressable>

          <Pressable
  onPress={() => {
    if (!isPinned) {
      onPinToNotes(message);
    }
  }}
  disabled={isPinned}
  className="flex-row items-center gap-1.5 py-1"
>
  <Ionicons
    name={
      isPinned
        ? "bookmark"
        : "bookmark-outline"
    }
    size={16}
    color="#8292A6"
  />

  <Text className="text-sm text-app-text-muted">
    {isPinned
      ? "Pinned"
      : "Pin to Notes"}
  </Text>
</Pressable>
        </View>
      )}
    </View>
  );
}
export default function AiChatScreen() {
  const { showAppAlert } = useAppAlert();
function handlePinToNotes(message) {
  setSelectedNoteMessageId(message.id);
  setNoteTitle("AI Recommendation");
  setNoteBody(message.text);
  setNoteFormError("");
  setNoteModalVisible(true);
}
function closeNoteModal() {
  setNoteModalVisible(false);
  setNoteFormError("");
  setSelectedNoteMessageId(null);
}
async function handleSaveNote() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    setNoteFormError(
      "You must be signed in to save notes."
    );
    return;
  }

  const trimmedTitle = noteTitle.trim();
  const trimmedBody = noteBody.trim();

  if (!trimmedTitle) {
    setNoteFormError(
      "Note title is required."
    );
    return;
  }

  if (!trimmedBody) {
    setNoteFormError(
      "Note body is required."
    );
    return;
  }

  try {
    setIsSavingNote(true);
    setNoteFormError("");

    await createClientNote({
      clientId: currentUser.uid,
      title: trimmedTitle,
      body: trimmedBody,
      isFavorite: false,
    });

   setPinnedMessageIds((currentIds) => {
  const updatedIds = new Set(currentIds);

  updatedIds.add(selectedNoteMessageId);

  return updatedIds;
});
    closeNoteModal();
  } catch (err) {
    console.log(
      "Error saving AI response to notes:",
      err
    );

    setNoteFormError(
      "Failed to save note. Please try again."
    );
  } finally {
    setIsSavingNote(false);
  }
}
const WELCOME_MESSAGE = {
  id: "welcome-message",
  role: "assistant",
  text: "Ask me about haircut ideas, styling, products, or what to ask your barber.",
};
const [isSavingNote, setIsSavingNote] =
  useState(false);

const [pinnedMessageIds, setPinnedMessageIds] =
  useState(() => new Set());
  const [selectedNoteMessageId, setSelectedNoteMessageId] =
  useState(null);

const [messages, setMessages] = useState([WELCOME_MESSAGE]);
const conversationIdRef = useRef(0);
const [input, setInput] = useState("");
const [isSending, setIsSending] = useState(false);
const [error, setError] = useState("");

const [hasConfirmedProfile, setHasConfirmedProfile] = useState(false);
const [isCheckingProfile, setIsCheckingProfile] = useState(true);

const [noteModalVisible, setNoteModalVisible] =
  useState(false);

const [noteTitle, setNoteTitle] =
  useState("");

const [noteBody, setNoteBody] =
  useState("");

const [noteFormError, setNoteFormError] =
  useState("");


useEffect(() => {
  async function loadHairProfileStatus() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setHasConfirmedProfile(false);
        return;
      }

      const profileState = await getClientHairProfileState(
        currentUser.uid
      );

      setHasConfirmedProfile(
        profileState.hasConfirmedProfile
      );
    } catch (err) {
      console.log(
        "Error checking Hair Profile status:",
        err
      );

      setHasConfirmedProfile(false);
    } finally {
      setIsCheckingProfile(false);
    }
  }

  loadHairProfileStatus();
}, []);

const handleSend = async () => {
  const trimmedInput = input.trim();
  const previousMessages = messages
  .filter(
    (message) =>
      message.id !== "welcome-message" &&
      (message.role === "user" ||
        message.role === "assistant") &&
      typeof message.text === "string" &&
      message.text.trim()
  )
  .slice(-8)
  .map((message) => ({
    role: message.role,
    text: message.text.trim(),
  }));
  if (!trimmedInput || isSending) {
    return;
  }
  const requestConversationId =
  conversationIdRef.current;
  setError("");

  const userMessage = {
    id: Date.now().toString(),
    role: "user",
    text: trimmedInput,
  };

  setMessages((currentMessages) => [
    ...currentMessages,
    userMessage,
  ]);

  setInput("");
  setIsSending(true);

  try {
const currentUser = auth.currentUser;

if (!currentUser) {
  setError("You must be signed in to use AI Chat.");
  setIsSending(false);
  return;
}
console.log("AI chat request:", {
  clientId: currentUser.uid,
  message: trimmedInput,
  sessionMessages: previousMessages,
});  
const result = await sendChatRecommendation({
  clientId: currentUser.uid,
  message: trimmedInput,
  sessionMessages: previousMessages,
});

if (
  requestConversationId !==
  conversationIdRef.current
) {
  return;
}

const assistantMessage = {
  id: `${Date.now()}-assistant`,
  role: "assistant",
  text: result.answer,
};

setMessages((currentMessages) => [
  ...currentMessages,
  assistantMessage,
]);
  } catch (err) {
 if (
    requestConversationId ===
    conversationIdRef.current
  ) {
    console.log(
      "AI chat request failed:",
      err
    )
    setError(
      err?.message || "Something went wrong. Please try again."
    )
    }
  }finally {
if (
    requestConversationId ===
    conversationIdRef.current
  ) {
    setIsSending(false);
  }
  }
};

function resetChat() {
  conversationIdRef.current += 1;

  setMessages([
    WELCOME_MESSAGE,
  ]);

  setInput("");
  setError("");
  setIsSending(false);
  setPinnedMessageIds(new Set());
}

function restartChat() {
  const hasRealMessages = messages.some(
    (message) =>
      message.id !== "welcome-message"
  );

  if (!hasRealMessages) {
    return;
  }

  showAppAlert(
    "Start a new chat?",
    "Your current conversation will be cleared.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "New Chat",
        style: "destructive",
        onPress: resetChat,
      },
    ]
  );
}
const hasRealMessages = messages.some(
  (message) =>
    message.id !== "welcome-message"
);
  return (
    
    <KeyboardAvoidingView
      className="flex-1 bg-app-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
<View className="border-b border-app-border-subtle bg-app-background">
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

    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      className="flex-1 text-center text-2xl font-bold text-app-text"
    >
      AI Hair <Text className="text-app-primary">Assistant</Text>
    </Text>

    <View className="h-11 w-11" />
  </View>
  </View>



  {!isCheckingProfile && (
    <View className="mx-6 mb-3 flex-row items-center justify-between rounded-xl bg-app-surface px-3 py-2">
      <Pressable
        onPress={
          hasConfirmedProfile
            ? undefined
            : () => router.push("/client/hairProfile")
        }
        className="mr-3 flex-1 flex-row items-center"
      >
        {hasConfirmedProfile ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#1677FF",
              marginRight: 8,
            }}
          />
        ) : null}

        <Text className="text-base font-semibold text-app-text">
          {hasConfirmedProfile
            ? "Using Your Hair Profile"
            : "Set It Up"}
        </Text>
      </Pressable>

      <Pressable
        onPress={restartChat}
        disabled={!hasRealMessages}
        className="items-end py-1"
      >
        <Text
          numberOfLines={1}
          className={`text-sm font-semibold ${
            hasRealMessages
              ? "text-app-primary"
              : "text-app-disabled"
          }`}
        >
          New Chat
        </Text>
      </Pressable>
    </View>
  )}
</View>
       

        {/* Messages Area */}
        <ScrollView
  className="flex-1 px-4"
  contentContainerStyle={{
    paddingTop: 20,
    paddingBottom: 20,
  }}
>
  {messages.map((message) => (
    <ChatBubble
  key={message.id}
  message={message}
  onPinToNotes={handlePinToNotes}
  pinnedMessageIds={pinnedMessageIds}

/>
  ))}
</ScrollView>
{error ? (
  <Text className="mb-2 px-4 text-sm text-app-error">
    {error}
  </Text>
) : null}
        {/* Input Area */}
        <View className="border-t border-app-border-subtle bg-app-background px-4 pb-8 pt-3">
          <View className="flex-row items-end gap-2">
            <TextInput
  value={input}
  onChangeText={setInput}
  placeholder="Ask a hair question..."
  multiline
  editable={!isSending}
  placeholderTextColor="#8292A6"
  className="max-h-32 min-h-12 flex-1 rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-base text-app-text"
/>
<TouchableOpacity
  onPress={handleSend}
  disabled={isSending}
  className={`h-12 justify-center rounded-2xl px-4 ${
    isSending ? "bg-app-disabled" : "bg-app-primary"
  }`}
>
  <Text className="font-semibold text-app-text-inverse">
    {isSending ? "Sending..." : "Send"}
  </Text>
</TouchableOpacity>
          </View>
        </View>
        <Modal
  visible={noteModalVisible}
  animationType="slide"
  transparent
  onRequestClose={closeNoteModal}
>
  <Pressable
    onPress={closeNoteModal}
    className="flex-1 items-center justify-center px-5"
    style={{
      backgroundColor: "rgba(0,0,0,0.45)",
    }}
  >
    <Pressable
      onPress={(event) =>
        event.stopPropagation()
      }
      className="w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-app-text">
          Pin to Notes
        </Text>

        <Pressable onPress={closeNoteModal}>
          <Text className="font-semibold text-app-text-secondary">
            Close
          </Text>
        </Pressable>
      </View>

      <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
        Title
      </Text>

      <TextInput
        value={noteTitle}
        onChangeText={setNoteTitle}
        placeholder="AI Recommendation"
        placeholderTextColor="#8292A6"
        className="rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-app-text"
      />

      {noteFormError ? (
        <Text className="mt-2 text-sm font-medium text-app-error">
          {noteFormError}
        </Text>
      ) : null}

      <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
        Body
      </Text>

      <TextInput
        value={noteBody}
        onChangeText={setNoteBody}
        placeholder="AI response"
        multiline
        textAlignVertical="top"
        placeholderTextColor="#8292A6"
        className="min-h-36 rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-app-text"
      />

      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={closeNoteModal}
          className="flex-1 rounded-xl border border-app-border px-4 py-3"
        >
          <Text className="text-center font-semibold text-app-text-secondary">
            Cancel
          </Text>
        </Pressable>

       <Pressable
  onPress={
    isSavingNote
      ? undefined
      : handleSaveNote
  }
  disabled={isSavingNote}
  className={`flex-1 rounded-xl px-4 py-3 ${
    isSavingNote
      ? "bg-app-disabled"
      : "bg-app-primary active:bg-app-primary-pressed"
  }`}
>
  <Text className="text-center font-semibold text-app-text-inverse">
    {isSavingNote
      ? "Saving..."
      : "Save"}
  </Text>
</Pressable>
      </View>
    </Pressable>
  </Pressable>
</Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
