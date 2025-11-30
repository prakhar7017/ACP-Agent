import { test, expect } from "bun:test";
import { StreamingAccumulator } from "../src/streaming/accumulator";

test("StreamingAccumulator - accumulate single chunk", () => {
  const accumulator = new StreamingAccumulator();
  const streamId = "test-stream-1";
  
  const result = accumulator.accumulate(streamId, "Hello");
  expect(result).toBe("Hello");
});

test("StreamingAccumulator - accumulate multiple chunks", () => {
  const accumulator = new StreamingAccumulator();
  const streamId = "test-stream-2";
  
  accumulator.accumulate(streamId, "Hello");
  accumulator.accumulate(streamId, " ");
  accumulator.accumulate(streamId, "World");
  
  const result = accumulator.getContent(streamId);
  expect(result).toBe("Hello World");
});

test("StreamingAccumulator - mark as complete", () => {
  const accumulator = new StreamingAccumulator();
  const streamId = "test-stream-3";
  
  accumulator.accumulate(streamId, "Content", false);
  expect(accumulator.isComplete(streamId)).toBe(false);
  
  accumulator.accumulate(streamId, " more", true);
  expect(accumulator.isComplete(streamId)).toBe(true);
});

test("StreamingAccumulator - getContent returns accumulated content", () => {
  const accumulator = new StreamingAccumulator();
  const streamId = "test-stream-4";
  
  accumulator.accumulate(streamId, "Part 1");
  accumulator.accumulate(streamId, " Part 2");
  
  expect(accumulator.getContent(streamId)).toBe("Part 1 Part 2");
});

test("StreamingAccumulator - reset removes stream", () => {
  const accumulator = new StreamingAccumulator();
  const streamId = "test-stream-5";
  
  accumulator.accumulate(streamId, "Content");
  accumulator.reset(streamId);
  
  expect(accumulator.getContent(streamId)).toBe("");
  expect(accumulator.isComplete(streamId)).toBe(false);
});

test("StreamingAccumulator - clear removes all streams", () => {
  const accumulator = new StreamingAccumulator();
  
  accumulator.accumulate("stream-1", "Content 1");
  accumulator.accumulate("stream-2", "Content 2");
  
  accumulator.clear();
  
  expect(accumulator.getContent("stream-1")).toBe("");
  expect(accumulator.getContent("stream-2")).toBe("");
});

test("StreamingAccumulator - multiple streams independent", () => {
  const accumulator = new StreamingAccumulator();
  
  accumulator.accumulate("stream-a", "A");
  accumulator.accumulate("stream-b", "B");
  accumulator.accumulate("stream-a", "A2");
  accumulator.accumulate("stream-b", "B2");
  
  expect(accumulator.getContent("stream-a")).toBe("AA2");
  expect(accumulator.getContent("stream-b")).toBe("BB2");
});

test("StreamingAccumulator - generateStreamId creates unique IDs", () => {
  const id1 = StreamingAccumulator.generateStreamId();
  const id2 = StreamingAccumulator.generateStreamId();
  
  expect(id1).toBeTruthy();
  expect(id2).toBeTruthy();
  expect(id1).not.toBe(id2);
  expect(id1).toContain("stream-");
});

