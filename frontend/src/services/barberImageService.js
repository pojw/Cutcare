import * as ImagePicker from "expo-image-picker";

import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

import {
  doc,
  updateDoc,
   arrayUnion,
  collection,
  arrayRemove,


} from "firebase/firestore";

import {
  db,
  storage,
} from "../config/firebase";

import {File} from "expo-file-system";

export async function pickImage({
    aspect,
    allowsEditing = true,
} = {}){
    const results = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing,
        ...(aspect ? { aspect } : {}),
        quality: 1,     
    });
    if(results.canceled){
        throw new Error("Image selection was canceled.");
    }
    const image = results.assets[0];

    return{
        uri: image.uri,
        width: image.width,
        height: image.height,
        mimeType: image.type ?? "image/jpeg",
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
        new Error("Failed to read the selected image.")
      );
    };

    xhr.responseType = "blob";
    xhr.open("GET", imageUri, true);
    xhr.send(null);
  });
}

export async function uploadBarberProfileImage({
  barberId,
  imageUri,
  mimeType = "image/jpeg",
}) {
  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  if (!imageUri) {
    throw new Error("Image URI is required.");
  }

  const storagePath =
    `barbers/${barberId}/profile/profile.jpg`;

  const imageRef = ref(storage, storagePath);

const imageBlob = await uriToBlob(imageUri);

await uploadBytes(imageRef, imageBlob, {
  contentType: mimeType,
});

  const downloadUrl = await getDownloadURL(imageRef);

  const barberRef = doc(db, "barbers", barberId);

  await updateDoc(barberRef, {
    profileImageUrl: downloadUrl,
    profileImagePath: storagePath,
  });

  return {
    url: downloadUrl,
    storagePath,
  };
}



export async function deleteBarberPortfolioImage({
  barberId,
  image,
}) {
  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  if (!image?.storagePath) {
    throw new Error("Image storage path is required.");
  }

  const imageRef = ref(
    storage,
    image.storagePath
  );

  await deleteObject(imageRef);

  const barberRef = doc(
    db,
    "barbers",
    barberId
  );

  await updateDoc(barberRef, {
    portfolioImages: arrayRemove(image),
  });

  return image.id;
}
export async function uploadBarberPortfolioImage({
  barberId,
  imageUri,
  mimeType = "image/jpeg",
}) {
  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  if (!imageUri) {
    throw new Error("Image URI is required.");
  }

  const imageId = doc(
    collection(db, "barbers")
  ).id;

  const storagePath =
    `barbers/${barberId}/portfolio/${imageId}.jpg`;

  const imageRef = ref(storage, storagePath);

  const imageBlob = await uriToBlob(imageUri);

  await uploadBytes(imageRef, imageBlob, {
    contentType: mimeType,
  });

  const downloadUrl =
    await getDownloadURL(imageRef);

  const portfolioImage = {
    id: imageId,
    url: downloadUrl,
    storagePath,
  };

  const barberRef =
    doc(db, "barbers", barberId);

  try {
    await updateDoc(barberRef, {
      portfolioImages: arrayUnion(portfolioImage),
    });
  } catch (error) {
    try {
      await deleteObject(imageRef);
    } catch (cleanupError) {
      console.log(
        "Failed to clean up orphaned portfolio image:",
        cleanupError
      );
    }

    throw error;
  }

  return portfolioImage;
}
