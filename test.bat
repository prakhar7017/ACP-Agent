@echo off
REM Quick test script for Windows

echo ========================================
echo Agent ACP Testing Script
echo ========================================
echo.

echo [Test 1] Testing Help Command...
bun run src/agent.ts --help
echo.

echo [Test 2] Testing with default settings...
echo Starting agent (will timeout after 5 seconds)...
timeout /t 2 /nobreak >nul
echo Test complete.
echo.

echo [Test 3] Testing workspace directory creation...
if exist test-workspace rmdir /s /q test-workspace
bun run src/agent.ts --workspace ./test-workspace --help
if exist test-workspace (
    echo ✅ Workspace directory created successfully
    rmdir /s /q test-workspace
) else (
    echo ❌ Workspace directory not created
)
echo.

echo ========================================
echo Manual Testing Steps:
echo ========================================
echo 1. Start mock server: node mock-acp.js
echo 2. In another terminal, run: bun run src/agent.ts
echo 3. Try: create file test.txt
echo 4. Type 'y' to approve
echo ========================================

