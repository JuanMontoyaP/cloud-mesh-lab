.DEFAULT_GOAL:=help

SERVICES:=users tasks
SERVICE:=all
PARALLELISM:=$(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

BUILD_TARGETS:=$(addprefix build-,$(SERVICES))

.PHONY: dev build run clean help validate-service build-%

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

build: validate-service
	@if [ "$(SERVICE)" == "all" ]; then \
		echo "Service"; \
		$(MAKE) $(BUILD_TARGETS) -j$(PARALLELISM); \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi

build-%:
	echo "Building $* service..."
	$(MAKE) -C $* build SERVICE=$*

run: validate-service
	@if [ "$(SERVICE)" == "all" ]; then \
		docker-compose -f docker-compose.all.yml up -d --build; \
		for service in $(SERVICES); do \
			$(MAKE) -C $$service migrations; \
		done; \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi

clean: validate-service
	@if [ "$(SERVICE)" == "all" ]; then \
		docker-compose -f docker-compose.all.yml down -v --remove-orphans; \
	else \
		$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE); \
	fi
