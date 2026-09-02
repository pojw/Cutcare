from app.services.face_detection_service import create_front_head_crop
from app.services.image_processing import (
    blur_check_source_images,
    decode_source_images,
    duplicate_check_source_images,
    lighting_check_source_images,
    pillow_image_to_base64,
    retrieve_source_images,
    size_check_source_images,
)
from app.services.vlm_service import (
    analyze_front_image,
    analyze_left_image,
    analyze_right_image,
    analyze_back_image,
)
from app.services.profile_unification_service import (
    unify_hair_profile,
)
from app.models.response import (
    BackHairAnalysis,
    FrontHairAnalysis,
    LeftHairAnalysis,
    RightHairAnalysis,
)


def generate_hair_profile(source_photos):
    if not source_photos:
        raise ValueError("At least one hair photo must be provided.")

    retrieved_images = retrieve_source_images(source_photos)
    duplicate_check_source_images(retrieved_images)
    decoded_images = decode_source_images(retrieved_images)

    size_check_source_images(decoded_images)
    blur_check_source_images(decoded_images)
    lighting_check_source_images(decoded_images)
    front_analysis = build_unclear_front_analysis()
    left_analysis = build_unclear_left_analysis()
    right_analysis = build_unclear_right_analysis()
    back_analysis = build_unclear_back_analysis()

    if "front" in decoded_images:
        front_crop_result = create_front_head_crop(
            decoded_images
        )

        front_head_crop = front_crop_result["headCrop"]

        front_image_base64 = pillow_image_to_base64(
            front_head_crop
        )

        front_image_data_url = build_image_data_url(
            front_image_base64
        )

        front_analysis = analyze_front_image(
            front_image_data_url
        )

    if "left" in decoded_images:
        left_image_base64 = pillow_image_to_base64(
            decoded_images["left"]["image"]
        )

        left_image_data_url = build_image_data_url(
            left_image_base64
        )

        left_analysis = analyze_left_image(
            left_image_data_url
        )

    if "right" in decoded_images:
        right_image_base64 = pillow_image_to_base64(
            decoded_images["right"]["image"]
        )

        right_image_data_url = build_image_data_url(
            right_image_base64
        )

        right_analysis = analyze_right_image(
            right_image_data_url
        )

    if "back" in decoded_images:
        back_image_base64 = pillow_image_to_base64(
            decoded_images["back"]["image"]
        )

        back_image_data_url = build_image_data_url(
            back_image_base64
        )

        back_analysis = analyze_back_image(
            back_image_data_url
        )

    unified_profile = unify_hair_profile(
        front_analysis=front_analysis,
        left_analysis=left_analysis,
        right_analysis=right_analysis,
        back_analysis=back_analysis,
    )

    return {
        "angleAnalyses": {
            "front": front_analysis,
            "left": left_analysis,
            "right": right_analysis,
            "back": back_analysis,
        },
        "unifiedProfile": unified_profile,
    }


def build_image_data_url(image_base64):
    return f"data:image/jpeg;base64,{image_base64}"


def build_unclear_front_analysis() -> FrontHairAnalysis:
    return FrontHairAnalysis(
        hairline_shape="unclear",
        front_length_category="unclear",
        forehead_coverage="unclear",
        fringe_end_level="unclear",
        texture="unclear",
        face_shape="unclear",
        confidence=0.0,
    )


def build_unclear_left_analysis() -> LeftHairAnalysis:
    return LeftHairAnalysis(
        side_length_category="unclear",
        ear_coverage="unclear",
        fade_or_taper_present="unclear",
        fade_height="unclear",
        sideburn_length="unclear",
        confidence=0.0,
    )


def build_unclear_right_analysis() -> RightHairAnalysis:
    return RightHairAnalysis(
        side_length_category="unclear",
        ear_coverage="unclear",
        fade_or_taper_present="unclear",
        fade_height="unclear",
        sideburn_length="unclear",
        confidence=0.0,
    )


def build_unclear_back_analysis() -> BackHairAnalysis:
    return BackHairAnalysis(
        back_length_category="unclear",
        back_fade_or_taper_present="unclear",
        back_fade_height="unclear",
        back_blending="unclear",
        nape_coverage="unclear",
        confidence=0.0,
    )
