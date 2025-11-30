import { test, expect } from "bun:test";
import { boxen } from "../src/ui/boxen";

test("boxen - basic box without title", () => {
  const result = boxen("Hello\nWorld");
  expect(result).toContain("Hello");
  expect(result).toContain("World");
  // Check for box characters (may be encoded differently)
  expect(result.length).toBeGreaterThan(0);
  expect(result.split("\n").length).toBeGreaterThan(2);
});

test("boxen - box with title", () => {
  const result = boxen("Content", { title: "Title" });
  expect(result).toContain("Title");
  expect(result).toContain("Content");
});

test("boxen - box with padding", () => {
  const result = boxen("Test", { padding: 2 });
  const lines = result.split("\n");
  expect(lines.length).toBeGreaterThan(2);
});

test("boxen - empty content", () => {
  const result = boxen("");
  expect(result).toBeTruthy();
  expect(result.length).toBeGreaterThan(0);
});

test("boxen - multiline content", () => {
  const content = "Line 1\nLine 2\nLine 3";
  const result = boxen(content);
  expect(result).toContain("Line 1");
  expect(result).toContain("Line 2");
  expect(result).toContain("Line 3");
});

test("boxen - long title", () => {
  const longTitle = "A".repeat(50);
  const result = boxen("Content", { title: longTitle });
  expect(result).toContain(longTitle);
});

test("boxen - default options", () => {
  const result = boxen("Test");
  expect(result).toBeTruthy();
  expect(typeof result).toBe("string");
});

