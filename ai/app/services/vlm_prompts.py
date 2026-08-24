def build_left_analysis_prompt():
    return """
Analyze only the visible left-side view of the person's hair.

Return only valid JSON matching the required schema.

Allowed values:

side_length_category:
- skin
- very_short
- short
- medium
- long
- unclear

Length guide:
- short means 1-3 inches
- medium means 3-6 inches
- long means 6+ inches

ear_coverage:
- fully_exposed
- partially_covered
- fully_covered
- unclear

fade_or_taper_present:
- yes
- no
- unclear

fade_height:
- low
- mid
- high
- unclear
- not_applicable

sideburn_length:
- none
- short
- medium
- long
- unclear

Rules:
- Analyze only the visible left side.
- Use only visible evidence.
- Do not guess the right side or back.
- If no fade or taper is visible, use "not_applicable" for fade_height.
- Use the exact allowed strings above. Do not include the inch guide in the JSON value.
- Use "unclear" when the image does not support a confident answer.
- confidence must be between 0.0 and 1.0.
Required fields:
- side_length_category
- ear_coverage
- fade_or_taper_present
- fade_height
- sideburn_length
- confidence

Return every required field.
Do not omit any field.
""".strip()



def build_front_analysis_prompt():
    return """
Analyze only the visible front view of the person's hair and face.

Return only valid JSON matching the required schema.

Allowed values:

front_length_category:
- very_short
- short
- medium
- long
- very_long
- unclear

Length guide:
- short means 1-3 inches
- medium means 3-6 inches
- long means 6+ inches

forehead_coverage:
- none
- slight
- partial
- mostly_covered
- fully_covered
- unclear

fringe_end_level:
- no_fringe
- upper_forehead
- mid_forehead
- lower_forehead
- eyebrow_level
- below_eyebrows
- unclear

Rules:
- Use only visible evidence from the image.
- Do not guess hidden areas.
- Use "unclear" when the image does not support a confident answer.
- forehead_coverage describes how much of the forehead is covered by hair.
- fringe_end_level describes the lowest point reached by the front hair.
- Use the exact allowed strings above. Do not include the inch guide in the JSON value.
- confidence must be between 0.0 and 1.0.
""".strip()



def build_right_analysis_prompt():
    return """
Analyze only the visible right-side view of the person's hair.

Return only valid JSON matching the required schema.

Allowed values:

side_length_category:
- skin
- very_short
- short
- medium
- long
- unclear

Length guide:
- short means 1-3 inches
- medium means 3-6 inches
- long means 6+ inches

ear_coverage:
- fully_exposed
- partially_covered
- fully_covered
- unclear

fade_or_taper_present:
- yes
- no
- unclear

fade_height:
- low
- mid
- high
- unclear
- not_applicable

sideburn_length:
- none
- short
- medium
- long
- unclear

Rules:
- Analyze only the visible right side.
- Use only visible evidence.
- Do not guess the left side or back.
- If no fade or taper is visible, use "not_applicable" for fade_height.
- Use the exact allowed strings above. Do not include the inch guide in the JSON value.
- Use "unclear" when the image does not support a confident answer.
- confidence must be between 0.0 and 1.0.
Required fields:
- side_length_category
- ear_coverage
- fade_or_taper_present
- fade_height
- sideburn_length
- confidence

Return every required field.
Do not omit any field.
""".strip()



def build_back_analysis_prompt():
    return """
Analyze only the visible back view of the person's hair.

Return only valid JSON matching the required schema.

Allowed values:

back_length_category:
- skin
- very_short
- short
- medium
- long
- unclear

Length guide:
- short means 1-3 inches
- medium means 3-6 inches
- long means 6+ inches

back_fade_or_taper_present:
- yes
- no
- unclear

back_fade_height:
- low
- mid
- high
- unclear
- not_applicable

back_blending:
- clean
- soft
- uneven
- unclear

nape_coverage:
- exposed
- partially_covered
- fully_covered
- unclear

Rules:
- Analyze only the visible back of the head.
- Use only visible evidence.
- Do not guess the front or side views.
- If no fade or taper is visible, use "not_applicable" for back_fade_height.
- nape_coverage describes how much hair covers the lower back of the neck.
- Use the exact allowed strings above. Do not include the inch guide in the JSON value.
- Use "unclear" when the image does not support a confident answer.
- confidence must be between 0.0 and 1.0.
""".strip()
