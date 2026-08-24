from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def main() -> None:
    print("Loading embedding model...")

    model = SentenceTransformer(MODEL_NAME)

    test_sentences = [
    "A textured crop works well with short, textured hair.",
    "I want a short messy haircut.",
    "Would a textured crop fit me?",
    "My car needs new tires.",
]
    embeddings = model.encode(
        test_sentences,
        normalize_embeddings=True,
    )

    for index in range(1, len(embeddings)):
        similarity = embeddings[0] @ embeddings[index]

        print(
            f"Similarity with sentence {index + 1}: "
            f"{similarity:.4f}"
    )

if __name__ == "__main__":
    main()