import { test, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { writeFile, readFile, runShell } from "../src/tools";

const TEST_DIR = path.join(process.cwd(), "test-tools-temp");

beforeEach(async () => {
  try {
    await fs.mkdir(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
});

afterEach(async () => {
  try {
    const files = await fs.readdir(TEST_DIR);
    for (const file of files) {
      const filePath = path.join(TEST_DIR, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rmdir(filePath);
      } else {
        await fs.unlink(filePath);
      }
    }
    await fs.rmdir(TEST_DIR);
  } catch {
    // Ignore cleanup errors
  }
});

test("writeFile - creates new file", async () => {
  const filePath = path.join(TEST_DIR, "test.txt");
  const content = "Hello, World!";

  const result = await writeFile(filePath, content, "create");
  
  expect(result.success).toBe(true);
  expect(result.message).toContain("created");

  const fileContent = await fs.readFile(filePath, "utf8");
  expect(fileContent).toBe(content);
});

test("writeFile - creates nested directories", async () => {
  const filePath = path.join(TEST_DIR, "nested", "dir", "file.txt");
  const content = "Nested content";

  const result = await writeFile(filePath, content);
  
  expect(result.success).toBe(true);
  
  const fileContent = await fs.readFile(filePath, "utf8");
  expect(fileContent).toBe(content);
});

test("writeFile - edit mode", async () => {
  const filePath = path.join(TEST_DIR, "edit-test.txt");
  await fs.writeFile(filePath, "Original", "utf8");

  const result = await writeFile(filePath, "Updated", "edit");
  
  expect(result.success).toBe(true);
  expect(result.message).toContain("updated");

  const fileContent = await fs.readFile(filePath, "utf8");
  expect(fileContent).toBe("Updated");
});

test("readFile - reads existing file", async () => {
  const filePath = path.join(TEST_DIR, "read-test.txt");
  const content = "Read me!";
  await fs.writeFile(filePath, content, "utf8");

  const result = await readFile(filePath);
  
  expect(result.success).toBe(true);
  expect(result.content).toBe(content);
});

test("readFile - returns error for non-existent file", async () => {
  const filePath = path.join(TEST_DIR, "non-existent.txt");

  const result = await readFile(filePath);
  
  expect(result.success).toBe(false);
  expect(result.error).toBeTruthy();
});

test("runShell - executes command successfully", async () => {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "echo Hello" : "echo 'Hello'";

  const result = await runShell(cmd);
  
  expect(result.success).toBe(true);
  expect(result.stdout).toContain("Hello");
  expect(result.code).toBe(0);
});

test("runShell - handles command with working directory", async () => {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "cd" : "pwd";

  const result = await runShell(cmd, TEST_DIR);
  
  expect(result.success).toBe(true);
});

test("runShell - handles failing command", async () => {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "exit /b 1" : "exit 1";

  const result = await runShell(cmd);
  
  expect(result.success).toBe(false);
  expect(result.code).toBe(1);
});

test("runShell - captures stderr", async () => {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "echo error >&2" : "echo 'error' >&2";

  const result = await runShell(cmd);
  
  expect(result.stderr).toBeTruthy();
});

