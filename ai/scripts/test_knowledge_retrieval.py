from sentence_transformers import SentenceTransformer

from app.services.knowledge_service import HAIRCUT_KNOWLEDGE


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def build_searchable_text(entry: dict) -> str:
    title = entry.get("title", "")
    category = entry.get("category", "")
    tags = ", ".join(entry.get("tags", []))
    content = entry.get("content", "")

    return (
        f"Title: {title}. "
        f"Category: {category}. "
        f"Tags: {tags}. "
        f"Knowledge: {content}"
    )


def main() -> None:
    model = SentenceTransformer(MODEL_NAME)

    user_message = "I want a short messy haircut that is easy to style."

    knowledge_texts = [
        build_searchable_text(entry)
        for entry in HAIRCUT_KNOWLEDGE
    ]

    knowledge_embeddings = model.encode(
        knowledge_texts,
        normalize_embeddings=True,
    )

    query_embedding = model.encode(
        user_message,
        normalize_embeddings=True,
    )

    scored_entries = []

    for index, entry in enumerate(HAIRCUT_KNOWLEDGE):
        similarity = query_embedding @ knowledge_embeddings[index]

        scored_entries.append(
            {
                "score": float(similarity),
                "entry": entry,
            }
        )

    scored_entries.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    print(f"\nUser message: {user_message}\n")

    for result in scored_entries:
        entry = result["entry"]

        print(f"{entry['title']}: {result['score']:.4f}")
        print(entry["content"])
        print()


if __name__ == "__main__":
    main()