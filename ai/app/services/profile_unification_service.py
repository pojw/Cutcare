from collections import Counter
from typing import Optional

from app.models.hair_profile import (
    UnifiedConfidence,
    UnifiedCutDetails,
    UnifiedFrontDetails,
    UnifiedHairDetails,
    UnifiedHairProfile,
)
from app.models.response import (
    BackHairAnalysis,
    FrontHairAnalysis,
    LeftHairAnalysis,
    RightHairAnalysis,
)


def choose_matching_side_value(
    left_value: Optional[str],
    right_value: Optional[str],
    *,
    disagreement_value: str = "unclear",
) -> str:
    """
    Combines a matching field from the left and right analyses.

    Rules:
    - If both sides agree, use that value.
    - If one side is unclear or missing, use the clearer side.
    - If both sides are clear but disagree, use disagreement_value.
    """

    if left_value == right_value and left_value is not None:
        return left_value

    if left_value in {None, "unclear"}:
        return right_value or "unclear"

    if right_value in {None, "unclear"}:
        return left_value

    return disagreement_value


def unify_side_length(
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
) -> str:
    return choose_matching_side_value(
        left_analysis.side_length_category,
        right_analysis.side_length_category,
        disagreement_value="unclear",
    )


def unify_ear_coverage(
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
) -> str:
    return choose_matching_side_value(
        left_analysis.ear_coverage,
        right_analysis.ear_coverage,
        disagreement_value="mixed",
    )


def unify_sideburn_length(
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
) -> str:
    return choose_matching_side_value(
        left_analysis.sideburn_length,
        right_analysis.sideburn_length,
        disagreement_value="mixed",
    )


def unify_fade_or_taper_present(
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
    back_analysis: BackHairAnalysis,
) -> str:
    """
    Combines fade/taper observations from both sides and the back.

    Rules:
    - If any angle clearly detects a fade or taper, return yes.
    - If all clear angles say no, return no.
    - Otherwise return unclear.
    """

    values = [
        left_analysis.fade_or_taper_present,
        right_analysis.fade_or_taper_present,
        back_analysis.back_fade_or_taper_present,
    ]

    if "yes" in values:
        return "yes"

    clear_values = [
        value
        for value in values
        if value not in {None, "unclear"}
    ]

    if clear_values and all(
        value == "no"
        for value in clear_values
    ):
        return "no"

    return "unclear"


def unify_fade_height(
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
    back_analysis: BackHairAnalysis,
    fade_or_taper_present: str,
) -> str:
    """
    Combines fade-height observations.

    If no fade or taper is present, the height is not applicable.
    Otherwise, the most common clear height is selected.
    """

    if fade_or_taper_present == "no":
        return "not_applicable"

    values = [
        left_analysis.fade_height,
        right_analysis.fade_height,
        back_analysis.back_fade_height,
    ]

    clear_values = [
        value
        for value in values
        if value not in {
            None,
            "unclear",
            "not_applicable",
        }
    ]

    if not clear_values:
        return "unclear"

    counts = Counter(clear_values)
    most_common_value, most_common_count = counts.most_common(1)[0]

    tied_values = [
        value
        for value, count in counts.items()
        if count == most_common_count
    ]

    if len(tied_values) > 1:
        return "unclear"

    return most_common_value


def unify_overall_length(
    front_analysis: FrontHairAnalysis,
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
    back_analysis: BackHairAnalysis,
) -> str:
    """
    Chooses the most representative overall hair length.

    The function combines front, left, right, and back length categories
    and selects the most common clear value.
    """

    values = [
        front_analysis.front_length_category,
        left_analysis.side_length_category,
        right_analysis.side_length_category,
        back_analysis.back_length_category,
    ]

    clear_values = [
        value
        for value in values
        if value not in {None, "unclear"}
    ]

    if not clear_values:
        return "unclear"

    counts = Counter(clear_values)
    most_common_value, most_common_count = counts.most_common(1)[0]

    tied_values = [
        value
        for value, count in counts.items()
        if count == most_common_count
    ]

    if len(tied_values) > 1:
        return "unclear"

    return most_common_value


def calculate_overall_confidence(
    front_analysis: FrontHairAnalysis,
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
    back_analysis: BackHairAnalysis,
) -> float:
    """
    Calculates the average confidence across all four image analyses.
    """

    confidence_values = [
        front_analysis.confidence,
        left_analysis.confidence,
        right_analysis.confidence,
        back_analysis.confidence,
    ]

    average = sum(confidence_values) / len(confidence_values)

    return round(average, 3)


def unify_hair_profile(
    front_analysis: FrontHairAnalysis,
    left_analysis: LeftHairAnalysis,
    right_analysis: RightHairAnalysis,
    back_analysis: BackHairAnalysis,
) -> UnifiedHairProfile:
    """
    Combines four angle-specific analyses into one normalized hair profile.
    """

    side_length = unify_side_length(
        left_analysis,
        right_analysis,
    )

    ear_coverage = unify_ear_coverage(
        left_analysis,
        right_analysis,
    )

    sideburn_length = unify_sideburn_length(
        left_analysis,
        right_analysis,
    )

    fade_or_taper_present = unify_fade_or_taper_present(
        left_analysis,
        right_analysis,
        back_analysis,
    )

    fade_height = unify_fade_height(
        left_analysis,
        right_analysis,
        back_analysis,
        fade_or_taper_present,
    )

    overall_length = unify_overall_length(
        front_analysis,
        left_analysis,
        right_analysis,
        back_analysis,
    )

    overall_confidence = calculate_overall_confidence(
        front_analysis,
        left_analysis,
        right_analysis,
        back_analysis,
    )

    return UnifiedHairProfile(
        hair=UnifiedHairDetails(
            overall_length_category=overall_length,
            front_length_category=(
                front_analysis.front_length_category
                or "unclear"
            ),
            side_length_category=side_length,
            back_length_category=(
                back_analysis.back_length_category
                or "unclear"
            ),
            texture=front_analysis.texture or "unclear",
        ),
        front=UnifiedFrontDetails(
            hairline_shape=(
                front_analysis.hairline_shape
                or "unclear"
            ),
            forehead_coverage=(
                front_analysis.forehead_coverage
                or "unclear"
            ),
            fringe_end_level=(
                front_analysis.fringe_end_level
                or "unclear"
            ),
            face_shape=(
                front_analysis.face_shape
                or "unclear"
            ),
        ),
        cut_details=UnifiedCutDetails(
            fade_or_taper_present=fade_or_taper_present,
            fade_height=fade_height,
            ear_coverage=ear_coverage,
            sideburn_length=sideburn_length,
            back_blending=(
                back_analysis.back_blending
                or "unclear"
            ),
            nape_coverage=(
                back_analysis.nape_coverage
                or "unclear"
            ),
        ),
        confidence=UnifiedConfidence(
            front=front_analysis.confidence,
            left=left_analysis.confidence,
            right=right_analysis.confidence,
            back=back_analysis.confidence,
            overall=overall_confidence,
        ),
    )
