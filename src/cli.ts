export interface CLIOptions {
  model?: string;
  workspace?: string;
  url?: string;
  apiKey?: string;
  session?: string;
  listSessions?: boolean;
  help?: boolean;
}

export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--model" || arg === "-m") {
      options.model = args[++i];
    } else if (arg === "--workspace" || arg === "-w") {
      options.workspace = args[++i];
    } else if (arg === "--url" || arg === "-u") {
      options.url = args[++i];
    } else if (arg === "--api-key" || arg === "--key") {
      options.apiKey = args[++i];
    } else if (arg === "--session" || arg === "-s") {
      options.session = args[++i];
    } else if (arg === "--list-sessions" || arg === "-ls") {
      options.listSessions = true;
    }
  }
  
  return options;
}

export function printHelp(): void {
  console.log(`
Usage: bun run src/agent.ts [options]

Options:
  -m, --model <model>       Specify the model to use (e.g., claude-3-opus, claude-3-sonnet)
  -w, --workspace <path>    Set the workspace directory
  -u, --url <url>          WebSocket URL for ACP server (default: ws:
  -k, --api-key <key>      API key for authentication
  -s, --session <name>     Resume from a saved session
  -ls, --list-sessions     List all available sessions
  -h, --help               Show this help message

Environment Variables:
  MODEL              Model to use (can be overridden by --model)
  WORKSPACE_DIR      Workspace directory (can be overridden by --workspace)
  ACP_WS_URL         WebSocket URL (can be overridden by --url)
  CLAUDE_API_KEY     API key (can be overridden by --api-key)

Examples:
  bun run src/agent.ts --model claude-3-opus
  bun run src/agent.ts --workspace ./my-project --model claude-3-sonnet
  bun run src/agent.ts --session session-1234567890
  bun run src/agent.ts --list-sessions
  bun run src/agent.ts --url ws:
`);
}

