from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    require_matching_client_id,
)
from app.models.requests import VisionAnalyzeRequest
from app.models.response import SavedHairProfileResponse
from app.services.profile_storage_service import save_hair_profile
from app.services.vision_service import generate_hair_profile


router = APIRouter(
    prefix="/vision",
    tags=["Vision"],
)


@router.post(
    "/analyze-profile",
    response_model=SavedHairProfileResponse,
)
def analyze_profile(
    request: VisionAnalyzeRequest,
    current_user: AuthenticatedUser = Depends(
        get_current_user
    ),
):
    require_matching_client_id(
        client_id=request.clientId,
        current_user=current_user,
    )

    try:
        analysis_result = generate_hair_profile(
            source_photos=request.sourcePhotos,
        )

        profile_prediction = {
            "angleAnalyses": {
                angle: analysis.model_dump()
                for angle, analysis
                in analysis_result["angleAnalyses"].items()
            },
            "unifiedProfile": (
                analysis_result["unifiedProfile"].model_dump()
            ),
        }
        saved_profile = save_hair_profile(
            client_id=request.clientId,
            original_ai_prediction=profile_prediction,
            photo_angles=request.photoAngles,
            source_photos=request.sourcePhotos,

        )

        return {
            **saved_profile,
            "storageEnabled": True,
        }

    except ValueError as error:
        print("Hair profile validation error:", str(error))

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "Hair profile analysis failed:",
            repr(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze and save hair profile.",
        ) from error