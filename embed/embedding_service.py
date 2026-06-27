from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# load model 1 lần khi start server
model = SentenceTransformer("intfloat/multilingual-e5-small")

class Request(BaseModel):
    text: str
    type: str  # "query" hoặc "passage"

@app.post("/embed")
def embed(req: Request):
    prefix = "query: " if req.type == "query" else "passage: "
    vector = model.encode(prefix + req.text).tolist()

    return {
        "embedding": vector,
        "dim": len(vector)
    }
    