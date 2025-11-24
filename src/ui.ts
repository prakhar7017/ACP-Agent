import readlineSync from "readline-sync";
import { diffLines } from "diff";
import chalk from "chalk";


export function yesNo(prompt: string, defaultYes = false): boolean {
    const def = defaultYes ? "Y/n" : "y/N";
    const answer = readlineSync.question(`${prompt} (${def}) `);
    if (!answer) return defaultYes;
    return /^y/i.test(answer);
}

export function showWritePreview(oldStr: string | null, newStr: string) {
    console.log(chalk.bold("--- File write preview ---"));
    if (oldStr === null) {
        console.log(chalk.green("[new file]"));
        console.log(newStr);
        return;
    }
    const diff = diffLines(oldStr, newStr);
    for (const part of diff) {
        const lines = part.value.split("\n");
        if (part.added) {
            for (const l of lines) {
                if (l !== "") console.log(chalk.green("+ " + l));
            }
        } else if (part.removed) {
            for (const l of lines) {
                if (l !== "") console.log(chalk.red("- " + l));
            }
        } else {
            for (const l of lines) {
                if (l !== "") console.log("  " + l);
            }
        }
    }
    console.log(chalk.bold("--- end preview ---"));
}