import numpy as np
import cv2


FACE_CASCADE_PATH = (
    cv2.data.haarcascades
    + "haarcascade_frontalface_default.xml"
)


def create_front_head_crop(decoded_images):
    front_image = decoded_images["front"]["image"]
    image_width = decoded_images["front"]["width"]
    image_height = decoded_images["front"]["height"]

    image_array = np.array(front_image.convert("RGB"))
    grayscale = cv2.cvtColor(
        image_array,
        cv2.COLOR_RGB2GRAY,
    )

    face_detector = cv2.CascadeClassifier(FACE_CASCADE_PATH)
    if face_detector.empty():
        raise ValueError(
            "Face detection model could not be loaded."
        )

    detected_faces = face_detector.detectMultiScale(
        grayscale,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80),
    )

    if len(detected_faces) == 0:
        raise ValueError(
            "No face was detected in the front photo."
        )

    x, y, width, height = max(
        detected_faces,
        key=lambda face: face[2] * face[3],
    )

    x1 = max(0, int(x))
    y1 = max(0, int(y))
    x2 = min(image_width, int(x + width))
    y2 = min(image_height, int(y + height))

    padding_x = int(width * 0.35)
    padding_top = int(height * 0.75)
    padding_bottom = int(height * 0.25)

    head_x1 = max(0, x1 - padding_x)
    head_y1 = max(0, y1 - padding_top)
    head_x2 = min(image_width, x2 + padding_x)
    head_y2 = min(image_height, y2 + padding_bottom)

    return {
        "headCrop": front_image.crop(
            (head_x1, head_y1, head_x2, head_y2)
        ),
        "faceBox": {
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "width": int(width),
            "height": int(height),
        },
    }
