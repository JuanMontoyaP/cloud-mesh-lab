.DEFAULT_GOAL:=help

# Docker Images
DATE_TAG:=$(shell date +%Y%m%d)
GIT_SHA:=$(shell git rev-parse --short HEAD)
TAG_PREFIX:=dev
IMAGE_NAME=$(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com/$(SERVICE)
IMAGE_TAG=$(TAG_PREFIX)-$(DATE_TAG)-$(GIT_SHA)

# AWS ENV Variables
AWS_REGION?=us-east-1
AWS_ACCOUNT:=$(shell aws sts get-caller-identity --query Account --output text)

.PHONY: sync lock dev build migrations run logs shell db clean

sync: ## Sync Dependencies on the environment
	uv sync

lock: ## Lock dependencies
	uv lock

dev: sync lock db ## Run the service in local
	uv run uvicorn src.main:app --reload --host 0.0.0.0 --port $(PORT)

build: sync lock ## Build Docker image
	docker build \
	--platform linux/amd64 \
	--provenance=false \
	--sbom=false \
	-t $(IMAGE_NAME):$(IMAGE_TAG) \
	.

migrations:
	uv run alembic upgrade head

run: sync lock ## Run development containers
	docker-compose up -d && uv run alembic upgrade head

logs: run ## See app logs
	docker-compose logs -f $(SERVICE)

shell: ## Run shell on container development
	docker-compose exec $(SERVICE) /bin/bash

db: ## Run local DB for development
	docker-compose -f ../docker-compose.db.yml up -d

clean: ## Clean all containers
	docker-compose down -v
	docker-compose -f ../docker-compose.db.yml down -v
