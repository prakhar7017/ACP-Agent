import { test, expect } from "bun:test";
import { StreamingDisplay, CharacterStreamDisplay } from "../src/ui/streaming";

test("StreamingDisplay - start stream", () => {
  const display = new StreamingDisplay();
  expect(() => display.start("stream-1")).not.toThrow();
  expect(display.isStreaming()).toBe(true);
});

test("StreamingDisplay - start with initial content", () => {
  const display = new StreamingDisplay();
  expect(() => display.start("stream-1", "Initial")).not.toThrow();
  expect(display.isStreaming()).toBe(true);
});

test("StreamingDisplay - update content", () => {
  const display = new StreamingDisplay();
  display.start("stream-1");
  expect(() => display.update("Hello")).not.toThrow();
  expect(() => display.update("Hello World")).not.toThrow();
});

test("StreamingDisplay - complete stream", () => {
  const display = new StreamingDisplay();
  display.start("stream-1");
  display.update("Content");
  expect(() => display.complete("Final content")).not.toThrow();
  expect(display.isStreaming()).toBe(false);
});

test("StreamingDisplay - cancel stream", () => {
  const display = new StreamingDisplay();
  display.start("stream-1");
  expect(() => display.cancel()).not.toThrow();
  expect(display.isStreaming()).toBe(false);
});

test("StreamingDisplay - getCurrentStreamId", () => {
  const display = new StreamingDisplay();
  display.start("stream-123");
  expect(display.getCurrentStreamId()).toBe("stream-123");
  
  display.complete();
  expect(display.getCurrentStreamId()).toBeNull();
});

test("StreamingDisplay - isStreaming returns false when not active", () => {
  const display = new StreamingDisplay();
  expect(display.isStreaming()).toBe(false);
});

test("StreamingDisplay - update does nothing when not active", () => {
  const display = new StreamingDisplay();
  expect(() => display.update("Content")).not.toThrow();
});

test("CharacterStreamDisplay - start stream", () => {
  const display = new CharacterStreamDisplay();
  expect(() => display.start("stream-1")).not.toThrow();
});

test("CharacterStreamDisplay - append content", () => {
  const display = new CharacterStreamDisplay();
  display.start("stream-1");
  expect(() => display.append("Chunk 1")).not.toThrow();
  expect(() => display.append(" Chunk 2")).not.toThrow();
});

test("CharacterStreamDisplay - complete stream", () => {
  const display = new CharacterStreamDisplay();
  display.start("stream-1");
  display.append("Content");
  expect(() => display.complete("Final")).not.toThrow();
});

test("CharacterStreamDisplay - cancel stream", () => {
  const display = new CharacterStreamDisplay();
  display.start("stream-1");
  expect(() => display.cancel()).not.toThrow();
});

test("CharacterStreamDisplay - cancel when already cancelled", () => {
  const display = new CharacterStreamDisplay();
  display.start("stream-1");
  display.cancel();
  expect(() => display.cancel()).not.toThrow();
});

