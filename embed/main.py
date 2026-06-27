from fastapi import FastAPI
from schemas import EmbedRequest, BatchEmbedRequest, RerankRequest
from model import embed_text, embed_batch, rerank_pairs

app = FastAPI(title="Embedding Service")

# -------------------------
# HEALTH CHECK
# -------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


# -------------------------
# SINGLE EMBED
# -------------------------
@app.post("/embed")
def embed(req: EmbedRequest):
    vector = embed_text(req.text, req.is_query)

    return {
        "embedding": vector,
        "dimension": len(vector)
    }


# -------------------------
# BATCH EMBED (QUAN TRỌNG)
# -------------------------
@app.post("/embed-batch")
def embed_many(req: BatchEmbedRequest):
    vectors = embed_batch(req.texts, req.is_query)

    return {
        "embeddings": vectors,
        "count": len(vectors),
        "dimension": len(vectors[0]) if vectors else 0
    }


# -------------------------
# RERANK (MỚI)
# -------------------------
@app.post("/rerank")
def rerank(req: RerankRequest):
    scores = rerank_pairs(req.query, req.passages)

    return {
        "scores": scores
    }