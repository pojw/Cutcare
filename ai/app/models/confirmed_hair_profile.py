from typing import ClassVar, Literal, Optional

from pydantic import BaseModel, ConfigDict


class ConfirmedHairProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    PROFILE_CONTEXT_FIELDS: ClassVar[list[str]] = [
        "overallLengthCategory",
        "frontLengthCategory",
        "sideLengthCategory",
        "backLengthCategory",
        "texture",
        "density",
        "hairlineShape",
        "foreheadCoverage",
        "fringeEndLevel",
        "faceShape",
        "fadeOrTaperPresent",
        "fadeHeight",
        "earCoverage",
        "sideburnLength",
        "backBlending",
        "napeCoverage",
    ]

    RETRIEVAL_QUERY_FIELDS: ClassVar[list[str]] = [
        "overallLengthCategory",
        "frontLengthCategory",
        "sideLengthCategory",
        "backLengthCategory",
        "texture",
        "density",
        "faceShape",
        "fadeOrTaperPresent",
        "fadeHeight",
    ]

    overallLengthCategory: Optional[str] = None
    frontLengthCategory: Optional[str] = None
    sideLengthCategory: Optional[str] = None
    backLengthCategory: Optional[str] = None
    texture: Optional[Literal["straight", "wavy", "curly", "coily", "unclear"]] = None
    density: Optional[str] = None
    hairlineShape: Optional[str] = None
    foreheadCoverage: Optional[str] = None
    fringeEndLevel: Optional[str] = None
    faceShape: Optional[str] = None
    fadeOrTaperPresent: Optional[str] = None
    fadeHeight: Optional[str] = None
    earCoverage: Optional[str] = None
    sideburnLength: Optional[str] = None
    backBlending: Optional[str] = None
    napeCoverage: Optional[str] = None
