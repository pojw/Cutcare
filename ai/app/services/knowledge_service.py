HAIRCUT_KNOWLEDGE = [
    {
        "id": "textured-crop-basics",
        "title": "Textured Crop",
        "category": "haircut",
        "tags": [
            "textured crop",
            "crop",
            "texture",
            "short haircut",
            "thick hair",
            "straight hair",
            "wavy hair",
        ],
        "content": (
            "A textured crop keeps the top short with visible texture and is "
            "often paired with a taper or fade. It usually works well for "
            "straight, wavy, or thick hair and can help create a fuller look."
        ),
    },
    {
        "id": "low-taper-basics",
        "title": "Low Taper",
        "category": "haircut",
        "tags": [
            "low taper",
            "taper",
            "fade",
            "sideburns",
            "neckline",
            "low maintenance",
        ],
        "content": (
            "A low taper gradually shortens the hair around the sideburns and "
            "neckline while keeping more length around the sides. It gives a "
            "clean finish without creating as much contrast as a skin fade."
        ),
    },
    {
        "id": "fringe-basics",
        "title": "Fringe",
        "category": "haircut",
        "tags": [
            "fringe",
            "bangs",
            "forehead",
            "face shape",
            "textured fringe",
        ],
        "content": (
            "A fringe brings hair forward over part of the forehead. A textured "
            "fringe can soften longer facial proportions, but the final length "
            "should account for shrinkage, curls, and the client's hairline."
        ),
    },
    {
        "id": "crew-cut-basics",
        "title": "Crew Cut Basics",
        "category": "haircut",
        "tags": [
            "crew cut",
            "short haircut",
            "easy haircut",
            "low maintenance",
        ],
        "content": (
            "A crew cut keeps the top short with the front slightly longer than the "
            "crown. It is practical and low maintenance, but still needs regular cuts "
            "to preserve its shape."
        ),
    },
    {
        "id": "barber-request-guidance",
        "title": "What to Ask the Barber",
        "category": "barber_communication",
        "tags": [
            "ask my barber",
            "tell my barber",
            "barber request",
            "consultation",
            "reference photo",
        ],
        "content": (
            "A useful barber request should describe the desired top length, side length, "
            "fade or taper height, texture, neckline, and styling preference. A reference "
            "photo helps, but the barber should adapt it to the client's hair texture, "
            "hairline, and growth pattern."
        ),
    },
]


def get_relevant_haircut_knowledge(
    user_message: str,
    hair_profile: dict | None = None,
) -> list[dict]:
    normalized_message = " ".join(user_message.lower().split())

    scored_entries = []

    for entry in HAIRCUT_KNOWLEDGE:
        score = 0

        title = entry.get("title", "").lower()
        tags = entry.get("tags", [])

        if title and title in normalized_message:
            score += 3

        for tag in tags:
            normalized_tag = tag.lower().strip()

            if normalized_tag and normalized_tag in normalized_message:
                # Multi-word phrases are usually more specific.
                score += 2 if " " in normalized_tag else 1

        if score > 0:
            scored_entries.append((score, entry))

    scored_entries.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return [
        entry
        for _, entry in scored_entries[:3]
    ]


if __name__ == "__main__":
    test_message = "Would a textured crop work with my thick hair?"

    results = get_relevant_haircut_knowledge(
        user_message=test_message,
    )

    for result in results:
        print(result["title"])
        print(result["content"])
        print()
