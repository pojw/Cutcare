import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

export function listenToNotifications(
  userId,
  onNotificationsLoaded,
  onError
) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  const notificationsRef = collection(
    db,
    "users",
    userId,
    "notifications"
  );

  const notificationsQuery = query(
    notificationsRef,
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map(
        (notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        })
      );

      onNotificationsLoaded(notifications);
    },
    (error) => {
      console.log(
        "Listen to notifications error:",
        error
      );

      onError?.(error);
    }
  );
}
export async function markNotificationRead(
  userId,
  notificationId
) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  if (!notificationId) {
    throw new Error("Missing notificationId.");
  }

  const notificationRef = doc(
    db,
    "users",
    userId,
    "notifications",
    notificationId
  );

  await updateDoc(notificationRef, {
    isRead: true,
  });
}

export async function markAllNotificationsRead(userId) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  const notificationsRef = collection(
    db,
    "users",
    userId,
    "notifications"
  );

  const unreadQuery = query(
    notificationsRef,
    where("isRead", "==", false)
  );

  const snapshot = await getDocs(unreadQuery);

  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  snapshot.docs.forEach((notificationDoc) => {
    batch.update(notificationDoc.ref, {
      isRead: true,
    });
  });

  await batch.commit();
}
export function listenToUnreadNotificationCount(
  userId,
  onCountChanged,
  onError
) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  const notificationsRef = collection(
    db,
    "users",
    userId,
    "notifications"
  );

  const unreadQuery = query(
    notificationsRef,
    where("isRead", "==", false)
  );

  return onSnapshot(
    unreadQuery,
    (snapshot) => {
      onCountChanged(snapshot.size);
    },
    (error) => {
      console.log(
        "Listen to unread notification count error:",
        error
      );

      onError?.(error);
    }
  );
}

export async function markConversationNotificationsRead(
  userId,
  conversationId
) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  if (!conversationId) {
    throw new Error("Missing conversationId.");
  }

  const notificationsRef = collection(
    db,
    "users",
    userId,
    "notifications"
  );

  const unreadMessageNotificationsQuery = query(
    notificationsRef,
    where("type", "==", "new_message"),
    where("isRead", "==", false),
    where("data.conversationId", "==", conversationId)
  );

  const snapshot = await getDocs(
    unreadMessageNotificationsQuery
  );

  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  snapshot.docs.forEach((notificationDoc) => {
    batch.update(notificationDoc.ref, {
      isRead: true,
    });
  });

  await batch.commit();
}