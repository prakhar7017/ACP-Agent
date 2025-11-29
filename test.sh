#!/bin/bash

echo "========================================"
echo "Agent ACP Testing Script"
echo "========================================"
echo

echo "[Test 1] Testing Help Command..."
bun run src/agent.ts --help
echo

echo "[Test 2] Testing workspace directory creation..."
rm -rf test-workspace
bun run src/agent.ts --workspace ./test-workspace --help
if [ -d "test-workspace" ]; then
    echo "✅ Workspace directory created successfully"
    rm -rf test-workspace
else
    echo "❌ Workspace directory not created"
fi
echo

echo "[Test 3] Testing with environment variables..."
export WORKSPACE_DIR=./env-test-ws
export MODEL=claude-3-opus
echo "WORKSPACE_DIR=$WORKSPACE_DIR"
echo "MODEL=$MODEL"
bun run src/agent.ts --help
unset WORKSPACE_DIR
unset MODEL
echo

echo "========================================"
echo "Manual Testing Steps:"
echo "========================================"
echo "1. Start mock server: node mock-acp.js"
echo "2. In another terminal, run: bun run src/agent.ts"
echo "3. Try: create file test.txt"
echo "4. Type 'y' to approve"
echo "========================================"

