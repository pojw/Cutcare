const { setGlobalOptions } = require("firebase-functions");

const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");

const logger = require("firebase-functions/logger");
const { Expo } = require("expo-server-sdk");

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const adminAuth = getAuth();
const storage = getStorage();
const expo = new Expo();

setGlobalOptions({
  maxInstances: 10,
});

async function sendPushToUser(
  userId,
  {
    title,
    body,
    data = {},
  }
) {
  if (!userId) {
    logger.error("Push recipient userId was missing.");
    return;
  }

  const pushTokensSnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("pushTokens")
    .where("enabled", "==", true)
    .get();

  if (pushTokensSnapshot.empty) {
    logger.info("No active push tokens found.", {
      userId,
    });

    return;
  }

  const messages = [];

  pushTokensSnapshot.docs.forEach((tokenDocument) => {
    const tokenData = tokenDocument.data();
    const token = tokenData.token;

    if (!Expo.isExpoPushToken(token)) {
      logger.error("Invalid Expo push token skipped.", {
        userId,
        tokenDocumentId: tokenDocument.id,
      });

      return;
    }

    messages.push({
      to: token,
      sound: "default",
      title,
      body,
      data,
    });
  });

  if (messages.length === 0) {
    logger.info("No valid Expo push tokens found.", {
      userId,
    });

    return;
  }

  const messageChunks =
    expo.chunkPushNotifications(messages);

  for (const messageChunk of messageChunks) {
    try {
      const tickets =
        await expo.sendPushNotificationsAsync(
          messageChunk
        );

      logger.info("Expo push chunk sent.", {
        userId,
        messageCount: messageChunk.length,
        tickets,
      });
    } catch (error) {
      logger.error("Expo push delivery failed.", {
        userId,
        error: error.message,
      });
    }
  }
}

async function recursiveDeleteDocument(documentRef) {
  const documentSnapshot = await documentRef.get();

  if (!documentSnapshot.exists) {
    return false;
  }

  await db.recursiveDelete(documentRef);

  return true;
}

async function deleteClientReferencesFromBarberLists(clientId) {
  const clientReferencesSnapshot = await db
    .collectionGroup("clients")
    .where("clientId", "==", clientId)
    .get();

  if (clientReferencesSnapshot.empty) {
    return 0;
  }

  const bulkWriter = db.bulkWriter();

  clientReferencesSnapshot.docs.forEach((clientReferenceDoc) => {
    bulkWriter.delete(clientReferenceDoc.ref);
  });

  await bulkWriter.close();

  return clientReferencesSnapshot.size;
}

async function deleteStoragePrefix(prefix) {
  try {
    const bucket = storage.bucket();

    await bucket.deleteFiles({
      prefix,
    });
  } catch (error) {
    logger.warn("Storage cleanup skipped.", {
      prefix,
      error: error.message,
    });
  }
}

exports.deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to delete your account."
    );
  }

  const userRef = db.collection("users").doc(uid);
  const userSnapshot = await userRef.get();
  const userData = userSnapshot.exists ? userSnapshot.data() : {};
  const role = userData?.role;

  let removedBarberClientReferences = 0;

  try {
    if (role === "barber" || !role) {
      await recursiveDeleteDocument(
        db.collection("barbers").doc(uid)
      );
      await deleteStoragePrefix(`barbers/${uid}/`);
    }

    if (role === "client" || !role) {
      removedBarberClientReferences =
        await deleteClientReferencesFromBarberLists(uid);

      await recursiveDeleteDocument(
        db.collection("clients").doc(uid)
      );
      await deleteStoragePrefix(`clients/${uid}/`);
    }

    await recursiveDeleteDocument(userRef);
    await adminAuth.deleteUser(uid);

    logger.info("Account deleted.", {
      uid,
      role,
      removedBarberClientReferences,
    });

    return {
      ok: true,
      role,
      removedBarberClientReferences,
    };
  } catch (error) {
    logger.error("Delete account failed.", {
      uid,
      role,
      error: error.message,
    });

    throw new HttpsError(
      "internal",
      "Account deletion failed. Please try again."
    );
  }
});

exports.createNewBookingNotification = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const bookingSnapshot = event.data;

    if (!bookingSnapshot) {
      logger.error("Booking snapshot was missing.");
      return;
    }

    const booking = bookingSnapshot.data();
    const bookingId = event.params.bookingId;

    const {
      barberId,
      clientId,
      clientName,
    } = booking;

    if (!barberId || !clientId) {
      logger.error(
        "Booking is missing required participant IDs.",
        {
          bookingId,
        }
      );

      return;
    }

    const notificationId =
      `booking_request_${bookingId}`;

    const notificationRef = db.doc(
      `users/${barberId}/notifications/${notificationId}`
    );

    const notificationTitle =
      "New booking request";

    const notificationBody =
      `${clientName || "A client"} requested an appointment.`;

    await notificationRef.set({
      type: "new_booking_request",
      title: notificationTitle,
      body: notificationBody,
      actorId: clientId,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      data: {
        bookingId,
      },
    });

    await sendPushToUser(barberId, {
      title: notificationTitle,
      body: notificationBody,
      data: {
        type: "new_booking_request",
        bookingId,
      },
    });

    logger.info(
      "New booking notification created.",
      {
        bookingId,
        barberId,
        notificationId,
      }
    );
  }
);

exports.createBookingStatusNotification = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!beforeSnapshot || !afterSnapshot) {
      logger.error(
        "Booking update snapshots were missing."
      );

      return;
    }

    const beforeBooking = beforeSnapshot.data();
    const afterBooking = afterSnapshot.data();

    const bookingId = event.params.bookingId;

    const previousStatus = beforeBooking.status;
    const currentStatus = afterBooking.status;

    if (previousStatus === currentStatus) {
      return;
    }

    if (currentStatus === "confirmed") {
      const {
        clientId,
        barberId,
        barberName,
        businessName,
      } = afterBooking;

      if (!clientId || !barberId) {
        logger.error(
          "Confirmed booking is missing participant IDs.",
          {
            bookingId,
          }
        );

        return;
      }

      const barberDisplayName =
        businessName ||
        barberName ||
        "your barber";

      const notificationId =
        `booking_confirmed_${bookingId}`;

      const notificationRef = db.doc(
        `users/${clientId}/notifications/${notificationId}`
      );

      const notificationTitle =
        "Booking confirmed";

      const notificationBody =
        `Your appointment with ${barberDisplayName} has been confirmed.`;

      await notificationRef.set({
        type: "booking_confirmed",
        title: notificationTitle,
        body: notificationBody,
        actorId: barberId,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
        data: {
          bookingId,
        },
      });

      await sendPushToUser(clientId, {
        title: notificationTitle,
        body: notificationBody,
        data: {
          type: "booking_confirmed",
          bookingId,
        },
      });

      logger.info(
        "Booking confirmed notification created.",
        {
          bookingId,
          clientId,
          notificationId,
        }
      );

      return;
    }

    if (currentStatus === "cancelled") {
      const {
        clientId,
        barberId,
        cancelledBy,
        clientName,
        barberName,
        businessName,
      } = afterBooking;

      if (
        !clientId ||
        !barberId ||
        !cancelledBy
      ) {
        logger.error(
          "Cancelled booking is missing required fields.",
          {
            bookingId,
          }
        );

        return;
      }

      let recipientId;
      let actorName;

      if (cancelledBy === clientId) {
        recipientId = barberId;

        actorName =
          clientName ||
          "The client";
      } else if (cancelledBy === barberId) {
        recipientId = clientId;

        actorName =
          businessName ||
          barberName ||
          "The barber";
      } else {
        logger.error(
          "cancelledBy does not match a booking participant.",
          {
            bookingId,
            cancelledBy,
          }
        );

        return;
      }

      const notificationId =
        `booking_cancelled_${bookingId}`;

      const notificationRef = db.doc(
        `users/${recipientId}/notifications/${notificationId}`
      );

      const notificationTitle =
        "Booking cancelled";

      const notificationBody =
        `${actorName} cancelled the appointment.`;

      await notificationRef.set({
        type: "booking_cancelled",
        title: notificationTitle,
        body: notificationBody,
        actorId: cancelledBy,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
        data: {
          bookingId,
        },
      });

      await sendPushToUser(recipientId, {
        title: notificationTitle,
        body: notificationBody,
        data: {
          type: "booking_cancelled",
          bookingId,
        },
      });

      logger.info(
        "Booking cancelled notification created.",
        {
          bookingId,
          recipientId,
          notificationId,
        }
      );
    }
  }
);

exports.createNewMessageNotification = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const messageSnapshot = event.data;

    if (!messageSnapshot) {
      logger.error("Message snapshot was missing.");
      return;
    }

    const message = messageSnapshot.data();

    const conversationId =
      event.params.conversationId;

    const messageId =
      event.params.messageId;

    const {
      senderId,
      senderName,
      text,
    } = message;

    if (!senderId) {
      logger.error(
        "Message is missing senderId.",
        {
          conversationId,
          messageId,
        }
      );

      return;
    }

    const conversationRef = db.doc(
      `conversations/${conversationId}`
    );

    const conversationSnapshot =
      await conversationRef.get();

    if (!conversationSnapshot.exists) {
      logger.error(
        "Conversation could not be found.",
        {
          conversationId,
          messageId,
        }
      );

      return;
    }

    const conversation =
      conversationSnapshot.data();

    const participants =
      conversation.participants;

    if (
      !Array.isArray(participants) ||
      participants.length !== 2
    ) {
      logger.error(
        "Conversation does not contain exactly two participants.",
        {
          conversationId,
          messageId,
        }
      );

      return;
    }

    if (!participants.includes(senderId)) {
      logger.error(
        "Message sender is not a conversation participant.",
        {
          conversationId,
          messageId,
          senderId,
        }
      );

      return;
    }

    const recipientId = participants.find(
      (participantId) =>
        participantId !== senderId
    );

    if (!recipientId) {
      logger.error(
        "Message recipient could not be determined.",
        {
          conversationId,
          messageId,
        }
      );

      return;
    }

    const notificationId =
      `message_${messageId}`;

    const notificationRef = db.doc(
      `users/${recipientId}/notifications/${notificationId}`
    );

    const trimmedText =
      typeof text === "string"
        ? text.trim()
        : "";

    const preview =
      trimmedText.length > 80
        ? `${trimmedText.slice(0, 77)}...`
        : trimmedText;

    const notificationTitle =
      "New message";

    const notificationBody = preview
      ? `${senderName || "Someone"}: ${preview}`
      : `${senderName || "Someone"} sent you a message.`;

    await notificationRef.set({
      type: "new_message",
      title: notificationTitle,
      body: notificationBody,
      actorId: senderId,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      data: {
        conversationId,
      },
    });

    await sendPushToUser(recipientId, {
      title: notificationTitle,
      body: notificationBody,
      data: {
        type: "new_message",
        conversationId,
      },
    });

    logger.info(
      "New message notification created.",
      {
        conversationId,
        messageId,
        senderId,
        recipientId,
        notificationId,
      }
    );
  }
);
