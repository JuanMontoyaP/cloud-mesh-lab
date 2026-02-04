.DEFAULT_GOAL:=help
SERVICE?=all

.PHONY: help dev

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} \
		/^[a-zA-Z0-9_-]+:.*##/ { \
			printf "\033[36m%-25s\033[0m %s\n", $$1, $$2 \
		}' $(MAKEFILE_LIST)

dev: ## Run dev service SERVICE=gateway|users|orders|frontend|all
	@$(MAKE) -C app dev SERVICE=$(SERVICE)

build: ## Build Docker images SERVICE=gateway|users|orders|frontend|all
	@$(MAKE) -C app build SERVICE=$(SERVICE)

run: ## Run service SERVICE=gateway|users|orders|frontend|all
	@$(MAKE) -C app run SERVICE=$(SERVICE)
