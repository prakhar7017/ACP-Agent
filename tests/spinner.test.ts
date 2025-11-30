import { test, expect } from "bun:test";
import { Spinner, withSpinner } from "../src/ui/spinner";

test("Spinner - creates instance", () => {
  const spinner = new Spinner("Loading...");
  expect(spinner).toBeTruthy();
});

test("Spinner - start and stop", () => {
  const spinner = new Spinner("Test");
  expect(() => spinner.start()).not.toThrow();
  expect(() => spinner.stop()).not.toThrow();
});

test("Spinner - start with text", () => {
  const spinner = new Spinner();
  expect(() => spinner.start("New text")).not.toThrow();
  spinner.stop();
});

test("Spinner - update text while running", () => {
  const spinner = new Spinner("Initial");
  spinner.start();
  expect(() => spinner.update("Updated")).not.toThrow();
  spinner.stop();
});

test("Spinner - succeed", () => {
  const spinner = new Spinner("Processing");
  spinner.start();
  expect(() => spinner.succeed()).not.toThrow();
});

test("Spinner - succeed with custom text", () => {
  const spinner = new Spinner("Processing");
  spinner.start();
  expect(() => spinner.succeed("Done!")).not.toThrow();
});

test("Spinner - fail", () => {
  const spinner = new Spinner("Processing");
  spinner.start();
  expect(() => spinner.fail()).not.toThrow();
});

test("Spinner - fail with custom text", () => {
  const spinner = new Spinner("Processing");
  spinner.start();
  expect(() => spinner.fail("Error!")).not.toThrow();
});

test("withSpinner - executes async operation", async () => {
  const result = await withSpinner("Loading", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return "success";
  });

  expect(result).toBe("success");
});

test("withSpinner - handles errors", async () => {
  await expect(
    withSpinner("Loading", async () => {
      throw new Error("Test error");
    })
  ).rejects.toThrow("Test error");
});

test("Spinner - multiple start calls", () => {
  const spinner = new Spinner("Test");
  spinner.start();
  expect(() => spinner.start("New")).not.toThrow();
  spinner.stop();
});

