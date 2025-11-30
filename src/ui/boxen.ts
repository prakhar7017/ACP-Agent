export function boxen(
  content: string,
  options: { title?: string; padding?: number } = {}
): string {
  const { title, padding = 0 } = options;
  const lines = content.split("\n");
  const maxWidth = Math.max(
    ...lines.map((l) => l.length),
    title ? title.length + 2 : 0
  );

  const pad = " ".repeat(padding);
  const width = maxWidth + padding * 2 + 2;
  const top = "â”Œ" + "â”€".repeat(width - 2) + "â”";
  const bottom = "â””" + "â”€".repeat(width - 2) + "â”˜";
  const side = "â”‚";

  let result = top + "\n";

  if (title) {
    const titleLine = `${side}${pad}${title}${" ".repeat(width - title.length - padding * 2 - 2)}${side}`;
    result += titleLine + "\n";
    result += side + "â”€".repeat(width - 2) + side + "\n";
  }

  for (const line of lines) {
    const paddedLine = line + " ".repeat(maxWidth - line.length);
    result += `${side}${pad}${paddedLine}${pad}${side}\n`;
  }

  result += bottom;
  return result;
}

