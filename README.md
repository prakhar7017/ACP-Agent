# Agent ACP - Claude Code Agent Client

A TypeScript-based coding agent that communicates with Claude Code over the Agent Client Protocol (ACP). Built with Bun runtime, featuring streaming support, session management, and a modern terminal UI.

## Features

### Core Capabilities
- Send messages to Claude Code
- Receive messages and handle responses
- Approve/Reject tool calls interactively
- File operations (create, read, edit) with preview
- Shell command execution with approval
- Model configuration
- Workspace management

### Advanced Features
- Streaming support with real-time content display
- Session management (save, list, resume)
- Terminal UI with colors, icons, and progress indicators
- Configuration validation
- Debug logging system

## Installation

### Prerequisites
- Bun runtime installed
- Node.js-compatible environment

### Setup

```bash
bun install
```

Optional .env file:
```env
ACP_WS_URL=ws://127.0.0.1:9000
CLAUDE_API_KEY=your-api-key-here
MODEL=claude-3-sonnet
WORKSPACE_DIR=./workspace
```

## Quick Start

1. Start mock server: 
   ```bash
   bun run mock-server
   ```
2. Run agent: 
   ```bash
   bun run src/agent.ts
   ```
3. Start chatting: Type commands in the prompt

## Usage

### Basic Commands

```bash
bun run src/agent.ts
bun run src/agent.ts --model claude-3-opus
bun run src/agent.ts --workspace ./my-project
bun run src/agent.ts --help
```

### CLI Options

- `-m, --model <model>` - Specify Claude model
- `-w, --workspace <path>` - Set workspace directory
- `-u, --url <url>` - WebSocket URL
- `-k, --api-key <key>` - API key
- `-s, --session <name>` - Resume session
- `-ls, --list-sessions` - List sessions
- `-h, --help` - Show help

### Environment Variables

- `MODEL` - Model name
- `WORKSPACE_DIR` - Workspace path
- `ACP_WS_URL` - WebSocket URL
- `CLAUDE_API_KEY` - API key

Priority: CLI args > Environment vars > Defaults

## Session Management

Sessions auto-save on exit. List and resume:

```bash
bun run src/agent.ts --list-sessions
bun run src/agent.ts --session session-1234567890
```

## File Operations

- Create files with preview and approval
- Edit files with diff preview
- Read files to display content

All operations require user approval.

## Shell Commands

Run commands with approval:

```bash
> run ls -la
```

## Streaming

Real-time streaming support with incremental display.

## Terminal UI

- Color-coded messages
- Loading spinners
- File diff previews
- Progress indicators

## Debug Mode

```bash
DEBUG=1 bun run src/agent.ts
LOG_LEVEL=DEBUG bun run src/agent.ts
```

## Project Structure

```
src/
├── agent.ts              # Main agent
├── acp.ts                # WebSocket client
├── cli.ts                # CLI parsing
├── config.ts             # Configuration
├── session.ts            # Sessions
├── tools.ts              # File/shell utils
├── handlers/             # Tool handlers
├── streaming/            # Stream handling
├── ui/                   # UI components
└── utils/                # Utilities
```

## Configuration

Defaults:
- URL: `ws://127.0.0.1:9000`
- Model: `claude-3-sonnet`
- Workspace: Current directory

All values validated before use.

## Testing

```bash
# Run all tests
bun run test

# Run specific test suite
bun run test:all

# Start mock servers for testing
bun run mock-server
bun run mock-streaming
```

## Example Prompts

See [PROMPT_EXAMPLES.md](./PROMPT_EXAMPLES.md) for detailed examples of prompts you can use with the system and expected results.

## Troubleshooting

Enable debug mode for detailed logs:

```bash
DEBUG=1 bun run src/agent.ts
```

## Security

- API keys in environment variables only
- All operations require approval
- Use caution with untrusted sources

---

Made with Bun, TypeScript, and Node.js
