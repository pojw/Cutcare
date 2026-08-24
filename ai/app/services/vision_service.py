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


def generate_hair_profile(source_photos):
    required_angles = {"front", "left", "right", "back"}

    all_photos_present = all(
        angle in source_photos
        and bool(source_photos[angle].storagePath)
        for angle in required_angles
    )

    if not all_photos_present:
        raise ValueError("All four required hair photos must be provided.")

    retrieved_images = retrieve_source_images(source_photos)
    duplicate_check_source_images(retrieved_images)
    decoded_images = decode_source_images(retrieved_images)

    size_check_source_images(decoded_images)
    blur_check_source_images(decoded_images)
    lighting_check_source_images(decoded_images)
    front_crop_result = create_front_head_crop(
        decoded_images
    )

    front_head_crop = front_crop_result["headCrop"]


    front_image_base64 = pillow_image_to_base64(
        front_head_crop
    )

    print(
        "Encoded front crop length:",
        len(front_image_base64),
    )

    front_image_data_url = build_image_data_url(
        front_image_base64
    )

    print(
        "Front image data URL starts correctly:",
        front_image_data_url.startswith(
            "data:image/jpeg;base64,"
        ),
    )

    front_analysis = analyze_front_image(
        front_image_data_url
    )
    left_image_base64 = pillow_image_to_base64(
        decoded_images["left"]["image"]
    )

    right_image_base64 = pillow_image_to_base64(
        decoded_images["right"]["image"]
    )

    back_image_base64 = pillow_image_to_base64(
        decoded_images["back"]["image"]
    )

    left_image_data_url = build_image_data_url(
        left_image_base64
    )

    right_image_data_url = build_image_data_url(
        right_image_base64
    )

    back_image_data_url = build_image_data_url(
        back_image_base64
    )

    left_analysis = analyze_left_image(
        left_image_data_url
    )

    right_analysis = analyze_right_image(
        right_image_data_url
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
