from typing import List, Literal, Optional,Dict
from pydantic import BaseModel, ConfigDict, field_validator,Field

class VisionSourcePhoto(BaseModel):
    storagePath: str
    width: Optional[int] = None
    height: Optional[int] = None
    mimeType: Optional[str] = None

class VisionAnalyzeRequest(BaseModel):
    clientId: str
    photoAngles: List[str]
    sourcePhotos: Dict[str, VisionSourcePhoto]
    notes: Optional[str] = None



class ChatSessionMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    text: str

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        cleaned_text = value.strip()

        if not cleaned_text:
            raise ValueError("Session message text cannot be empty.")

        return cleaned_text[:1000]

class ChatRecommendRequest(BaseModel):
    clientId: str
    message: str
    sessionMessages: Optional[List[ChatSessionMessage]] = None

    @field_validator("sessionMessages")
    @classmethod
    def validate_session_messages(
        cls,
        value: Optional[List[ChatSessionMessage]],
    ) -> Optional[List[ChatSessionMessage]]:
        if not value:
            return None

        recent_messages = value[-8:]

        total_characters = 0
        limited_messages = []

        for session_message in reversed(recent_messages):
            message_length = len(session_message.text)

            if total_characters + message_length > 6000:
                break

            limited_messages.append(session_message)
            total_characters += message_length

        limited_messages.reverse()

        return limited_messages or None




    
