import { test, expect } from "bun:test";
import { MessageFormatter } from "../src/ui/formatter";

test("MessageFormatter - modelMessage", () => {
  expect(() => MessageFormatter.modelMessage("Test message")).not.toThrow();
});

test("MessageFormatter - userMessage", () => {
  expect(() => MessageFormatter.userMessage("User input")).not.toThrow();
});

test("MessageFormatter - toolCall", () => {
  expect(() => MessageFormatter.toolCall("write_file", "tool-123")).not.toThrow();
});

test("MessageFormatter - info", () => {
  expect(() => MessageFormatter.info("Info message")).not.toThrow();
});

test("MessageFormatter - success", () => {
  expect(() => MessageFormatter.success("Success message")).not.toThrow();
});

test("MessageFormatter - warning", () => {
  expect(() => MessageFormatter.warning("Warning message")).not.toThrow();
});

test("MessageFormatter - error", () => {
  expect(() => MessageFormatter.error("Error message")).not.toThrow();
});

test("MessageFormatter - section", () => {
  expect(() => MessageFormatter.section("Section Title")).not.toThrow();
});

test("MessageFormatter - divider", () => {
  expect(() => MessageFormatter.divider()).not.toThrow();
});

test("MessageFormatter - box", () => {
  expect(() => MessageFormatter.box("Box content")).not.toThrow();
});

test("MessageFormatter - box with title", () => {
  expect(() => MessageFormatter.box("Content", "Title")).not.toThrow();
});

test("MessageFormatter - connecting", () => {
  expect(() => MessageFormatter.connecting("ws://localhost:9000")).not.toThrow();
});

test("MessageFormatter - connected", () => {
  expect(() => MessageFormatter.connected()).not.toThrow();
});

test("MessageFormatter - connectionFailed", () => {
  expect(() => MessageFormatter.connectionFailed("Connection error")).not.toThrow();
});

test("MessageFormatter - fileOperation create", () => {
  expect(() => MessageFormatter.fileOperation("create", "/path/to/file")).not.toThrow();
});

test("MessageFormatter - fileOperation edit", () => {
  expect(() => MessageFormatter.fileOperation("edit", "/path/to/file")).not.toThrow();
});

test("MessageFormatter - fileOperation read", () => {
  expect(() => MessageFormatter.fileOperation("read", "/path/to/file")).not.toThrow();
});

test("MessageFormatter - fileOperation delete", () => {
  expect(() => MessageFormatter.fileOperation("delete", "/path/to/file")).not.toThrow();
});

test("MessageFormatter - progress", () => {
  expect(() => MessageFormatter.progress(50, 100, "Loading")).not.toThrow();
});

test("MessageFormatter - progress complete", () => {
  expect(() => MessageFormatter.progress(100, 100, "Complete")).not.toThrow();
});

