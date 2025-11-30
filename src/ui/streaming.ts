import chalk from "chalk";
import { stdout } from "process";

export class StreamingDisplay {
  private currentStreamId: string | null = null;
  private lastContent: string = "";
  private lastLineCount: number = 0;
  private isActive: boolean = false;

  
  start(streamId: string, initialContent: string = ""): void {
    this.currentStreamId = streamId;
    this.lastContent = initialContent;
    this.isActive = true;
    this.lastLineCount = initialContent.split("\n").length;

    if (initialContent) {
      this.update(initialContent);
    } else {

      process.stdout.write("\n" + chalk.blue.bold("[Model]:") + "\n");
    }
  }

  
  update(content: string): void {
    if (!this.isActive || !this.currentStreamId) return;

    const newContent = content.slice(this.lastContent.length);
    
    if (newContent.length > 0) {

      process.stdout.write(newContent);
      this.lastContent = content;

      this.lastLineCount = content.split("\n").length;
    }
  }

  
  complete(finalContent: string = ""): void {
    if (!this.isActive) return;

    const contentToShow = finalContent || this.lastContent;

    if (contentToShow && !contentToShow.endsWith("\n")) {
      process.stdout.write("\n");
    }

    this.isActive = false;
    this.currentStreamId = null;
    this.lastContent = "";
    this.lastLineCount = 0;

    process.stdout.write("\n");
  }

  
  cancel(): void {
    if (!this.isActive) return;

    stdout.write("\r\x1b[K");
    
    this.isActive = false;
    this.currentStreamId = null;
    this.lastContent = "";
    this.lastLineCount = 0;
  }

  
  isStreaming(): boolean {
    return this.isActive;
  }

  
  getCurrentStreamId(): string | null {
    return this.currentStreamId;
  }
}

export const streamingDisplay = new StreamingDisplay();

export class CharacterStreamDisplay {
  private currentStreamId: string | null = null;
  private accumulatedContent: string = "";
  private displayContent: string = "";
  private interval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private charDelay: number = 10;

  start(streamId: string): void {
    if (this.isActive) {
      this.cancel();
    }

    this.currentStreamId = streamId;
    this.accumulatedContent = "";
    this.displayContent = "";
    this.isActive = true;

    process.stdout.write("\n" + chalk.blue.bold("[Model]:") + "\n");

    this.interval = setInterval(() => {
      this.tick();
    }, this.charDelay);
  }

  append(content: string): void {
    if (!this.isActive) return;
    this.accumulatedContent += content;
  }

  private tick(): void {
    if (!this.isActive || this.accumulatedContent.length === this.displayContent.length) {
      return;
    }

    const remaining = this.accumulatedContent.slice(this.displayContent.length);
    const toDisplay = remaining.slice(0, 3);
    
    if (toDisplay.length > 0) {
      process.stdout.write(toDisplay);
      this.displayContent += toDisplay;
    }
  }

  complete(finalContent?: string): void {
    if (!this.isActive) return;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    const final = finalContent || this.accumulatedContent;
    const remaining = final.slice(this.displayContent.length);
    if (remaining.length > 0) {
      process.stdout.write(remaining);
    }

    process.stdout.write("\n\n");

    this.isActive = false;
    this.currentStreamId = null;
    this.accumulatedContent = "";
    this.displayContent = "";
  }

  cancel(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.isActive = false;
    this.currentStreamId = null;
    this.accumulatedContent = "";
    this.displayContent = "";
    
    stdout.write("\r\x1b[K");
  }
}

