import chalk from "chalk";
import { boxen } from "./boxen";

export class MessageFormatter {

  static modelMessage(content: string): void {
    console.log("\n" + chalk.blue.bold("ðŸ¤– Model:") + "\n" + chalk.white(content));
  }

  static userMessage(content: string): void {
    console.log("\n" + chalk.cyan.bold("ðŸ‘¤ You:") + " " + chalk.white(content));
  }

  static toolCall(tool: string, id: string): void {
    console.log("\n" + chalk.yellow.bold("ðŸ”§ Tool Call:") + ` ${chalk.yellow(tool)} (${chalk.dim(id)})`);
  }

  static info(message: string): void {
    console.log(chalk.blue("â„¹"), message);
  }

  static success(message: string): void {
    console.log(chalk.green("âœ“"), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow("âš "), message);
  }

  static error(message: string): void {
    console.log(chalk.red("âœ—"), message);
  }

  static section(title: string): void {
    console.log("\n" + chalk.bold.underline(title) + "\n");
  }

  static divider(): void {
    console.log(chalk.dim("â”€".repeat(60)));
  }

  static box(content: string, title?: string): void {
    console.log(boxen(content, { title, padding: 1 }));
  }

  static connecting(url: string): void {
    console.log(chalk.dim(`Connecting to ${url}...`));
  }

  static connected(): void {
    console.log(chalk.green("âœ“ Connected to ACP server"));
  }

  static connectionFailed(error: string): void {
    console.log(chalk.red(`âœ— Connection failed: ${error}`));
  }

  static fileOperation(type: "create" | "edit" | "read" | "delete", path: string): void {
    const icons = {
      create: "ðŸ“",
      edit: "âœï¸",
      read: "ðŸ“–",
      delete: "ðŸ—‘ï¸",
    };
    const colors = {
      create: chalk.green,
      edit: chalk.yellow,
      read: chalk.blue,
      delete: chalk.red,
    };
    console.log(`${icons[type]} ${colors[type](path)}`);
  }

  static progress(current: number, total: number, label: string = ""): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;
    const bar = "â–ˆ".repeat(filled) + "â–‘".repeat(empty);
    process.stdout.write(`\r${label} [${bar}] ${percentage}%`);
    if (current === total) {
      process.stdout.write("\n");
    }
  }
}

