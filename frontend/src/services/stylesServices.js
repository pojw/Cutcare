import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";

export async function getClientStyles(clientId) {
  if (!clientId) {
    throw new Error("clientId is required to load styles.");
  }

  const stylesRef = collection(
    db,
    "clients",
    clientId,
    "styles"
  );

  const stylesQuery = query(
    stylesRef,
    orderBy("createdAt", "desc")
  );

  const stylesSnap = await getDocs(stylesQuery);

  return stylesSnap.docs.map((styleDoc) => ({
    id: styleDoc.id,
    ...styleDoc.data(),
  }));
}

export async function createClientStyle({
  clientId,
  title,
  url,
}) {
  if (!clientId) {
    throw new Error("clientId is required to create a style.");
  }

  const trimmedTitle = title?.trim();
  const trimmedUrl = url?.trim();

  if (!trimmedTitle) {
    throw new Error("Style title is required.");
  }

  if (!trimmedUrl) {
    throw new Error("Style URL is required.");
  }

  const stylesRef = collection(
    db,
    "clients",
    clientId,
    "styles"
  );

  const styleDoc = await addDoc(
    stylesRef,
    {
      title: trimmedTitle,
      url: trimmedUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return styleDoc.id;
}

export async function updateClientStyle({
  clientId,
  styleId,
  title,
  url,
}) {
  if (!clientId || !styleId) {
    throw new Error(
      "clientId and styleId are required to update a style."
    );
  }

  const trimmedTitle = title?.trim();
  const trimmedUrl = url?.trim();

  if (!trimmedTitle) {
    throw new Error("Style title is required.");
  }

  if (!trimmedUrl) {
    throw new Error("Style URL is required.");
  }

  const styleRef = doc(
    db,
    "clients",
    clientId,
    "styles",
    styleId
  );

  await updateDoc(
    styleRef,
    {
      title: trimmedTitle,
      url: trimmedUrl,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function deleteClientStyle({
  clientId,
  styleId,
}) {
  if (!clientId || !styleId) {
    throw new Error(
      "clientId and styleId are required to delete a style."
    );
  }

  const styleRef = doc(
    db,
    "clients",
    clientId,
    "styles",
    styleId
  );

  await deleteDoc(styleRef);
}
