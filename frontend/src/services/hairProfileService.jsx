import * as ImagePicker from "expo-image-picker";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
} from "firebase/storage";

import { AI_API_BASE_URL } from "../config/api";
import { auth, db, storage } from "../config/firebase";

export async function getClientHairProfileState(clientId) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  const clientRef = doc(db, "clients", clientId);
  const clientSnap = await getDoc(clientRef);

  if (!clientSnap.exists()) {
    return {
      hasConfirmedProfile: false,
      activeProfileId: null,
      lastAnalyzedAt: null,
    };
  }

  const clientData = clientSnap.data();

  return {
    hasConfirmedProfile:
      clientData?.aiHairProfile?.hasConfirmedProfile ?? false,
    activeProfileId:
      clientData?.aiHairProfile?.activeProfileId ?? null,
    lastAnalyzedAt:
      clientData?.aiHairProfile?.lastAnalyzedAt ?? null,
  };
}

export async function pickHairProfileImage() {
  const results = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9,
  });

  if (results.canceled) {
    return null;
  }

  const image = results.assets[0];

  return {
    uri: image.uri,
    width: image.width,
    height: image.height,
    mimeType: image.mimeType ?? "image/jpeg",
  };
}

function uriToBlob(imageUri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(
        new Error("Failed to read the selected hair photo.")
      );
    };

    xhr.responseType = "blob";
    xhr.open("GET", imageUri, true);
    xhr.send(null);
  });
}

function getImageExtension(mimeType) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export async function uploadHairProfilePhotos({
  clientId,
  photosByAngle,
}) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to upload hair photos");
  }

  if (currentUser.uid !== clientId) {
    throw new Error("You cannot upload photos for another client");
  }

  const validPhotoEntries = Object.entries(
    photosByAngle ?? {}
  ).filter(([, photo]) => Boolean(photo?.uri));

  if (validPhotoEntries.length === 0) {
    throw new Error("Add at least one hair photo");
  }

  const uploadBatchId = doc(collection(db, "clients")).id;
  const uploadedPhotos = {};

  for (const [angle, photo] of validPhotoEntries) {
    const mimeType = photo.mimeType ?? "image/jpeg";
    const extension = getImageExtension(mimeType);

    const storagePath =
      `clients/${clientId}/hairProfiles/uploads/` +
      `${uploadBatchId}/${angle}.${extension}`;

    const imageRef = ref(storage, storagePath);
    const imageBlob = await uriToBlob(photo.uri);

    try {
      await uploadBytes(imageRef, imageBlob, {
        contentType: mimeType,
        customMetadata: {
          angle,
          clientId,
          uploadBatchId,
        },
      });
    } finally {
      imageBlob.close?.();
    }

    uploadedPhotos[angle] = {
      storagePath,
      width: photo.width ?? null,
      height: photo.height ?? null,
      mimeType,
    };
  }

  return {
    uploadBatchId,
    photos: uploadedPhotos,
  };
}

export async function analyzeHairProfile({
  clientId,
  photoAngles,
  sourcePhotos,
}) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  if (!photoAngles || photoAngles.length === 0) {
    throw new Error("Select at least one photo angle");
  }

  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`${AI_API_BASE_URL}/vision/analyze-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      clientId,
      photoAngles,
      sourcePhotos,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to analyze hair profile");
  }

  return await response.json();
}


export async function getHairProfile({ clientId, profileId }) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  if (!profileId) {
    throw new Error("Missing profileId");
  }

  const profileRef = doc(
    db,
    "clients",
    clientId,
    "hairProfiles",
    profileId
  );

  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    throw new Error("Hair profile not found");
  }

  return {
    id: profileSnap.id,
    ...profileSnap.data(),
  };
}

export async function getActiveHairProfile(clientId) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  const hairProfileState = await getClientHairProfileState(clientId);

  if (
    !hairProfileState.hasConfirmedProfile ||
    !hairProfileState.activeProfileId
  ) {
    return null;
  }

  return await getHairProfile({
    clientId,
    profileId: hairProfileState.activeProfileId,
  });
}
export async function confirmHairProfile({
  clientId,
  profileId,
  confirmedProfile,
  originalAiPrediction,
}) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  if (!profileId) {
    throw new Error("Missing profileId");
  }

  if (!confirmedProfile) {
    throw new Error("Missing confirmedProfile");
  }

  const editedFields = getEditedFields({
    originalAiPrediction,
    confirmedProfile,
  });

  const profileRef = doc(
    db,
    "clients",
    clientId,
    "hairProfiles",
    profileId
  );

  const clientRef = doc(db, "clients", clientId);

  await updateDoc(profileRef, {
    confirmedProfile,
    status: "confirmed",
    wasEditedByUser: editedFields.length > 0,
    editedFields,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(clientRef, {
    aiHairProfile: {
      hasConfirmedProfile: true,
      activeProfileId: profileId,
      lastAnalyzedAt: serverTimestamp(),
    },
  });

  return {
    profileId,
    confirmedProfile,
    editedFields,
  };
}
function getEditedFields({
  originalAiPrediction,
  confirmedProfile,
}) {
  if (!originalAiPrediction || !confirmedProfile) {
    return [];
  }

  const editableOriginal = buildEditableHairProfile(
    originalAiPrediction
  );

  const editedFields = [];

  Object.keys(confirmedProfile).forEach((fieldName) => {
    const originalValue = editableOriginal[fieldName];
    const confirmedValue = confirmedProfile[fieldName];

    if (
      String(originalValue ?? "") !==
      String(confirmedValue ?? "")
    ) {
      editedFields.push(fieldName);
    }
  });

  return editedFields;
}

export function buildEditableHairProfile(originalAiPrediction) {
  const unifiedProfile =
    originalAiPrediction?.unifiedProfile ?? {};

  const hair = unifiedProfile.hair ?? {};
  const front = unifiedProfile.front ?? {};
  const cutDetails = unifiedProfile.cut_details ?? {};

  return {
    overallLengthCategory:
      hair.overall_length_category ?? "unclear",

    frontLengthCategory:
      hair.front_length_category ?? "unclear",

    sideLengthCategory:
      hair.side_length_category ?? "unclear",

    backLengthCategory:
      hair.back_length_category ?? "unclear",

    texture:
      hair.texture ?? "unclear",

    hairlineShape:
      front.hairline_shape ?? "unclear",

    foreheadCoverage:
      front.forehead_coverage ?? "unclear",

    fringeEndLevel:
      front.fringe_end_level ?? "unclear",

    faceShape:
      front.face_shape ?? "unclear",

    fadeOrTaperPresent:
      cutDetails.fade_or_taper_present ?? "unclear",

    fadeHeight:
      cutDetails.fade_height ?? "unclear",

    earCoverage:
      cutDetails.ear_coverage ?? "unclear",

    sideburnLength:
      cutDetails.sideburn_length ?? "unclear",

    backBlending:
      cutDetails.back_blending ?? "unclear",

    napeCoverage:
      cutDetails.nape_coverage ?? "unclear",
  };
}
