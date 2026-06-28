from pydantic import BaseModel
from typing import List

class EmbedRequest(BaseModel):
    text: str
    is_query: bool = False


class BatchEmbedRequest(BaseModel):
    texts: List[str]
    is_query: bool = False

class RerankRequest(BaseModel):
    query: str
    passages: List[str]