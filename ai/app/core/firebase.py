import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import settings


_firebase_app = None
_firestore_client = None


def initialize_firebase():
    """
    Initializes Firebase Admin once using environment variables.

    Required environment variables:
    - FIREBASE_PROJECT_ID
    - FIREBASE_CLIENT_EMAIL
    - FIREBASE_PRIVATE_KEY
    - FIREBASE_STORAGE_BUCKET
    """

    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    if not settings.FIREBASE_PROJECT_ID:
        raise RuntimeError("Missing FIREBASE_PROJECT_ID")

    if not settings.FIREBASE_CLIENT_EMAIL:
        raise RuntimeError("Missing FIREBASE_CLIENT_EMAIL")

    if not settings.FIREBASE_PRIVATE_KEY:
        raise RuntimeError("Missing FIREBASE_PRIVATE_KEY")

    if not settings.FIREBASE_STORAGE_BUCKET:
        raise RuntimeError("Missing FIREBASE_STORAGE_BUCKET")

    private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")

    credential = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": private_key,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    )

    _firebase_app = firebase_admin.initialize_app(
        credential,
        {
            "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        },
    )

    return _firebase_app


def get_firestore_client():
    """
    Returns the shared Firestore client.
    """

    global _firestore_client

    if _firestore_client is not None:
        return _firestore_client

    initialize_firebase()

    _firestore_client = firestore.client()

    return _firestore_client


def is_firebase_ready() -> bool:
    """
    Returns True when Firebase Admin can initialize successfully.
    """

    try:
        initialize_firebase()
        return True
    except Exception:
        return False


def is_firestore_ready() -> bool:
    """
    Returns True when the Firestore client can be created successfully.
    """

    try:
        get_firestore_client()
        return True
    except Exception:
        return False
