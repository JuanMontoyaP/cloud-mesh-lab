.DEFAULT_GOAL:=help

SERVICES:=users tasks
SERVICE:=all
PARALLELISM:=$(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# AWS ENV Variables
AWS_REGION?=us-east-1
AWS_ACCOUNT:=$(shell aws sts get-caller-identity --query Account --output text)

BUILD_TARGETS:=$(addprefix build-,$(SERVICES))
PUSH_TARGETS:=$(addprefix push-,$(SERVICES))

.PHONY: dev build run clean help validate-service logs push build-% push-%

help: ## Show help
	@echo "Usage:"
	@echo "  make dev   	SERVICE=gateway|users|tasks|frontend|all"
	@echo "  make build   	SERVICE=gateway|users|tasks|frontend|all"
	@echo "  make run   	SERVICE=gateway|users|tasks|frontend|all"
	@echo "  make clean   	SERVICE=gateway|users|tasks|frontend|all"

validate-service:
	@if [ "$(SERVICE)" != "all" ] && \
		[ "$(SERVICE)" != "gateway" ] && \
		[ "$(SERVICE)" != "users" ] && \
		[ "$(SERVICE)" != "tasks" ] && \
		[ "$(SERVICE)" != "frontend" ]; then \
		echo "Invalid SERVICE: $(SERVICE)"; \
		exit 1; \
	fi

dev: validate-service
	$(MAKE) -C $(SERVICE) $@

sessions: ## Login into AWS ECR
	@aws ecr get-login-password \
		--region $(AWS_REGION) | \
		docker login \
		--username AWS \
		--password-stdin $(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com

build: validate-service
	@if [ "$(SERVICE)" == "all" ]; then \
		$(MAKE) $(BUILD_TARGETS) -j$(PARALLELISM); \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi

push: sessions
	@if [ "$(SERVICE)" == "all" ]; then \
		$(MAKE) $(PUSH_TARGETS) -j$(PARALLELISM); \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi

push-%:
	echo "Pushing $* service..."
	@$(MAKE) -C $* push SERVICE=$*

build-%:
	echo "Building $* service..."
	@$(MAKE) -C $* build SERVICE=$*

run: validate-service
	@if [ "$(SERVICE)" == "all" ]; then \
		docker-compose -f docker-compose.all.yml build --parallel; \
		docker-compose -f docker-compose.all.yml up -d; \
		for service in $(SERVICES); do \
			$(MAKE) -C $$service migrations; \
		done; \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi

logs:
	@$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE)

clean: validate-service
	@if [ "$(SERVICE)" == "all" ]; then \
		docker-compose -f docker-compose.all.yml down -v --remove-orphans; \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi
