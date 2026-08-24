from typing import Any
from firebase_admin import storage
from io import BytesIO
from PIL import Image
import cv2
import numpy as np
import hashlib
import base64

def retrieve_source_images(source_photos):
    # the idea is to use the firebase creidtiaons and the sorucephotos.storagepath to pull the users phtos they uplaod in the froned
    # so tbh idon tkow ecaclty how but can figure it out, okay so lets start with first having acces sto the storagedatabase,

    bucket = storage.bucket()
    retrieved_images = {}
    for angle, photo in source_photos.items():
        blob = bucket.blob(photo.storagePath)

        if not blob.exists():
            raise ValueError(f"Missing uploaded photo for angle: {angle}")
       
        image_bytes = blob.download_as_bytes()
        if not image_bytes:
            raise ValueError(f"Uploaded photo is empty for angle: {angle}")
        retrieved_images[angle] = {
            "bytes":image_bytes,
            "mimeType":photo.mimeType
        
        }
    return retrieved_images


        
def decode_source_images(retrieved_images):
    decoded_images = {}

    for angle, image_data in retrieved_images.items():
        image_bytes = image_data["bytes"]

        image = Image.open(BytesIO(image_bytes))
        image.load()
        decoded_images[angle] = {
            "image": image,
            "mimeType": image_data["mimeType"],
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "mode": image.mode,
        }

    return decoded_images

def size_check_source_images(decoded_images):
    MIN_WIDTH = 600
    MIN_HEIGHT = 600
    MIN_PIXELS = 500_000

    for angle, image_data in decoded_images.items():
        width = image_data["width"]
        height = image_data["height"]
        total_pixels = width * height

        if width < MIN_WIDTH:
            raise ValueError(
                f"Photo width is too small for angle: {angle}"
            )

        if height < MIN_HEIGHT:
            raise ValueError(
                f"Photo height is too small for angle: {angle}"
            )

        if total_pixels < MIN_PIXELS:
            raise ValueError(
                f"Photo resolution is too low for angle: {angle}"
            )

    return True


def calculate_blur_score(pillow_image):
    image_array = np.array(pillow_image.convert("RGB"))
    grayscale = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)

    return cv2.Laplacian(grayscale, cv2.CV_64F).var()


def blur_check_source_images(decoded_images):
    MIN_BLUR_SCORE = 50.0

    for angle, image_data in decoded_images.items():
        image = image_data["image"]
        blur_score = calculate_blur_score(image)
        print(
            f"{angle} blur score: {blur_score}"
        )

        if blur_score < MIN_BLUR_SCORE:
            raise ValueError(
                f"The {angle} photo appears too blurry."
            )
   

def calculate_brightness(pillow_image):
    grayscale = pillow_image.convert("L")
    pixels = np.array(grayscale)

    return float(pixels.mean())

def lighting_check_source_images(decoded_images):
    MIN_BRIGHTNESS = 45
    MAX_BRIGHTNESS = 220

    for angle, image_data in decoded_images.items():
        image = image_data["image"]
        brightness = calculate_brightness(image)


        if brightness < MIN_BRIGHTNESS:
            raise ValueError(
                f"The {angle} photo is too dark."
            )

        if brightness > MAX_BRIGHTNESS:
            raise ValueError(
                f"The {angle} photo is too bright."
            )
def generate_mock_hair_profile(photo_angles: list[str]) -> dict[str, Any]:
    """
    Generates ea mock AI hair profile prediction.

    This is still mock data. Later, this function can call a real
    vision model while keeping the same output shape.
    """

    source_coverage = {
        "front": "front" in photo_angles,
        "left": "left" in photo_angles,
        "right": "right" in photo_angles,
        "back": "back" in photo_angles,
    }

    return {
        "hair": {
            "overallLengthCategory": "medium",
            "frontLengthInches": "4-6",
            "sideLengthInches": "1-2",
            "backLengthInches": "3-5",
            "texture": "wavy",
            "currentStyle": "medium textured top with shorter sides",
        },
        "face": {
            "shape": "oval",
            "facialHair": "light stubble",
        },
        "cutDetails": {
            "hasFadeOrTaper": True,
            "fadeType": "low taper",
            "neckline": "natural",
            "earCoverage": "above ear",
        },
        "confidence": {
            "overallLength": 0.84,
            "texture": 0.75,
            "faceShape": 0.68,
            "fadeType": 0.71,
        },
        "sourceCoverage": source_coverage,
    }


def calculate_image_hash(image_bytes):
    return hashlib.sha256(image_bytes).hexdigest()

def duplicate_check_source_images(retrieved_images):

    seen_hashes = {}

    for angle, image_data in retrieved_images.items():
        image_hash = calculate_image_hash(
            image_data["bytes"]
        )

        if image_hash in seen_hashes:
            original_angle = seen_hashes[image_hash]

            raise ValueError(
                f"The {angle} photo is the same as the "
                f"{original_angle} photo."
            )

        seen_hashes[image_hash] = angle

    return True




def pillow_image_to_base64(pillow_image):
    buffer = BytesIO()

    pillow_image.convert("RGB").save(
        buffer,
        format="JPEG",
        quality=90,
    )

    image_bytes = buffer.getvalue()

    return base64.b64encode(image_bytes).decode("utf-8")
