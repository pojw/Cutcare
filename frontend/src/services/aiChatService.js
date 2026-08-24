import { auth } from "../config/firebase";
import { AI_API_BASE_URL } from "../config/api";

export async function sendChatRecommendation({
  clientId,
  message,
  sessionMessages = [],
}) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to use AI Chat.");
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new Error("Message cannot be empty.");
  }

  const idToken = await currentUser.getIdToken(true);

  const response = await fetch(
    `${AI_API_BASE_URL}/chat/recommend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        clientId,
        message: trimmedMessage,
        sessionMessages,
      }),
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The AI server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || "Unable to get an AI recommendation."
    );
  }

  return data;
}
