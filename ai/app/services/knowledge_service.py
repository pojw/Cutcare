import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from app.models.confirmed_hair_profile import ConfirmedHairProfile
from app.models.knowledge import KnowledgeDocument


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

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


@lru_cache(maxsize=1)
def load_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def get_relevant_haircut_knowledge(
    user_message: str,
    hair_profile: dict | None = None,
) -> list[dict]:
    model = load_embedding_model()
    ids, embeddings = load_knowledge_index()

    retrieval_query = build_retrieval_query(
        user_message=user_message,
        hair_profile=hair_profile,
    )

    query_embedding = model.encode(
        retrieval_query,
        normalize_embeddings=True,
    )

    similarities = embeddings @ query_embedding

    top_indexes = np.argsort(similarities)[::-1][:3]

    relevant_documents = []

    for index in top_indexes:
        document_id = str(ids[index])
        document = get_knowledge_document_by_id(document_id)

        if document:
            relevant_documents.append(document.model_dump())

    return relevant_documents


if __name__ == "__main__":
    test_message = "Would a textured crop work with my thick hair?"

    results = get_relevant_haircut_knowledge(
        user_message=test_message,
    )

    for result in results:
        print(result["title"])
        print(result["content"])
        print()


def build_searchable_text(document: KnowledgeDocument) -> str:
    tags = ", ".join(document.tags)

    return (
        f"Title: {document.title}. "
        f"Category: {document.category}. "
        f"Tags: {tags}. "
        f"Knowledge: {document.content}"
    )


@lru_cache(maxsize=1)
def load_knowledge_documents() -> list[KnowledgeDocument]:
    knowledge_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "rag_docs"
        / "haircuts.json"
    )

    with knowledge_path.open("r", encoding="utf-8") as knowledge_file:
        raw_documents = json.load(knowledge_file)

    return [
        KnowledgeDocument.model_validate(raw_document)
        for raw_document in raw_documents
    ]


def get_knowledge_document_by_id(document_id: str) -> KnowledgeDocument | None:
    documents = load_knowledge_documents()

    for document in documents:
        if document.id == document_id:
            return document

    return None


@lru_cache(maxsize=1)
def load_knowledge_index() -> tuple[np.ndarray, np.ndarray]:
    index_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "rag_index"
        / "haircuts_index.npz"
    )

    index_data = np.load(index_path)

    return index_data["ids"], index_data["embeddings"]


def build_retrieval_query(
    user_message: str,
    hair_profile: dict | None = None,
) -> str:
    if not hair_profile:
        return user_message

    query_parts = [user_message]

    for field in ConfirmedHairProfile.RETRIEVAL_QUERY_FIELDS:
        value = hair_profile.get(field)

        if value is not None:
            query_parts.append(f"{field}: {value}")

    return ". ".join(query_parts)
