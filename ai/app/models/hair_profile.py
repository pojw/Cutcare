from typing import Literal, Optional

from pydantic import BaseModel, Field


class UnifiedHairDetails(BaseModel):
    overall_length_category: Optional[
        Literal[
            "skin",
            "very_short",
            "short",
            "medium",
            "long",
            "very_long",
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

    texture: Optional[
        Literal[
            "straight",
            "wavy",
            "curly",
            "coily",
            "unclear",
        ]
    ] = None


class UnifiedFrontDetails(BaseModel):
    hairline_shape: Optional[
        Literal[
            "straight",
            "rounded",
            "widows_peak",
            "receding",
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


class UnifiedCutDetails(BaseModel):
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
            "not_applicable",
            "unclear",
        ]
    ] = None

    ear_coverage: Optional[
        Literal[
            "fully_exposed",
            "partially_covered",
            "fully_covered",
            "mixed",
            "unclear",
        ]
    ] = None

    sideburn_length: Optional[
        Literal[
            "none",
            "short",
            "medium",
            "long",
            "mixed",
            "unclear",
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


class UnifiedConfidence(BaseModel):
    front: float = Field(ge=0.0, le=1.0)
    left: float = Field(ge=0.0, le=1.0)
    right: float = Field(ge=0.0, le=1.0)
    back: float = Field(ge=0.0, le=1.0)
    overall: float = Field(ge=0.0, le=1.0)


class UnifiedHairProfile(BaseModel):
    hair: UnifiedHairDetails
    front: UnifiedFrontDetails
    cut_details: UnifiedCutDetails
    confidence: UnifiedConfidence
