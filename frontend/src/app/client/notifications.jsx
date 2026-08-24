import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@/components/icons/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { auth } from "../../config/firebase";
import {
  listenToNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

const INITIAL_VISIBLE_NOTIFICATIONS = 10;

function getMessageGroupKey(notification) {
  if (notification.type !== "new_message") {
    return null;
  }

  const conversationId =
    notification.data?.conversationId || "";
  const senderId =
    notification.data?.senderId ||
    notification.data?.fromUserId ||
    notification.data?.senderName ||
    notification.title ||
    "";

  if (!conversationId || !senderId) {
    return null;
  }

  return `${conversationId}:${senderId}`;
}

function groupNotifications(notifications) {
  const groups = [];

  notifications.forEach((notification) => {
    const messageGroupKey =
      getMessageGroupKey(notification);
    const previousGroup = groups[groups.length - 1];

    if (
      messageGroupKey &&
      previousGroup?.messageGroupKey === messageGroupKey
    ) {
      previousGroup.items.push(notification);
      previousGroup.isRead =
        previousGroup.isRead && notification.isRead;
      return;
    }

    groups.push({
      id: notification.id,
      messageGroupKey,
      items: [notification],
      isRead: notification.isRead,
    });
  });

  return groups;
}

export default function ClientNotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [visibleNotificationCount, setVisibleNotificationCount] =
    useState(INITIAL_VISIBLE_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const unsubscribe = listenToNotifications(
      currentUserId,
      (loadedNotifications) => {
        setNotifications(loadedNotifications);
        setLoading(false);
      },
      () => {
        setErrorMessage("Failed to load notifications.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  async function handleNotificationPress(notification) {
    try {
      if (!currentUserId) {
        return;
      }

      if (!notification.isRead) {
        await markNotificationRead(
          currentUserId,
          notification.id
        );
      }

      if (notification.type === "new_message") {
        const conversationId =
          notification.data?.conversationId;

        if (conversationId) {
          router.push(
            `/client/conversation/${conversationId}`
          );
        }

        return;
      }

      if (
        notification.type === "booking_confirmed" ||
        notification.type === "booking_cancelled"
      ) {
        router.push("/client/bookings");
      }
    } catch (error) {
      console.log(
        "Handle client notification press error:",
        error
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      if (!currentUserId) {
        return;
      }

      await markAllNotificationsRead(currentUserId);
    } catch (error) {
      console.log("Mark all notifications read error:", error);
    }
  }

  function toggleGroup(groupId) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function renderNotificationCard(notification, isNested = false) {
    return (
      <Pressable
        onPress={() => handleNotificationPress(notification)}
        className={
          notification.isRead
            ? `${isNested ? "mt-2" : "mb-3"} rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated`
            : `${isNested ? "mt-2" : "mb-3"} rounded-2xl border border-app-border bg-app-surface-elevated p-4 active:bg-app-surface-elevated`
        }
      >
        <View className="flex-row items-start">
          <View className="flex-1 pr-3">
            <Text
              className={
                notification.isRead
                  ? "text-base font-semibold text-app-text"
                  : "text-base font-bold text-app-text"
              }
            >
              {notification.title}
            </Text>

            <Text
              className={
                notification.isRead
                  ? "mt-1 text-sm text-app-text-muted"
                  : "mt-1 text-sm font-medium text-app-text-secondary"
              }
            >
              {notification.body}
            </Text>
          </View>

          {!notification.isRead ? (
            <View
              style={{
                width: 9,
                height: 9,
                borderRadius: 4.5,
                backgroundColor: "#1677FF",
                marginTop: 5,
              }}
            />
          ) : null}
        </View>
      </Pressable>
    );
  }

  const notificationGroups =
    groupNotifications(notifications);
  const visibleNotificationGroups = notificationGroups.slice(
    0,
    visibleNotificationCount
  );
  const hasMoreNotifications =
    notificationGroups.length > visibleNotificationCount;
  const displayErrorMessage = currentUserId
    ? errorMessage
    : "You must be logged in to view notifications.";
  const isLoadingNotifications = Boolean(
    currentUserId && loading
  );

  function handleLoadMoreNotifications() {
    setVisibleNotificationCount(
      (currentCount) =>
        currentCount + INITIAL_VISIBLE_NOTIFICATIONS
    );
  }

  if (isLoadingNotifications) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-app-text-muted">
          Loading notifications...
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
            Notifi<Text className="text-app-primary">cations</Text>
          </Text>

          <View className="h-11 w-11" />
        </View>

        {notifications.some((item) => !item.isRead) ? (
          <Pressable
            onPress={handleMarkAllRead}
            className="mt-4 self-end"
          >
            <Text className="text-sm font-semibold text-app-primary">
              Mark all read
            </Text>
          </Pressable>
        ) : null}
      </View>

      {displayErrorMessage ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-app-error">
            {displayErrorMessage}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleNotificationGroups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const primaryNotification = item.items[0];
            const canExpand = item.items.length > 1;
            const isExpanded = Boolean(expandedGroups[item.id]);

            if (!canExpand) {
              return renderNotificationCard(primaryNotification);
            }

            return (
              <View className="mb-3 rounded-2xl border border-app-border bg-app-surface p-4">
                <View className="flex-row items-start">
                  <Pressable
                    onPress={() => handleNotificationPress(primaryNotification)}
                    className="flex-1 pr-3"
                  >
                    <Text
                      className={
                        item.isRead
                          ? "text-base font-semibold text-app-text"
                          : "text-base font-bold text-app-text"
                      }
                    >
                      {primaryNotification.title}
                    </Text>

                    <Text
                      className={
                        item.isRead
                          ? "mt-1 text-sm text-app-text-muted"
                          : "mt-1 text-sm font-medium text-app-text-secondary"
                      }
                    >
                      {primaryNotification.body}
                    </Text>

                    <Text className="mt-2 text-xs font-semibold text-app-primary">
                      {item.items.length} messages
                    </Text>
                  </Pressable>

                  <View className="flex-row items-center">
                    {!item.isRead ? (
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 4.5,
                          backgroundColor: "#1677FF",
                          marginRight: 8,
                        }}
                      />
                    ) : null}

                    <Pressable
                      onPress={() => toggleGroup(item.id)}
                      className="h-9 w-9 items-center justify-center rounded-full bg-app-primary-soft"
                    >
                      <Ionicons
                        name={
                          isExpanded
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color="#1677FF"
                      />
                    </Pressable>
                  </View>
                </View>

                {isExpanded ? (
                  <View className="mt-2">
                    {item.items.slice(1).map((notification) => (
                      <View key={notification.id}>
                        {renderNotificationCard(notification, true)}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          }}
          contentContainerClassName="flex-grow px-6 pb-6"
          ListFooterComponent={
            hasMoreNotifications ? (
              <Pressable
                onPress={handleLoadMoreNotifications}
                className="mt-1 self-center rounded-full bg-app-primary-soft px-5 py-3 active:bg-app-surface-elevated"
              >
                <Ionicons
                  name="chevron-down"
                  size={24}
                  color="#1677FF"
                />
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-xl font-bold text-app-text">
                No notifications yet
              </Text>

              <Text className="mt-2 text-center text-base text-app-text-muted">
                Booking and message updates will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
