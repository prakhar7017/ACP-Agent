# Test Suite

This directory contains comprehensive tests for all functional features of the Agent ACP project.

## Running Tests

### Run All Tests

```bash
# Using Bun's test runner (runs all tests in parallel)
bun test tests

# Using the custom test runner (runs tests sequentially with summary)
bun run test:all
# or
bun run tests/run-all-tests.ts
```

### Run Individual Test Files

You can run individual test files using Bun's test runner:

```bash
# Run specific test file
bun test tests/boxen.test.ts

# Or use npm scripts
bun run test:boxen
bun run test:streaming
bun run test:validation
bun run test:session
bun run test:tools
bun run test:config
bun run test:cli
bun run test:preview
bun run test:spinner
bun run test:formatter
bun run test:streaming-display
```

### Run Multiple Specific Tests

Using the custom test runner, you can run multiple specific tests:

```bash
# Run specific tests by name (without .test.ts extension)
bun run tests/run-all-tests.ts boxen validation config

# This will run:
# - tests/boxen.test.ts
# - tests/validation.test.ts
# - tests/config.test.ts
```

## Test Files

| Test File | Features Tested |
|-----------|----------------|
| `boxen.test.ts` | UI box formatting with titles, padding, multiline content |
| `streaming-accumulator.test.ts` | Stream content accumulation, multiple streams, completion tracking |
| `validation.test.ts` | WebSocket URL validation, path validation, model validation, API key validation, timeout validation, config validation |
| `session.test.ts` | Session save, load, list, metadata handling, sorting |
| `tools.test.ts` | File operations (write, read), shell command execution, nested directory creation |
| `config.test.ts` | Configuration creation, environment variable handling, validation |
| `cli.test.ts` | Command-line argument parsing, all option flags |
| `preview.test.ts` | File diff preview, new file preview, edit preview |
| `spinner.test.ts` | Loading spinner, async operations with spinner |
| `formatter.test.ts` | Message formatting, all formatter methods |
| `streaming-display.test.ts` | Streaming display, character stream display |

## Test Structure

Each test file:
- Uses Bun's built-in test framework
- Tests all public functions and methods
- Includes edge cases and error handling
- Can be run independently
- Uses descriptive test names

## Test Runner

The `run-all-tests.ts` file provides:
- Sequential test execution with clear output
- Test summary with pass/fail status
- Ability to run all tests or specific tests
- Exit code based on test results (0 for success, 1 for failure)

## Notes

- Some tests create temporary files/directories and clean them up automatically
- Session tests use unique timestamps to avoid conflicts
- Tool tests create a temporary directory for file operations
- All tests are designed to be idempotent and safe to run multiple times

