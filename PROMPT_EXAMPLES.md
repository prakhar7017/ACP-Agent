# Prompt Examples for Agent ACP

This document provides example prompts you can use with the Agent ACP system and their expected results.

## Prerequisites

1. Start the mock server:
   ```bash
   bun run mock-server
   # or for streaming version:
   bun run mock-streaming
   ```

2. Start the agent in another terminal:
   ```bash
   bun run start
   ```

## Example Prompts

### 1. Create a New File

**Prompt:**
```
create a file hello.txt
```

**Expected Result:**
- System shows: `[Tool Call]: write_file (mock-write-1)`
- System shows: `[+] hello.txt` (file operation indicator)
- System shows file preview with `[NEW FILE]` and the content
- System prompts: `Approve creating "hello.txt"? (y/N)`
- After approval: `[+] File hello.txt created successfully`
- File is created in the workspace directory

**File Content Created:**
```
Hello from mock ACP (for prompt: create file hello.txt)
```

---

### 2. Create a File with Specific Name

**Prompt:**
```
make a file called test.js
```

**Expected Result:**
- System detects the filename `test.js` from the prompt
- Shows preview and asks for approval
- Creates `test.js` in workspace

---

### 3. Create Multiple Files

**Prompt:**
```
create file app.py
```

Then after it completes:
```
create file config.json
```

**Expected Result:**
- First file `app.py` is created
- Then second file `config.json` is created
- Both files appear in the workspace

---

### 4. Edit an Existing File

**Prompt:**
```
create a file example.txt
```

Wait for it to complete, then:
```
create a file example.txt
```

**Expected Result:**
- First time: Creates new file
- Second time: Shows warning `[!] File "example.txt" already exists. This will overwrite it.`
- Shows diff preview with `-` for old content and `+` for new content
- Prompts: `Approve overwriting "example.txt"? (y/N)`
- After approval: File is updated with new content

---

### 5. General Conversation

**Prompt:**
```
Hello, how are you?
```

**Expected Result:**
- System shows: `[You]: Hello, how are you?`
- Mock server responds: `[Model]: Echo: Hello, how are you?`
- No file operations occur, just conversation

---

### 6. Complex File Creation

**Prompt:**
```
create a file called main.ts with TypeScript code
```

**Expected Result:**
- System creates `main.ts` file
- Content includes the prompt text in the mock response
- File is created in workspace directory

---

### 7. File Operations with Streaming

If using `mock-streaming` server:

**Prompt:**
```
create file data.json
```

**Expected Result:**
- System shows streaming response: `[Model]:` followed by incremental text
- Text appears character by character or chunk by chunk
- Then tool call appears: `[Tool Call]: write_file`
- File creation proceeds as normal

---

### 8. Multiple Interactions

**Example Session:**

```
> create file README.md
[You]: create file README.md

[Model]:
Echo: create file README.md

[Tool Call]: write_file (mock-write-1)
[+] README.md

[File Preview]

  [NEW FILE]
  --------------------------------------------------
  + Hello from mock ACP (for prompt: create file README.md)

  --------------------------------------------------
[i] Approval required for file: README.md
Approve creating "README.md"? (y/N) y
| Writing file: README.md...
[+] Writing file: README.md...
[+] File README.md created successfully

[Model]:
Agent reported tool_result: ok

> create file package.json
[You]: create file package.json

[Model]:
Echo: create file package.json

[Tool Call]: write_file (mock-write-1)
[+] package.json

[File Preview]

  [NEW FILE]
  --------------------------------------------------
  + Hello from mock ACP (for prompt: create file package.json)

  --------------------------------------------------
[i] Approval required for file: package.json
Approve creating "package.json"? (y/N) y
| Writing file: package.json...
[+] Writing file: package.json...
[+] File package.json created successfully

[Model]:
Agent reported tool_result: ok

> exit
```

---

## Understanding the Output

### Status Indicators

- `[+]` - Success or create operation
- `[~]` - Edit/update operation
- `[>]` - Read operation
- `[-]` - Delete operation or error
- `[i]` - Information message
- `[!]` - Warning message
- `[Model]:` - Response from the model
- `[You]:` - Your input
- `[Tool Call]:` - Tool being executed

### File Preview Format

**New File:**
```
[File Preview]

  [NEW FILE]
  --------------------------------------------------
  + Line 1
  + Line 2
  --------------------------------------------------
```

**File Edit:**
```
[File Preview]

- Old line 1
- Old line 2
+ New line 1
+ New line 2
  --------------------------------------------------
```

### Approval Prompts

- `Approve creating "filename"? (y/N)` - For new files
- `Approve overwriting "filename"? (y/N)` - For existing files
- `Approve running shell command: <command>? (y/N)` - For shell commands

---

## Tips for Best Results

1. **Be Specific with Filenames**: Include the file extension
   - ✅ `create file app.js`
   - ❌ `create a file` (less specific)

2. **Use Clear Commands**: The mock server looks for keywords like:
   - `create`, `make`, `write`, `new` + `file` + filename

3. **File Extensions Matter**: The system preserves file extensions
   - `create file script.js` → creates `script.js`
   - `create file data` → creates `data.txt` (defaults to .txt)

4. **Approval Required**: All file operations require your approval
   - Type `y` or `Y` to approve
   - Type `n` or `N` or just press Enter to reject

5. **Session Management**: Sessions are auto-saved on exit
   - Use `bun run src/agent.ts --list-sessions` to see saved sessions
   - Use `bun run src/agent.ts --session <name>` to resume

---

## Real-World Use Cases

### 1. Project Setup

```
> create file package.json
> create file README.md
> create file .gitignore
> create file src/index.ts
```

### 2. Configuration Files

```
> create file tsconfig.json
> create file .env.example
> create file docker-compose.yml
```

### 3. Documentation

```
> create file docs/API.md
> create file docs/GETTING_STARTED.md
> create file CHANGELOG.md
```

---

## Mock Server Behavior

The mock server:
- Echoes your message back
- Automatically creates tool calls for file operations
- Extracts filenames from your prompts
- Sends streaming responses (if using `mock-streaming`)
- Responds to tool results with confirmation messages

**Note**: This is a mock server for testing. In production, you would connect to a real ACP server that handles actual Claude API interactions.

---

## Troubleshooting

**Issue**: Model name showing when you don't want it
- **Solution**: Don't set `MODEL` in `.env` file, or remove it. The system won't show model when connecting to localhost.

**Issue**: Files not being created
- **Solution**: Make sure you approve the operation by typing `y` when prompted

**Issue**: Gibberish characters in output
- **Solution**: All Unicode characters have been replaced with ASCII. If you still see issues, check your terminal encoding.

**Issue**: Connection failed
- **Solution**: Make sure the mock server is running on `ws://127.0.0.1:9000`

---

## Next Steps

1. Try the examples above
2. Experiment with different file types
3. Test the streaming functionality with `mock-streaming`
4. Explore session management features
5. Customize the mock server for your testing needs


