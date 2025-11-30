import { test, expect } from "bun:test";
import { parseArgs, printHelp, type CLIOptions } from "../src/cli";

test("parseArgs - parses model option", () => {
  const options = parseArgs(["--model", "claude-3-opus"]);
  expect(options.model).toBe("claude-3-opus");
});

test("parseArgs - parses short model option", () => {
  const options = parseArgs(["-m", "claude-3-sonnet"]);
  expect(options.model).toBe("claude-3-sonnet");
});

test("parseArgs - parses workspace option", () => {
  const options = parseArgs(["--workspace", "./my-project"]);
  expect(options.workspace).toBe("./my-project");
});

test("parseArgs - parses short workspace option", () => {
  const options = parseArgs(["-w", "./workspace"]);
  expect(options.workspace).toBe("./workspace");
});

test("parseArgs - parses url option", () => {
  const options = parseArgs(["--url", "ws://custom:8080"]);
  expect(options.url).toBe("ws://custom:8080");
});

test("parseArgs - parses short url option", () => {
  const options = parseArgs(["-u", "wss://secure:443"]);
  expect(options.url).toBe("wss://secure:443");
});

test("parseArgs - parses api-key option", () => {
  const options = parseArgs(["--api-key", "test-key"]);
  expect(options.apiKey).toBe("test-key");
});

test("parseArgs - parses key option", () => {
  const options = parseArgs(["--key", "another-key"]);
  expect(options.apiKey).toBe("another-key");
});

test("parseArgs - parses session option", () => {
  const options = parseArgs(["--session", "session-123"]);
  expect(options.session).toBe("session-123");
});

test("parseArgs - parses short session option", () => {
  const options = parseArgs(["-s", "my-session"]);
  expect(options.session).toBe("my-session");
});

test("parseArgs - parses list-sessions option", () => {
  const options = parseArgs(["--list-sessions"]);
  expect(options.listSessions).toBe(true);
});

test("parseArgs - parses short list-sessions option", () => {
  const options = parseArgs(["-ls"]);
  expect(options.listSessions).toBe(true);
});

test("parseArgs - parses help option", () => {
  const options = parseArgs(["--help"]);
  expect(options.help).toBe(true);
});

test("parseArgs - parses short help option", () => {
  const options = parseArgs(["-h"]);
  expect(options.help).toBe(true);
});

test("parseArgs - parses multiple options", () => {
  const options = parseArgs([
    "--model",
    "claude-3-opus",
    "--workspace",
    "./test",
    "--url",
    "ws://localhost:9000",
  ]);

  expect(options.model).toBe("claude-3-opus");
  expect(options.workspace).toBe("./test");
  expect(options.url).toBe("ws://localhost:9000");
});

test("parseArgs - returns empty object for no args", () => {
  const options = parseArgs([]);
  expect(Object.keys(options).length).toBe(0);
});

test("printHelp - does not throw", () => {
  expect(() => printHelp()).not.toThrow();
});

