#!/usr/bin/env bun

/**
 * Test Runner - Executes all tests or individual test files
 * 
 * Usage:
 *   bun run tests/run-all-tests.ts                    # Run all tests
 *   bun run tests/run-all-tests.ts boxen             # Run boxen tests only
 *   bun run tests/run-all-tests.ts validation config # Run multiple test files
 */

import { spawn } from "bun";
import path from "path";

// Bun supports import.meta.dir
const TEST_DIR = import.meta.dir || path.dirname(new URL(import.meta.url).pathname);
const ALL_TESTS = [
  "boxen.test.ts",
  "streaming-accumulator.test.ts",
  "validation.test.ts",
  "session.test.ts",
  "tools.test.ts",
  "config.test.ts",
  "cli.test.ts",
  "preview.test.ts",
  "spinner.test.ts",
  "formatter.test.ts",
  "streaming-display.test.ts",
];

function getTestFiles(args: string[]): string[] {
  if (args.length === 0) {
    return ALL_TESTS;
  }

  const requested = args.map((arg) => {
    if (arg.endsWith(".test.ts")) {
      return arg;
    }
    return `${arg}.test.ts`;
  });

  return requested.filter((file) => ALL_TESTS.includes(file));
}

async function runTest(testFile: string): Promise<boolean> {
  const testPath = path.join(TEST_DIR, testFile);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${testFile}`);
  console.log("=".repeat(60));

  try {
    const proc = spawn({
      cmd: ["bun", "test", testPath],
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch (error) {
    console.error(`Error running ${testFile}:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const testFiles = getTestFiles(args);

  if (testFiles.length === 0) {
    console.error("No valid test files found.");
    console.log("\nAvailable tests:");
    ALL_TESTS.forEach((test) => {
      const name = test.replace(".test.ts", "");
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  console.log(`\nFound ${testFiles.length} test file(s) to run\n`);

  const results: Array<{ file: string; passed: boolean }> = [];

  for (const testFile of testFiles) {
    const passed = await runTest(testFile);
    results.push({ file: testFile, passed });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach(({ file, passed }) => {
    const status = passed ? "✓ PASSED" : "✗ FAILED";
    const icon = passed ? "✓" : "✗";
    console.log(`${icon} ${file.padEnd(40)} ${status}`);
  });

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

