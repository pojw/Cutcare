import time
from typing import List, Optional

from app.models.requests import ChatSessionMessage
from app.models.response import ChatRecommendResponse
from app.services.llmService import generate_llm_response
from app.services.promptService import build_chat_messages
from app.services.knowledge_service import get_relevant_haircut_knowledge


from app.services.profile_storage_service import (
    get_active_confirmed_hair_profile,
)


def generate_chat_response(
    client_id: str,
    user_message: str,
    session_messages: Optional[List[ChatSessionMessage]],
) -> ChatRecommendResponse:
    request_started_at = time.perf_counter()

    active_profile = get_active_confirmed_hair_profile(
        client_id=client_id,
    )
    profile_loaded_at = time.perf_counter()

    if active_profile:
        confirmed_profile = active_profile["confirmedProfile"]
        hair_profile_id = active_profile["profileId"]
    else:
        confirmed_profile = None
        hair_profile_id = None

    retrieved_knowledge = get_relevant_haircut_knowledge(
        user_message=user_message,
        hair_profile=confirmed_profile,
    )
    knowledge_loaded_at = time.perf_counter()

    messages = build_chat_messages(
        user_message=user_message,
        confirmed_profile=confirmed_profile,
        retrieved_knowledge=retrieved_knowledge,
        session_messages=session_messages,
    )
    prompt_built_at = time.perf_counter()

    answer = generate_llm_response(
        messages=messages,
    )
    response_generated_at = time.perf_counter()

    print(
        "Chat timing:",
        {
            "profile_seconds": round(profile_loaded_at - request_started_at, 3),
            "retrieval_seconds": round(knowledge_loaded_at - profile_loaded_at, 3),
            "prompt_seconds": round(prompt_built_at - knowledge_loaded_at, 3),
            "llm_seconds": round(response_generated_at - prompt_built_at, 3),
            "total_seconds": round(response_generated_at - request_started_at, 3),
        },
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
