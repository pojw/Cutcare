from typing import List, Optional

from app.models.requests import ChatSessionMessage
from app.models.response import ChatRecommendResponse
from app.services.llmService import generate_llm_response
from app.services.promptService import build_chat_messages
from app.services.profile_storage_service import (
    get_active_confirmed_hair_profile,
)


def generate_chat_response(
    client_id: str,
    user_message: str,
    session_messages: Optional[List[ChatSessionMessage]],
) -> ChatRecommendResponse:
    active_profile = get_active_confirmed_hair_profile(
        client_id=client_id,
    )

    if active_profile:
        confirmed_profile = active_profile["confirmedProfile"]
        hair_profile_id = active_profile["profileId"]
    else:
        confirmed_profile = None
        hair_profile_id = None

    messages = build_chat_messages(
        user_message=user_message,
        confirmed_profile=confirmed_profile,
        session_messages=session_messages,
    )

    answer = generate_llm_response(
        messages=messages,
    )

    mode = (
        "profile-aware"
        if confirmed_profile
        else "general"
    )

    return ChatRecommendResponse(
        status="success",
        mode=mode,
        clientId=client_id,
        hairProfileId=hair_profile_id,
        userMessage=user_message,
        answer=answer,
        recommendations=[],
    )