# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/top-100-ui
COPY top-100-ui/package*.json ./
RUN npm install
COPY top-100-ui/ ./
RUN npm run build

# Stage 2: Serve via FastAPI Backend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PORT=8000

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py rounds_data.json ./
COPY --from=frontend-builder /app/top-100-ui/dist /app/top-100-ui/dist

EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
