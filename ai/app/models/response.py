from typing import List, Optional
from typing import Any
from typing import Literal

from pydantic import BaseModel,Field


class HairDetails(BaseModel):
    overallLengthCategory: str
    frontLengthCategory: str
    sideLengthCategory: str
    backLengthCategory: str
    texture: str
    currentStyle: str


class FaceDetails(BaseModel):
    shape: str
    facialHair: str


class CutDetails(BaseModel):
    hasFadeOrTaper: Optional[bool] = None
    fadeType: str
    neckline: str
    earCoverage: str


class ConfidenceScores(BaseModel):
    overall: float
    hairTexture: float
    faceShape: float
    fadeType: float


class SourceCoverage(BaseModel):
    frontPhoto: bool
    leftSidePhoto: bool
    rightSidePhoto: bool
    backPhoto: bool


class HairProfile(BaseModel):
    hair: HairDetails
    face: FaceDetails
    cutDetails: CutDetails
    confidence: ConfidenceScores
    sourceCoverage: SourceCoverage


class VisionAnalyzeResponse(BaseModel):
    status: str
    mode: str
    clientId: str
    receivedPhotoAngles: List[str]
    notesReceived: Optional[str] = None
    profile: HairProfile
    profileId:str


class RecommendationItem(BaseModel):
    name: str
    reason: str


class ChatRecommendResponse(BaseModel):
    status: str
    mode: str
    clientId: str
    hairProfileId: Optional[str] = None
    userMessage: str
    answer: str
    recommendations: List[RecommendationItem]



class ModelInfo(BaseModel):
    mode: str
    modelName: str
    modelVersion: str


class SavedHairProfileResponse(BaseModel):
    profileId: str | None
    clientId: str
    status: str
    originalAiPrediction: dict[str, Any]
    confirmedProfile: dict[str, Any] | None = None
    photoCoverage: dict[str, bool]
    modelInfo: ModelInfo
    createdAt: str | None = None
    updatedAt: str | None = None
    storageEnabled: bool = True


class FrontHairAnalysis(BaseModel):
    hairline_shape: Optional[
        Literal[
            "straight",
            "rounded",
            "widows_peak",
            "receding",
            "unclear",
        ]
    ] = None

    front_length_category: Optional[
        Literal[
            "very_short",
            "short",
            "medium",
            "long",
            "very_long",
            "unclear",
        ]
    ] = None

    forehead_coverage: Optional[
        Literal[
            "none",
            "slight",
            "partial",
            "mostly_covered",
            "fully_covered",
            "unclear",
        ]
    ] = None

    fringe_end_level: Optional[
        Literal[
            "no_fringe",
            "upper_forehead",
            "mid_forehead",
            "lower_forehead",
            "eyebrow_level",
            "below_eyebrows",
            "unclear",
        ]
    ] = None

    texture: Optional[
        Literal[
            "straight",
            "wavy",
            "curly",
            "coily",
            "unclear",
        ]
    ] = None

    face_shape: Optional[
        Literal[
            "oval",
            "round",
            "square",
            "oblong",
            "heart",
            "diamond",
            "triangle",
            "unclear",
        ]
    ] = None

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )


class LeftHairAnalysis(BaseModel):
    side_length_category: Optional[
        Literal[
            "skin",
            "very_short",
            "short",
            "medium",
            "long",
            "unclear",
        ]
    ] = None

    ear_coverage: Optional[
        Literal[
            "fully_exposed",
            "partially_covered",
            "fully_covered",
            "unclear",
        ]
    ] = None

    fade_or_taper_present: Optional[
        Literal[
            "yes",
            "no",
            "unclear",
        ]
    ] = None

    fade_height: Optional[
        Literal[
            "low",
            "mid",
            "high",
            "unclear",
            "not_applicable",
        ]
    ] = None

    sideburn_length: Optional[
        Literal[
            "none",
            "short",
            "medium",
            "long",
            "unclear",
        ]
    ] = None

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )




class RightHairAnalysis(BaseModel):
    side_length_category: Optional[
        Literal[
            "skin",
            "very_short",
            "short",
            "medium",
            "long",
            "unclear",
        ]
    ] = None

    ear_coverage: Optional[
        Literal[
            "fully_exposed",
            "partially_covered",
            "fully_covered",
            "unclear",
        ]
    ] = None

    fade_or_taper_present: Optional[
        Literal[
            "yes",
            "no",
            "unclear",
        ]
    ] = None

    fade_height: Optional[
        Literal[
            "low",
            "mid",
            "high",
            "unclear",
            "not_applicable",
        ]
    ] = None

    sideburn_length: Optional[
        Literal[
            "none",
            "short",
            "medium",
            "long",
            "unclear",
        ]
    ] = None

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )



class BackHairAnalysis(BaseModel):
    back_length_category: Optional[
        Literal[
            "skin",
            "very_short",
            "short",
            "medium",
            "long",
            "unclear",
        ]
    ] = None

    back_fade_or_taper_present: Optional[
        Literal[
            "yes",
            "no",
            "unclear",
        ]
    ] = None

    back_fade_height: Optional[
        Literal[
            "low",
            "mid",
            "high",
            "unclear",
            "not_applicable",
        ]
    ] = None

    back_blending: Optional[
        Literal[
            "clean",
            "soft",
            "uneven",
            "unclear",
        ]
    ] = None

    nape_coverage: Optional[
        Literal[
            "exposed",
            "partially_covered",
            "fully_covered",
            "unclear",
        ]
    ] = None

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )
