include ../make/service.mk

PORT:=8001

.PHONY: help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"} \
		/^[a-zA-Z0-9_-]+:.*##/ { \
			printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 \
		}' $(MAKEFILE_LIST)
