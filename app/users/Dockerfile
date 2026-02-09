# ----------------------------
# Builder stage
# ----------------------------
FROM python:3.14-alpine AS builder

RUN apk add --no-cache \
    gcc \
    g++ \
    musl-dev \
    mariadb-dev \
    pkgconfig \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Create venv and install dependencies
RUN uv sync --frozen --no-cache --no-dev

COPY src ./src

# ----------------------------
# Runtime stage
# ----------------------------
FROM python:3.14-alpine

# Security & performance
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

EXPOSE 80

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "80"]
