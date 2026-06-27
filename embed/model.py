from sentence_transformers import SentenceTransformer, CrossEncoder

# load 1 lần duy nhất
model = SentenceTransformer("intfloat/multilingual-e5-small")
rerank_model = CrossEncoder("BAAI/bge-reranker-base")

def embed_text(text: str, is_query: bool = False):
    prefix = "query: " if is_query else "passage: "
    return model.encode(prefix + text).tolist()


def embed_batch(texts: list[str], is_query: bool = False):
    prefix = "query: " if is_query else "passage: "
    inputs = [prefix + t for t in texts]
    return model.encode(inputs).tolist()


def rerank_pairs(query: str, passages: list[str]) -> list[float]:
    if not passages:
        return []
    pairs = [[query, p] for p in passages]
    scores = rerank_model.predict(pairs)
    # Convert numpy float to python float
    return [float(score) for score in scores]