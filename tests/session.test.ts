import { test, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";
import {
  saveUserSession,
  loadSession,
  listSessions,
  getSessionInfo,
  type SessionMetadata,
} from "../src/session";
import type { SessionData } from "../src/types";

// Note: These tests use the actual sessions directory
// They create unique session names to avoid conflicts

test("saveUserSession - creates session file", async () => {
  const sessionName = `test-session-${Date.now()}-1`;
  const sessionData: SessionData = {
    messages: [
      {
        outgoing: {
          type: "client_message",
          role: "user",
          content: "Hello",
        },
        ts: Date.now(),
      },
    ],
  };

  const metadata: SessionMetadata = {
    model: "claude-3-sonnet",
    workspace: "/workspace",
    createdAt: Date.now(),
  };

  const filePath = await saveUserSession(sessionName, sessionData, metadata);
  expect(filePath).toBeTruthy();
  expect(filePath).toContain(`${sessionName}.json`);

  const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
  expect(fileExists).toBe(true);
  
  // Cleanup
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore
  }
});

test("saveUserSession - includes metadata", async () => {
  const sessionName = `test-session-${Date.now()}-2`;
  const sessionData: SessionData = {
    messages: [],
  };

  const metadata: SessionMetadata = {
    model: "claude-3-opus",
    workspace: "/test-workspace",
    createdAt: 1000,
  };

  await saveUserSession(sessionName, sessionData, metadata);
  const loaded = await loadSession(sessionName);

  expect(loaded).toBeTruthy();
  expect(loaded?.metadata?.model).toBe("claude-3-opus");
  expect(loaded?.metadata?.workspace).toBe("/test-workspace");
  expect(loaded?.metadata?.createdAt).toBe(1000);
  expect(loaded?.metadata?.lastUpdated).toBeTruthy();
  
  // Cleanup
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");
    await fs.unlink(path.join(sessionsDir, `${sessionName}.json`));
  } catch {
    // Ignore
  }
});

test("loadSession - loads existing session", async () => {
  const sessionName = `test-session-${Date.now()}-3`;
  const sessionData: SessionData = {
    messages: [
      {
        incoming: {
          type: "text",
          content: "Response",
        },
        ts: Date.now(),
      },
    ],
  };

  await saveUserSession(sessionName, sessionData);
  const loaded = await loadSession(sessionName);

  expect(loaded).toBeTruthy();
  expect(loaded?.messages).toBeTruthy();
  expect(loaded?.messages?.length).toBe(1);
  
  // Cleanup
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");
    await fs.unlink(path.join(sessionsDir, `${sessionName}.json`));
  } catch {
    // Ignore
  }
});

test("loadSession - returns null for non-existent session", async () => {
  const loaded = await loadSession("non-existent-session");
  expect(loaded).toBeNull();
});

test("listSessions - returns empty array when no sessions", async () => {
  const sessions = await listSessions();
  expect(Array.isArray(sessions)).toBe(true);
});

test("listSessions - lists all sessions", async () => {
  const timestamp = Date.now();
  const sessionA = `test-session-${timestamp}-a`;
  const sessionB = `test-session-${timestamp}-b`;
  const sessionC = `test-session-${timestamp}-c`;
  
  await saveUserSession(sessionA, { messages: [] });
  await saveUserSession(sessionB, { messages: [] });
  await saveUserSession(sessionC, { messages: [] });

  const sessions = await listSessions();
  expect(sessions.length).toBeGreaterThanOrEqual(3);

  const sessionNames = sessions.map((s) => s.name);
  expect(sessionNames).toContain(sessionA);
  expect(sessionNames).toContain(sessionB);
  expect(sessionNames).toContain(sessionC);
  
  // Cleanup
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");
    await fs.unlink(path.join(sessionsDir, `${sessionA}.json`));
    await fs.unlink(path.join(sessionsDir, `${sessionB}.json`));
    await fs.unlink(path.join(sessionsDir, `${sessionC}.json`));
  } catch {
    // Ignore
  }
});

test("listSessions - sorts by lastUpdated", async () => {
  const timestamp = Date.now();
  const oldSession = `test-session-${timestamp}-old`;
  const newSession = `test-session-${timestamp}-new`;
  const now = Date.now();
  
  await saveUserSession(oldSession, { messages: [] }, {
    lastUpdated: now - 1000,
  });
  
  await saveUserSession(newSession, { messages: [] }, {
    lastUpdated: now,
  });

  const sessions = await listSessions();
  const oldIndex = sessions.findIndex((s) => s.name === oldSession);
  const newIndex = sessions.findIndex((s) => s.name === newSession);
  
  expect(newIndex).toBeLessThan(oldIndex);
  
  // Cleanup
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");
    await fs.unlink(path.join(sessionsDir, `${oldSession}.json`));
    await fs.unlink(path.join(sessionsDir, `${newSession}.json`));
  } catch {
    // Ignore
  }
});

test("getSessionInfo - returns session info", async () => {
  const sessionName = `test-session-${Date.now()}-4`;
  const sessionData: SessionData = {
    messages: [{ outgoing: { type: "client_message", role: "user", content: "test" }, ts: Date.now() }],
  };

  await saveUserSession(sessionName, sessionData);
  const info = await getSessionInfo(sessionName);

  expect(info).toBeTruthy();
  expect(info?.messages).toBeTruthy();
  
  // Cleanup
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");
    await fs.unlink(path.join(sessionsDir, `${sessionName}.json`));
  } catch {
    // Ignore
  }
});

test("getSessionInfo - returns null for non-existent", async () => {
  const info = await getSessionInfo("non-existent");
  expect(info).toBeNull();
});

