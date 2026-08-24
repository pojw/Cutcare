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


export async function getClientNotes(clientId) {
  if (!clientId) {
    throw new Error(
      "clientId is required to load notes."
    );
  }

  const notesRef = collection(
    db,
    "clients",
    clientId,
    "notes"
  );

  const notesQuery = query(
    notesRef,
    orderBy("updatedAt", "desc")
  );

  const notesSnap = await getDocs(notesQuery);

  return notesSnap.docs.map((noteDoc) => ({
    id: noteDoc.id,
    ...noteDoc.data(),
  }));
}


export async function createClientNote({
  clientId,
  title,
  body,
  barberId = null,
  barberName = "",
  businessName = "",
  isFavorite = false,
}) {
  if (!clientId) {
    throw new Error(
      "clientId is required to create a note."
    );
  }

  const trimmedTitle = title?.trim();
  const trimmedBody = body?.trim() || "";

  if (!trimmedTitle) {
    throw new Error(
      "Note title is required."
    );
  }

  const notesRef = collection(
    db,
    "clients",
    clientId,
    "notes"
  );

  const noteDoc = await addDoc(
    notesRef,
    {
      title: trimmedTitle,
      body: trimmedBody,
      barberId,
      barberName,
      businessName,
      isFavorite,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return noteDoc.id;
}


export async function updateClientNote({
  clientId,
  noteId,
  title,
  body,
  barberId = null,
  barberName = "",
  businessName = "",
  isFavorite = false,
}) {
  if (!clientId || !noteId) {
    throw new Error(
      "clientId and noteId are required to update a note."
    );
  }

  const trimmedTitle = title?.trim();
  const trimmedBody = body?.trim() || "";

  if (!trimmedTitle) {
    throw new Error(
      "Note title is required."
    );
  }

  const noteRef = doc(
    db,
    "clients",
    clientId,
    "notes",
    noteId
  );

  await updateDoc(
    noteRef,
    {
      title: trimmedTitle,
      body: trimmedBody,
      barberId,
      barberName,
      businessName,
      isFavorite,
      updatedAt: serverTimestamp(),
    }
  );
}


export async function setClientNoteFavorite({
  clientId,
  noteId,
  isFavorite,
}) {
  if (!clientId || !noteId) {
    throw new Error(
      "clientId and noteId are required to update a note."
    );
  }

  const noteRef = doc(
    db,
    "clients",
    clientId,
    "notes",
    noteId
  );

  await updateDoc(
    noteRef,
    {
      isFavorite,
      updatedAt: serverTimestamp(),
    }
  );
}


export async function deleteClientNote({
  clientId,
  noteId,
}) {
  if (!clientId || !noteId) {
    throw new Error(
      "clientId and noteId are required to delete a note."
    );
  }

  const noteRef = doc(
    db,
    "clients",
    clientId,
    "notes",
    noteId
  );

  await deleteDoc(noteRef);
}