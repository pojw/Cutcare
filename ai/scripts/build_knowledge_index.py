import sys
from pathlib import Path


AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(AI_ROOT))

import numpy as np
from sentence_transformers import SentenceTransformer

from app.services.knowledge_service import (
    build_searchable_text,
    load_knowledge_documents,
)


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def main() -> None:
    documents = load_knowledge_documents()

    searchable_texts = [
        build_searchable_text(document)
        for document in documents
    ]

    model = SentenceTransformer(MODEL_NAME)

    embeddings = model.encode(
        searchable_texts,
        normalize_embeddings=True,
    )

    index_dir = Path(__file__).resolve().parents[1] / "data" / "rag_index"
    index_dir.mkdir(parents=True, exist_ok=True)

    index_path = index_dir / "haircuts_index.npz"

    np.savez(
        index_path,
        ids=np.array([document.id for document in documents]),
        embeddings=embeddings,
    )

    print(f"Saved {len(documents)} knowledge embeddings to {index_path}")


if __name__ == "__main__":
    main()