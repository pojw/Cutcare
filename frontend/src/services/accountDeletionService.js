import { httpsCallable } from "firebase/functions";

import { cloudFunctions } from "../config/firebase";

function getDeleteAccountErrorMessage(error) {
  if (error?.code === "functions/unauthenticated") {
    return "Please log in again before deleting your account.";
  }

  if (error?.code === "functions/not-found") {
    return "The delete account function is not deployed yet.";
  }

  if (error?.code === "functions/unavailable") {
    return "The delete account service is unavailable right now. Please try again.";
  }

  return (
    error?.message ||
    "We could not delete your account right now. Please try again."
  );
}

export async function deleteCurrentAccount() {
  try {
    const deleteAccount = httpsCallable(cloudFunctions, "deleteAccount");
    const result = await deleteAccount();

    return result.data;
  } catch (error) {
    console.log("Delete account callable error:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    });

    throw new Error(getDeleteAccountErrorMessage(error));
  }
}
