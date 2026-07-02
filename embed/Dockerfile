FROM python:3.10-slim

WORKDIR /app

# Cài đặt build-essential phòng hờ biên dịch native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt PyTorch phiên bản CPU để giảm dung lượng image
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Sao chép và cài đặt các dependencies còn lại
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn của service AI
COPY . .

# Tải trước (cache) các model AI về image khi build, giúp khởi chạy container tức thì
RUN python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; SentenceTransformer('intfloat/multilingual-e5-small'); CrossEncoder('BAAI/bge-reranker-base')"

# Mở cổng 7860 (Hugging Face Spaces mặc định expose cổng này)
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
