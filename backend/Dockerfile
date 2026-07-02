# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Cài đặt các công cụ để compile native dependencies nếu có
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt toàn bộ dependencies bao gồm cả devDependencies để compile TypeScript
RUN npm ci

# Sao chép toàn bộ source code
COPY . .

# Biên dịch TypeScript sang JavaScript (lệnh này chạy cả prisma generate)
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Chỉ cài đặt dependencies cần thiết cho production (bỏ devDependencies)
RUN npm ci --only=production

# Copy Prisma Client được sinh ra ở Stage 1
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist

# Mở cổng API
EXPOSE 3000

# Khởi chạy: Thực hiện cập nhật database schema qua prisma db push và chạy server
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
