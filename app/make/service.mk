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

sync: ## Sync Dependencies on the environment
	uv sync

lock: ## Lock dependencies
	uv lock

dev: sync lock db ## Run the service in local
	uv run uvicorn src.main:app --reload --host 0.0.0.0 --port $(PORT)

build: ## Build Docker image
	docker build \
	--platform linux/amd64 \
	--provenance=false \
	--sbom=false \
	-t $(IMAGE_NAME):$(IMAGE_TAG) \
	.

run: build ## Run Docker container in local
	docker run --env-file .env --rm -p $(PORT):80 $(IMAGE_NAME):$(IMAGE_TAG)

db: ## Run local DB for development
	docker-compose -f ../docker-compose.db.yml up -d

clean: ## Clean all containers
	docker-compose -f ../docker-compose.db.yml down -v
