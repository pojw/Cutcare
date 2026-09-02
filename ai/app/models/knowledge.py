from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field

class KnowledgeDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id:str = Field(min_length=1)
    title:str = Field(min_length=1)
    category: Literal["haircut", "product", "barber_tip"]
    tags: List[str] = Field(default_factory=list)
    content: str = Field(min_length=1)