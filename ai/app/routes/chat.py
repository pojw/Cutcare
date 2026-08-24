from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models.requests import ChatSessionMessage

from app.models.requests import ChatRecommendRequest
from app.models.response import ChatRecommendResponse
from app.services.chat_service import generate_chat_response
from app.services.llmService import (
    LLMConfigurationError,
    LLMInvalidResponseError,
    LLMRateLimitError,
    LLMServiceError,
    LLMTimeoutError,
    LLMUnavailableError,
)
from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    require_matching_client_id,
)


router = APIRouter()


@router.post(
    "/chat/recommend",
    response_model=ChatRecommendResponse,
)
def chat_recommend(
    request: ChatRecommendRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ChatRecommendResponse:
    require_matching_client_id(
        client_id=request.clientId,
        current_user=current_user,
    )

    try:
        return generate_chat_response(
            client_id=request.clientId,
            user_message=request.message,
            session_messages=request.sessionMessages,
        )

    except LLMRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The AI service is receiving too many requests. Please try again shortly.",
        ) from exc

    except LLMTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The AI service took too long to respond.",
        ) from exc

    except LLMUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is temporarily unavailable.",
        ) from exc

    except LLMInvalidResponseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service returned an invalid response.",
        ) from exc

    except LLMConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The AI service is not configured correctly.",
        ) from exc

    except LLMServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The AI service could not generate a response.",
        ) from exc