import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../config/firebase";
import {
  registerCurrentDeviceForPushNotifications,
  disableCurrentDevicePushToken,
} from "../services/pushNotificationService";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function refreshUserData(firebaseUser = auth.currentUser) {
    if (!firebaseUser) {
      setUserData(null);
      return null;
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setUserData(null);
      return null;
    }

    const nextUserData = {
      id: userSnap.id,
      ...userSnap.data(),
    };

    setUserData(nextUserData);

    return nextUserData;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setAuthLoading(true);
        setUser(firebaseUser);

        if (!firebaseUser) {
          setUserData(null);
          return;
        }

        await refreshUserData(firebaseUser);

        try {
          const token =
            await registerCurrentDeviceForPushNotifications(
              firebaseUser.uid
            );

          console.log(
            "Push notification device registered:",
            token
          );
        } catch (pushError) {
          console.log(
            "Push notification registration skipped:",
            pushError.message
          );
        }
      } catch (error) {
        console.log("Auth restoration error:", error);
        setUserData(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);
async function logout() {
  const currentUser = auth.currentUser;

  if (currentUser) {
    try {
      await disableCurrentDevicePushToken(
        currentUser.uid
      );
    } catch (error) {
      console.log(
        "Push token could not be disabled:",
        error.message
      );
    }
  }

  await signOut(auth);
}
const value = useMemo(
  () => ({
    user,
    userData,
    authLoading,
    isAuthenticated: Boolean(user),
    isGuest: Boolean(user?.isAnonymous || userData?.isGuest),
    refreshUserData,
    logout,
  }),
  [user, userData, authLoading]
);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
