.DEFAULT_GOAL:=help

SERVICES:=gateway users orders frontend
SERVICE:=all

.PHONY: dev build run help

help: ## Show help
	@echo "Usage:"
	@echo "  make dev   	SERVICE=gateway|users|orders|frontend|all"
	@echo "  make build   	SERVICE=gateway|users|orders|frontend|all"
	@echo "  make run   	SERVICE=gateway|users|orders|frontend|all"

validate-service:
	@if [ "$(SERVICE)" != "all" ] && \
		[ "$(SERVICE)" != "gateway" ] && \
		[ "$(SERVICE)" != "users" ] && \
		[ "$(SERVICE)" != "orders" ] && \
		[ "$(SERVICE)" != "frontend" ]; then \
		echo "Invalid SERVICE: $(SERVICE)"; \
		exit 1; \
	fi

dev: validate-service
	$(MAKE) -C $(SERVICE) $@

build: validate-service
	$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE)

run: validate-service
	$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE)
