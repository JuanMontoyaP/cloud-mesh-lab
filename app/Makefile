.DEFAULT_GOAL:=help

SERVICES:=gateway users tasks frontend
SERVICE:=all

.PHONY: dev build run help

help: ## Show help
	@echo "Usage:"
	@echo "  make dev   	SERVICE=gateway|users|tasks|frontend|all"
	@echo "  make build   	SERVICE=gateway|users|tasks|frontend|all"
	@echo "  make run   	SERVICE=gateway|users|tasks|frontend|all"

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
	$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE)

run: validate-service
	$(MAKE) -C $(SERVICE) $@ SERVICE=$(SERVICE)
