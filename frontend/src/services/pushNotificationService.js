import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";
export async function getExpoPushToken() {
  if (!Device.isDevice) {
    throw new Error(
      "Push notifications require a supported physical device or simulator."
    );
  }

  const existingPermissions =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingPermissions.status;

  if (finalStatus !== "granted") {
    const requestedPermissions =
      await Notifications.requestPermissionsAsync();

    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "default",
      {
        name: "Default",
        importance:
          Notifications.AndroidImportance.MAX,
      }
    );
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    throw new Error(
      "Expo project ID could not be found."
    );
  }

  const tokenResponse =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  return tokenResponse.data;
}
export async function registerPushToken(
  userId,
  token
) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  if (!token) {
    throw new Error("Missing Expo push token.");
  }

  const tokenDocumentId =
    encodeURIComponent(token);

  const tokenRef = doc(
    db,
    "users",
    userId,
    "pushTokens",
    tokenDocumentId
  );

  const tokenSnapshot = await getDoc(tokenRef);

  if (tokenSnapshot.exists()) {
    await updateDoc(tokenRef, {
      enabled: true,
      updatedAt: serverTimestamp(),
    });

    return;
  }

  await setDoc(tokenRef, {
    token,
    platform: Platform.OS,
    enabled: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function registerCurrentDeviceForPushNotifications(
  userId
) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  const token = await getExpoPushToken();

  await registerPushToken(userId, token);

  return token;
}


export async function disableCurrentDevicePushToken(
  userId
) {
  if (!userId) {
    return;
  }

  const token = await getExpoPushToken();

  const tokenDocumentId =
    encodeURIComponent(token);

  const tokenRef = doc(
    db,
    "users",
    userId,
    "pushTokens",
    tokenDocumentId
  );

  await updateDoc(tokenRef, {
    enabled: false,
    updatedAt: serverTimestamp(),
  });
}