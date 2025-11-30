import { test, expect } from "bun:test";
import { showWritePreview } from "../src/ui/preview";

test("showWritePreview - handles new file", () => {
  expect(() => showWritePreview(null, "New content\nLine 2")).not.toThrow();
});

test("showWritePreview - handles file edit", () => {
  const oldContent = "Old line 1\nOld line 2";
  const newContent = "New line 1\nNew line 2";
  
  expect(() => showWritePreview(oldContent, newContent)).not.toThrow();
});

test("showWritePreview - handles identical content", () => {
  const content = "Same content";
  expect(() => showWritePreview(content, content)).not.toThrow();
});

test("showWritePreview - handles empty new content", () => {
  expect(() => showWritePreview("Old content", "")).not.toThrow();
});

test("showWritePreview - handles empty old content", () => {
  expect(() => showWritePreview("", "New content")).not.toThrow();
});

test("showWritePreview - handles multiline diff", () => {
  const oldContent = "Line 1\nLine 2\nLine 3";
  const newContent = "Line 1\nModified Line 2\nLine 3\nLine 4";
  
  expect(() => showWritePreview(oldContent, newContent)).not.toThrow();
});

