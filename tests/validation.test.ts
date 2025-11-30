import { test, expect } from "bun:test";
import {
  validateWebSocketURL,
  validatePath,
  validateModel,
  validateAPIKey,
  validateTimeout,
  validateConfig,
  ValidationError,
} from "../src/utils/validation";

test("validateWebSocketURL - valid ws URL", () => {
  expect(() => validateWebSocketURL("ws://localhost:9000")).not.toThrow();
  expect(() => validateWebSocketURL("wss://example.com")).not.toThrow();
});

test("validateWebSocketURL - invalid protocol", () => {
  expect(() => validateWebSocketURL("http://example.com")).toThrow(ValidationError);
  expect(() => validateWebSocketURL("https://example.com")).toThrow(ValidationError);
});

test("validateWebSocketURL - empty string", () => {
  expect(() => validateWebSocketURL("")).toThrow(ValidationError);
});

test("validateWebSocketURL - invalid format", () => {
  expect(() => validateWebSocketURL("not-a-url")).toThrow(ValidationError);
});

test("validatePath - valid path", () => {
  expect(() => validatePath("/valid/path", "path")).not.toThrow();
  expect(() => validatePath("relative/path", "path")).not.toThrow();
});

test("validatePath - empty string", () => {
  expect(() => validatePath("", "path")).toThrow(ValidationError);
});

test("validatePath - whitespace only", () => {
  expect(() => validatePath("   ", "path")).toThrow(ValidationError);
});

test("validateModel - valid model name", () => {
  expect(() => validateModel("claude-3-sonnet")).not.toThrow();
  expect(() => validateModel("claude-3-opus")).not.toThrow();
  expect(() => validateModel("model_123")).not.toThrow();
  expect(() => validateModel("model.test")).not.toThrow();
});

test("validateModel - empty string", () => {
  expect(() => validateModel("")).toThrow(ValidationError);
});

test("validateModel - invalid characters", () => {
  expect(() => validateModel("model with spaces")).toThrow(ValidationError);
  expect(() => validateModel("model@invalid")).toThrow(ValidationError);
});

test("validateAPIKey - valid API key", () => {
  expect(() => validateAPIKey("sk-ant-api03-1234567890abcdef")).not.toThrow();
});

test("validateAPIKey - undefined allowed", () => {
  expect(() => validateAPIKey(undefined)).not.toThrow();
});

test("validateAPIKey - too short", () => {
  expect(() => validateAPIKey("short")).toThrow(ValidationError);
});

test("validateAPIKey - empty string", () => {
  expect(() => validateAPIKey("")).toThrow(ValidationError);
});

test("validateTimeout - valid timeout", () => {
  expect(() => validateTimeout(0)).not.toThrow();
  expect(() => validateTimeout(5000)).not.toThrow();
  expect(() => validateTimeout(60000)).not.toThrow();
});

test("validateTimeout - negative timeout", () => {
  expect(() => validateTimeout(-1)).toThrow(ValidationError);
});

test("validateTimeout - too large", () => {
  expect(() => validateTimeout(60001)).toThrow(ValidationError);
});

test("validateTimeout - NaN", () => {
  expect(() => validateTimeout(NaN)).toThrow(ValidationError);
});

test("validateConfig - valid config", () => {
  expect(() =>
    validateConfig({
      url: "ws://localhost:9000",
      model: "claude-3-sonnet",
      apiKey: "sk-ant-api03-1234567890abcdef",
      workspaceDir: "/workspace",
      timeout: 5000,
    })
  ).not.toThrow();
});

test("validateConfig - partial config", () => {
  expect(() =>
    validateConfig({
      url: "ws://localhost:9000",
    })
  ).not.toThrow();
});

test("validateConfig - multiple errors", () => {
  expect(() =>
    validateConfig({
      url: "http://invalid",
      model: "invalid model name!",
      apiKey: "short",
      timeout: -1,
    })
  ).toThrow(ValidationError);
});

