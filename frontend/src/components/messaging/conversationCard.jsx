import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";

function formatConversationTime(timestamp) {
  if (!timestamp?.toDate) {
    return "";
  }

  const date = timestamp.toDate();
  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isConversationUnread(
  conversation,
  currentUserId
) {
  if (
    !conversation?.lastMessageAt ||
    !conversation?.lastMessageSenderId ||
    !currentUserId
  ) {
    return false;
  }

  if (
    conversation.lastMessageSenderId ===
    currentUserId
  ) {
    return false;
  }

  const lastReadAt =
    conversation.readState?.[currentUserId];

  if (!lastReadAt) {
    return true;
  }

  return (
    conversation.lastMessageAt.toMillis() >
    lastReadAt.toMillis()
  );
}

export default function ConversationCard({
  conversation,
  currentUserId,
  displayName,
  secondaryName,
  avatarUrl,
  onPress,
}) {
  const unread = isConversationUnread(
    conversation,
    currentUserId
  );
  const fallbackInitial = (displayName || "B")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-app-border bg-app-surface p-4 active:opacity-80"
    >
      <View className="flex-row items-center">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            className="mr-4 bg-app-surface-elevated"
          />
        ) : (
          <View
            style={{ width: 48, height: 48, borderRadius: 24 }}
            className="mr-4 items-center justify-center bg-app-primary-soft"
          >
            <Text className="text-base font-bold text-app-primary">
              {fallbackInitial}
            </Text>
          </View>
        )}

        <View className="flex-1 pr-4">
          <Text
            className={
              unread
                ? "text-base font-bold text-app-text"
                : "text-base font-semibold text-app-text"
            }
          >
            {displayName}
          </Text>

          {secondaryName ? (
            <Text className="mt-1 text-sm text-app-text-secondary">
              {secondaryName}
            </Text>
          ) : null}

          <Text
            numberOfLines={1}
            className={
              unread
                ? "mt-2 text-sm font-semibold text-app-text"
                : "mt-2 text-sm text-app-text-muted"
            }
          >
            {conversation.lastMessage || "No messages yet."}
          </Text>
        </View>

        <View className="mr-3 flex-row items-center">
          <Text className="text-xs text-app-text-muted">
            {formatConversationTime(
              conversation.lastMessageAt ||
                conversation.updatedAt
            )}
          </Text>

          {unread ? (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#1677FF",
                marginLeft: 8,
              }}
            />
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#52657A"
        />
      </View>
    </Pressable>
  );
}
