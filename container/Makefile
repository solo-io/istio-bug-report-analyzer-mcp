DOCKER_IMAGE_NAME = claude-istio-analyzer
DOCKER_CONTAINER_NAME = claude-istio-analyzer

.PHONY: build run stop shell restart clean logs status claude install-mcp configure-mcp check-auth e2e-test

build:
	docker build -f Dockerfile-claude -t $(DOCKER_IMAGE_NAME) .

run:
	docker run -d \
		--name $(DOCKER_CONTAINER_NAME) \
		-v $(PWD)/..:/workspace \
		-v $(HOME)/.claude:/home/claude/.claude-host:ro \
		-e ANTHROPIC_AUTH_TOKEN=$(ANTHROPIC_AUTH_TOKEN) \
		-e ANTHROPIC_BASE_URL=$(ANTHROPIC_BASE_URL) \
		-e ANTHROPIC_MODEL=$(ANTHROPIC_MODEL) \
		-e ANTHROPIC_SMALL_FAST_MODEL=$(ANTHROPIC_SMALL_FAST_MODEL) \
		-it \
		$(DOCKER_IMAGE_NAME)
	@echo "Copying Claude config into container..."
	@docker exec $(DOCKER_CONTAINER_NAME) bash -c 'cp -r /home/claude/.claude-host/* /home/claude/.claude/ 2>/dev/null || true'
	@echo "Container started. Use 'make shell' to access it, or 'make claude' to launch Claude Code"

stop:
	docker stop $(DOCKER_CONTAINER_NAME) || true
	docker rm $(DOCKER_CONTAINER_NAME) || true

shell:
	docker exec -it $(DOCKER_CONTAINER_NAME) bash

claude:
	docker exec -it $(DOCKER_CONTAINER_NAME) claude --dangerously-skip-permissions

restart: stop run

clean: stop
	docker rmi $(DOCKER_IMAGE_NAME) || true

logs:
	docker logs -f $(DOCKER_CONTAINER_NAME)

status:
	@docker ps -a --filter name=$(DOCKER_CONTAINER_NAME)

# Check if Claude auth is working
check-auth:
	@echo "Checking Claude authentication..."
	@docker exec $(DOCKER_CONTAINER_NAME) claude -p "say hello" --dangerously-skip-permissions && \
		echo "Auth OK!" || \
		echo "AUTH FAILED — run 'make claude' and authenticate manually"

# Install MCP tool from local source
install-mcp:
	@echo "Building and installing istio-bug-report-analyzer-mcp from source..."
	@docker exec $(DOCKER_CONTAINER_NAME) bash -c '\
		cd /workspace && \
		npm ci && \
		npm run build && \
		npm pack && \
		npm install -g istio-bug-report-analyzer-mcp-*.tgz && \
		rm -f istio-bug-report-analyzer-mcp-*.tgz && \
		echo "Installed! Verifying..." && \
		which istio-bug-report-analyzer-mcp && \
		echo "MCP tool installed successfully"'

# Configure MCP server in Claude settings
configure-mcp:
	@echo "Configuring MCP server in Claude settings..."
	@docker exec $(DOCKER_CONTAINER_NAME) bash -c '\
		mkdir -p /home/claude/.claude && \
		SETTINGS=/home/claude/.claude/settings.json && \
		if [ ! -f "$$SETTINGS" ]; then echo "{}" > "$$SETTINGS"; fi && \
		jq ".mcpServers[\"istio-bug-report-analyzer\"] = {\"command\": \"istio-bug-report-analyzer-mcp\", \"args\": []}" "$$SETTINGS" > "$$SETTINGS.tmp" && \
		mv "$$SETTINGS.tmp" "$$SETTINGS" && \
		echo "MCP server configured:" && \
		jq .mcpServers "$$SETTINGS"'

# Run full E2E test
e2e-test: check-auth install-mcp configure-mcp
	@echo "Running E2E assessment test..."
	@docker exec $(DOCKER_CONTAINER_NAME) bash -c '\
		claude -p "\
		You have the istio-bug-report-analyzer MCP tool available. \
		Use the load_bug_report tool to load the bug report at /workspace/container/sample-files/sample-report. \
		Then use get_overview, get_analyze_results, run_diagnostics, find_errors, get_versions, get_proxy_config, get_logs, and get_istiod_debug to analyze the report. \
		Finally, write a comprehensive Istio Health Assessment document to /workspace/container/e2e-output/assessment.md with these sections: \
		1. Executive Summary \
		2. Infrastructure Snapshot \
		3. Critical Findings \
		4. High-Priority Findings \
		5. Configuration Error Remediation \
		6. Best Practices \
		7. Remediation Roadmap \
		8. Looking Ahead \
		IMPORTANT: Do NOT include any customer names in the output. Redact all customer-identifying information. \
		" --dangerously-skip-permissions --output-format text' && \
	echo "Assessment generated. Validating..." && \
	bash container/validate-assessment.sh
