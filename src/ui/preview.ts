// src/ui/preview.ts
import { diffLines } from "diff";
import chalk from "chalk";
import { boxen } from "./boxen";

export function showWritePreview(oldStr: string | null, newStr: string): void {
  console.log("\n" + chalk.bold.cyan("📄 File Preview") + "\n");
  
  if (oldStr === null) {
    console.log(chalk.green.bold("  [NEW FILE]"));
    console.log(chalk.dim("  ─────────────────────"));
    const lines = newStr.split("\n");
    for (const line of lines) {
      console.log(chalk.green("  + ") + line);
    }
    return;
  }

  const diff = diffLines(oldStr, newStr);
  let output = "";
  
  for (const part of diff) {
    const lines = part.value.split("\n");
    for (const line of lines) {
      if (line === "") continue;
      if (part.added) {
        output += chalk.green("+ " + line) + "\n";
      } else if (part.removed) {
        output += chalk.red("- " + line) + "\n";
      } else {
        output += chalk.dim("  " + line) + "\n";
      }
    }
  }
  
  console.log(output);
  console.log(chalk.dim("  ─────────────────────"));
}

