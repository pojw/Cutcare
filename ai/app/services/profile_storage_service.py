from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore

from app.core.config import settings
from app.core.firebase import get_firestore_client


PROFILE_STATUS_NEEDS_REVIEW = "needs_review"

MODEL_INFO = {
    "mode": "vision",
    "modelName": settings.OPENAI_MODEL,
    "modelVersion": "1.0.0",
}


def build_photo_coverage(photo_angles: list[str]) -> dict[str, bool]:
    """
    Converts a list like ["front", "left"] into a full coverage object.

    Example:
    {
        "front": True,
        "left": True,
        "right": False,
        "back": False
    }
    """

    return {
        "front": "front" in photo_angles,
        "left": "left" in photo_angles,
        "right": "right" in photo_angles,
        "back": "back" in photo_angles,
    }




def build_hair_profile_document(
    original_ai_prediction: dict[str, Any],
    photo_angles: list[str],
    source_photos: dict[str, Any],

) -> dict[str, Any]:
    """
    Builds the Firestore document shape for a client AI hair profile.
    """

    photo_coverage = build_photo_coverage(photo_angles)

    return {
        "originalAiPrediction": original_ai_prediction,
        "confirmedProfile": None,
        "status": PROFILE_STATUS_NEEDS_REVIEW,
        "wasEditedByUser": False,
        "editedFields": [],
        "photoCoverage": photo_coverage,
        "sourcePhotos": {
            angle: {
                "storagePath": photo.storagePath,
                "width": photo.width,
                "height": photo.height,
                "mimeType": photo.mimeType,
            }
            for angle, photo in source_photos.items()
        },  
        "modelInfo": MODEL_INFO,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }


def serialize_firestore_timestamp(value: Any) -> Any:
    """
    Converts Firestore timestamp-like values into ISO strings for API responses.

    Firestore SERVER_TIMESTAMP is resolved only after writing/reading the document.
    """

    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()

    return value


def serialize_profile_document(document: dict[str, Any]) -> dict[str, Any]:
    """
    Prepares Firestore document data for a JSON API response.
    """

    return {
        key: serialize_firestore_timestamp(value)
        for key, value in document.items()
    }


def save_hair_profile(
    client_id: str,
    original_ai_prediction: dict[str, Any],
    photo_angles: list[str],
    source_photos: dict[str, Any],

) -> dict[str, Any]:
    """
    Saves a generated AI hair profile to:

    clients/{clientId}/hairProfiles/{profileId}
    """

    if not settings.AI_PROFILE_STORAGE_ENABLED:
        raise RuntimeError("AI profile storage is disabled.")

    db = get_firestore_client()

    profile_document = build_hair_profile_document(
        original_ai_prediction=original_ai_prediction,
        photo_angles=photo_angles,
        source_photos=source_photos,

    )

    profile_ref = (
        db.collection("clients")
        .document(client_id)
        .collection("hairProfiles")
        .document()
    )

    profile_ref.set(profile_document)

    saved_snapshot = profile_ref.get()
    saved_data = saved_snapshot.to_dict() or {}

    serialized_data = serialize_profile_document(saved_data)

    return {
        "profileId": profile_ref.id,
        "clientId": client_id,
        **serialized_data,
    }

def get_active_confirmed_hair_profile(
    client_id: str,
) -> dict[str, Any] | None:
    """
    Loads the client's active confirmed Hair Profile.

    Returns:
        {
            "profileId": "...",
            "confirmedProfile": {...}
        }

    Returns None if:
    - the client document does not exist
    - no activeProfileId exists
    - the profile document does not exist
    - confirmedProfile is missing
    """

    db = get_firestore_client()

    client_ref = db.collection("clients").document(client_id)
    client_snapshot = client_ref.get()

    if not client_snapshot.exists:
        return None

    client_data = client_snapshot.to_dict() or {}

    ai_hair_profile = client_data.get("aiHairProfile") or {}
    active_profile_id = ai_hair_profile.get("activeProfileId")

    if not active_profile_id:
        return None

    profile_ref = (
        client_ref
        .collection("hairProfiles")
        .document(active_profile_id)
    )

    profile_snapshot = profile_ref.get()

    if not profile_snapshot.exists:
        return None

    profile_data = profile_snapshot.to_dict() or {}
    confirmed_profile = profile_data.get("confirmedProfile")

    if not confirmed_profile:
        return None

    return {
        "profileId": active_profile_id,
        "confirmedProfile": confirmed_profile,
    }