from app.core.firebase import initialize_firebase
from app.models.requests import VisionSourcePhoto
from app.services.vision_service import generate_hair_profile

initialize_firebase()

source_photos = {
    "front": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/0LtMc6BIndnm8w4YhhkO/front.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
    "left": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/0LtMc6BIndnm8w4YhhkO/left.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
    "right": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/0LtMc6BIndnm8w4YhhkO/right.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
    "back": VisionSourcePhoto(
        storagePath="clients/FjrPoH3i7DQvnx5cuiLqCWscUG63/hairProfiles/uploads/0LtMc6BIndnm8w4YhhkO/back.jpg",
        width=1200,
        height=1600,
        mimeType="image/jpeg",
    ),
}
result = generate_hair_profile(source_photos)

result = generate_hair_profile(source_photos)

for angle, analysis in result.items():
    print(angle, analysis.model_dump())


