from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    OpenAI,
    RateLimitError,
)
import re
from typing import Any

from app.core.config import settings


class LLMServiceError(Exception):
    """Base error for LLM generation failures."""


class LLMConfigurationError(LLMServiceError):
    """Raised when required LLM configuration is missing."""


class LLMTimeoutError(LLMServiceError):
    """Raised when the LLM provider times out."""


class LLMUnavailableError(LLMServiceError):
    """Raised when the LLM provider cannot be reached."""


class LLMRateLimitError(LLMServiceError):
    """Raised when the provider rejects requests due to rate limits."""


class LLMInvalidResponseError(LLMServiceError):
    """Raised when the provider returns an unusable response."""
def clean_llm_response(text: str) -> str:
    cleaned = text.strip()

    # Remove Markdown bold markers.
    cleaned = cleaned.replace("**", "")

    # Remove Markdown heading markers at the beginning of lines.
    cleaned = re.sub(
        r"(?m)^\s*#{1,6}\s*",
        "",
        cleaned,
    )

    # Remove Markdown blockquote markers.
    cleaned = re.sub(
        r"(?m)^\s*>\s*",
        "",
        cleaned,
    )

    # Remove standalone asterisk bullets while preserving the text.
    cleaned = re.sub(
        r"(?m)^\s*\*\s+",
        "- ",
        cleaned,
    )

    # Reduce excessive blank lines.
    cleaned = re.sub(
        r"\n{3,}",
        "\n\n",
        cleaned,
    )

    return cleaned.strip()

def generate_llm_response(
    messages: list[dict[str, str]],
) -> str:
    if not settings.OPENAI_API_KEY:
        raise LLMConfigurationError(
            "OPENAI_API_KEY is not configured."
        )

    client = create_llm_client()

    try:
        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_completion_tokens=180,
        )

    except APITimeoutError as exc:
        print(
            "LLM timeout error:",
            repr(exc),
        )

        raise LLMTimeoutError(
            "The LLM provider timed out."
        ) from exc

    except RateLimitError as exc:
        print(
            "LLM rate limit error:",
            repr(exc),
        )

        raise LLMRateLimitError(
            "The LLM provider rate limit was reached."
        ) from exc

    except APIConnectionError as exc:
        print(
            "LLM connection error:",
            repr(exc),
        )

        raise LLMUnavailableError(
            "Could not connect to the LLM provider."
        ) from exc

    except APIStatusError as exc:
        print(
            "LLM API status error:",
            exc.status_code,
            exc.response.text,
        )

        raise LLMUnavailableError(
            f"LLM provider returned status {exc.status_code}."
        ) from exc

    except Exception as exc:
        print(
            "Unexpected LLM error:",
            repr(exc),
        )

        raise LLMServiceError(
            "Unexpected LLM generation failure."
        ) from exc

    if not completion.choices:
        print_llm_response_debug(completion)

        raise LLMInvalidResponseError(
            "LLM returned no completion choices."
        )

    generated_text = completion.choices[0].message.content

    if not generated_text:
        print_llm_response_debug(completion)

        raise LLMInvalidResponseError(
            "LLM returned an empty response."
        )

    cleaned_text = clean_llm_response(generated_text)
   
    
    if not cleaned_text:
        print_llm_response_debug(completion)

        raise LLMInvalidResponseError(
            "LLM returned only whitespace."
        )

    return cleaned_text


def print_llm_response_debug(completion: Any) -> None:
    try:
        choice = completion.choices[0] if completion.choices else None
        finish_reason = getattr(choice, "finish_reason", None)
        message = getattr(choice, "message", None)
        content = getattr(message, "content", None)

        print(
            "LLM invalid response debug:",
            {
                "finish_reason": finish_reason,
                "content_type": type(content).__name__,
                "content_preview": repr(content)[:300],
            },
        )
    except Exception as exc:
        print(
            "LLM invalid response debug failed:",
            repr(exc),
        )

def create_llm_client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise LLMConfigurationError(
            "OPENAI_API_KEY is not configured."
        )

    return OpenAI(
        base_url=settings.OPENAI_BASE_URL,
        api_key=settings.OPENAI_API_KEY,
        timeout=60.0,
    )
