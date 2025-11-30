import { test, expect } from "bun:test";
import { createConfig, createConfigSync, type Config } from "../src/config";

test("createConfigSync - returns default config", () => {
  const config = createConfigSync();
  
  expect(config).toBeTruthy();
  expect(config.ACP_URL).toBeTruthy();
  // MODEL is optional - when connecting to localhost, it may be undefined
  expect(config.WORKSPACE_DIR).toBeTruthy();
  expect(config.SESSIONS_DIR).toBeTruthy();
  expect(config.CONNECT_TIMEOUT_MS).toBe(5000);
});

test("createConfigSync - uses provided options", () => {
  const config = createConfigSync({
    model: "claude-3-opus",
    workspace: "./test-workspace",
    url: "ws://custom:8080",
    apiKey: "test-key-1234567890",
  });

  expect(config.MODEL).toBe("claude-3-opus");
  expect(config.ACP_URL).toBe("ws://custom:8080");
  expect(config.CLAUDE_API_KEY).toBe("test-key-1234567890");
  expect(config.WORKSPACE_DIR).toContain("test-workspace");
});

test("createConfig - creates config asynchronously", async () => {
  const config = await createConfig({
    model: "claude-3-sonnet",
  });

  expect(config).toBeTruthy();
  expect(config.MODEL).toBe("claude-3-sonnet");
  expect(config.ACP_URL).toBeTruthy();
});

test("createConfig - validates config", async () => {
  await expect(
    createConfig({
      url: "http://invalid",
      model: "invalid model!",
    })
  ).rejects.toThrow();
});

test("createConfig - uses environment variables", async () => {
  const originalUrl = process.env.ACP_WS_URL;
  const originalModel = process.env.MODEL;
  const originalApiKey = process.env.CLAUDE_API_KEY;

  try {
    process.env.ACP_WS_URL = "ws://env-test:9000";
    process.env.MODEL = "claude-3-opus";
    process.env.CLAUDE_API_KEY = "env-key-1234567890";

    const config = await createConfig();

    expect(config.ACP_URL).toBe("ws://env-test:9000");
    expect(config.MODEL).toBe("claude-3-opus");
    expect(config.CLAUDE_API_KEY).toBe("env-key-1234567890");
  } finally {
    if (originalUrl) process.env.ACP_WS_URL = originalUrl;
    else delete process.env.ACP_WS_URL;
    if (originalModel) process.env.MODEL = originalModel;
    else delete process.env.MODEL;
    if (originalApiKey) process.env.CLAUDE_API_KEY = originalApiKey;
    else delete process.env.CLAUDE_API_KEY;
  }
});

test("createConfig - workspace directory resolution", async () => {
  const config = await createConfig({
    workspace: "./test-workspace",
  });

  expect(config.WORKSPACE_DIR).toBeTruthy();
  expect(typeof config.WORKSPACE_DIR).toBe("string");
});

