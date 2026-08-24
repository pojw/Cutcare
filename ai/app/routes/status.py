from fastapi import APIRouter

from app.core.config import settings
from app.core.firebase import is_firebase_ready, is_firestore_ready


router = APIRouter(
    tags=["Status"],
)


@router.get("/status")
def get_status():
    """
    Reports backend and AI service configuration status.
    """

    firebase_ready = is_firebase_ready()
    firestore_ready = is_firestore_ready()

    llm_configured = bool(
        settings.OPENAI_API_KEY
        and settings.OPENAI_MODEL
        and settings.OPENAI_BASE_URL
    )

    return {
        "mode": settings.ENVIRONMENT,
        "authMode": settings.AUTH_MODE,

        "firebaseConfigured": settings.firebase_configured,
        "firebaseReady": firebase_ready,
        "firestoreReady": firestore_ready,

        "chatMode": "llm",
        "llmProvider": "openai",
        "llmModel": settings.OPENAI_MODEL,
        "llmConfigured": llm_configured,

        "qdrantConnected": False,
        "visionModelConnected": False,

        "aiProfileStorageEnabled": settings.AI_PROFILE_STORAGE_ENABLED,
        "aiProfileStorageReady": (
            settings.AI_PROFILE_STORAGE_ENABLED
            and firebase_ready
            and firestore_ready
        ),
    }