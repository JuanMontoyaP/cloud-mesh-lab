.DEFAULT_GOAL:=help
SERVICE?=all

.PHONY: help build run clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} \
		/^[a-zA-Z0-9_-]+:.*##/ { \
			printf "\033[36m%-25s\033[0m %s\n", $$1, $$2 \
		}' $(MAKEFILE_LIST)

build: ## Build Docker images SERVICE=gateway|users|tasks|frontend|all
	@$(MAKE) -C app build SERVICE=$(SERVICE)

run: ## Run service SERVICE=gateway|users|tasks|frontend|all
	@$(MAKE) -C app run SERVICE=$(SERVICE)

clean: ## Run service SERVICE=gateway|users|tasks|frontend|all
	@$(MAKE) -C app run SERVICE=$(SERVICE)
