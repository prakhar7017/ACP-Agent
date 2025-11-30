import { stdout } from "process";

export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private frames: string[] = ["â ‹", "â ™", "â ¹", "â ¸", "â ¼", "â ´", "â ¦", "â §", "â ‡", "â "];
  private currentFrame = 0;
  private text: string;
  private isRunning = false;

  constructor(text: string = "") {
    this.text = text;
  }

  start(text?: string): void {
    if (this.isRunning) {
      this.stop();
    }
    if (text) {
      this.text = text;
    }
    this.isRunning = true;
    this.currentFrame = 0;
    this.interval = setInterval(() => {
      this.render();
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
    this.render();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;

    stdout.write("\r\x1b[K");
  }

  succeed(text?: string): void {
    this.stop();
    if (text) {
      stdout.write(`\râœ“ ${text}\n`);
    } else {
      stdout.write(`\râœ“ ${this.text}\n`);
    }
  }

  fail(text?: string): void {
    this.stop();
    if (text) {
      stdout.write(`\râœ— ${text}\n`);
    } else {
      stdout.write(`\râœ— ${this.text}\n`);
    }
  }

  update(text: string): void {
    this.text = text;
    if (this.isRunning) {
      this.render();
    }
  }

  private render(): void {
    const frame = this.frames[this.currentFrame];
    stdout.write(`\r${frame} ${this.text}`);
  }
}

export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>
): Promise<T> {
  const spinner = new Spinner(text);
  spinner.start();
  
  try {
    const result = await operation();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

