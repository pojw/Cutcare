from app.services.llmService import create_llm_client
from app.core.config import settings
from app.models.response import FrontHairAnalysis,LeftHairAnalysis,BackHairAnalysis,RightHairAnalysis
import json
import re
from app.services.vlm_prompts import build_left_analysis_prompt,build_front_analysis_prompt,build_back_analysis_prompt,build_right_analysis_prompt



def analyze_front_image(
    front_image_data_url: str,
) -> FrontHairAnalysis:
    parsed_response = request_vlm_analysis(
        image_data_url=front_image_data_url,
        prompt=build_front_analysis_prompt(),
    )

    return FrontHairAnalysis.model_validate(
        parsed_response
    )

def analyze_back_image(
        back_image_data_url:str,
)-> BackHairAnalysis:
    parsed_response=request_vlm_analysis(
        image_data_url=back_image_data_url,
        prompt=build_back_analysis_prompt(),
    )

    return BackHairAnalysis.model_validate(parsed_response
)


def analyze_right_image(
        right_image_data_url:str,
)->RightHairAnalysis:
    parsed_response=request_vlm_analysis(
        image_data_url=right_image_data_url,
        prompt=build_right_analysis_prompt(),
    )
    return RightHairAnalysis.model_validate(parsed_response
)



def analyze_left_image(
        left_image_data_url:str,
) -> LeftHairAnalysis:
    parsed_response = request_vlm_analysis(
        image_data_url=left_image_data_url,
        prompt=build_left_analysis_prompt(),
    )
    return LeftHairAnalysis.model_validate(parsed_response
)

def parse_json_response(generated_text: str) -> dict:
    cleaned_text = generated_text.strip()

    cleaned_text = re.sub(
        r"^```json\s*",
        "",
        cleaned_text,
        flags=re.IGNORECASE,
    )

    cleaned_text = re.sub(
        r"\s*```$",
        "",
        cleaned_text,
    )

    try:
        return json.loads(cleaned_text)

    except json.JSONDecodeError as error:
     
        raise ValueError(
            "The vision model returned invalid JSON."
        ) from error


def request_vlm_analysis(
    image_data_url: str,
    prompt: str,
) -> dict:
    client = create_llm_client()

    completion = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
       
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url,
                        },
                    },
                ],
            }
        ],
        max_completion_tokens=600,
    )

    if not completion.choices:
        raise ValueError(
            "VLM returned no completion choices."
        )

    generated_text = completion.choices[0].message.content

    if generated_text is None:
        raise ValueError(
            "VLM returned no message content."
        )

    generated_text = generated_text.strip()

    if not generated_text:
        raise ValueError(
            "VLM returned only whitespace."
        )
   

    return parse_json_response(generated_text)




