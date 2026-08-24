import {
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export async function createGuestAccount() {
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      email: "",
      fullName: "Guest",
      isGuest: true,
      onboarded: true,
      profileComplete: false,
      role: "client",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "clients", user.uid),
    {
      userId: user.uid,
      preferredName: "Guest",
      location: {
        city: "",
        state: "",
        stateCode: "",
        countryCode: "US",
      },
      profileImageUrl: "",
      profileImagePath: "",
      favoriteBarbers: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return user;
}

export async function upgradeGuestAccount({
  fullName,
  email,
  password,
}) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No guest session was found.");
  }

  if (!currentUser.isAnonymous) {
    throw new Error("This account has already been created.");
  }

  const trimmedFullName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const credential = EmailAuthProvider.credential(
    normalizedEmail,
    password
  );

  const userCredential = await linkWithCredential(
    currentUser,
    credential
  );

  if (trimmedFullName) {
    await updateProfile(userCredential.user, {
      displayName: trimmedFullName,
    });
  }

  await setDoc(
    doc(db, "users", userCredential.user.uid),
    {
      email: normalizedEmail,
      fullName: trimmedFullName,
      isGuest: false,
      onboarded: false,
      profileComplete: false,
      role: "client",
      updatedAt: serverTimestamp(),
      upgradedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "clients", userCredential.user.uid),
    {
      userId: userCredential.user.uid,
      preferredName: trimmedFullName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return userCredential.user;
}
