# GreenMind Studio — Local Code Lab (starter)

A starter local MCP plugin package focused on organizing project files and checking JavaScript syntax.

## What it currently does
- Lists files in one dedicated workspace.
- Reads and writes approved text files within that workspace.
- Checks `.js` and `.mjs` syntax with `node --check` without running the submitted code.
- Includes a Code Lab skill with a repeatable workflow.

## What it does not do yet
- It does not execute arbitrary user code.
- It does not provide a browser preview, full automated tests, database server, or deployment.
- It is not yet installed or connected to a ChatGPT account.
- It does not make a local computer's filesystem available from the ChatGPT Android app.

## Requirements
- Node.js 20 or newer.
- A compatible host that supports local stdio MCP servers and Agent Plugins 1.0 packages.
- Internet access once to install the npm dependencies.

## Setup on a computer
1. Extract the `greenmind-studio` folder.
2. Install Node.js 20+.
3. Open a terminal in this folder and run `npm install`.
4. Run `npm run check`.
5. Create a `workspace` folder beside `server`.
6. Configure your compatible host to load this folder using `mcp.json`.
7. Verify `workspace_info`, `list_project_files`, `write_project_file`, `read_project_file`, and `check_javascript_syntax`.

## Phone-first reality
You can keep source files in GitHub and edit them from your Samsung phone. However, local stdio tools need a compatible runtime running on a computer or other host; they do not run inside the ChatGPT Android app just because you upload this ZIP. If phone-only operation is essential, the next version should use a hosted service with authentication, rather than claiming local execution.

## Security notes
- Use a dedicated workspace with non-sensitive test data.
- The server only allows selected text file extensions and limits files to 200 KB.
- JavaScript checks call `node --check` with an argument array and no shell.
- Keep production secrets out of the workspace.


## v0.4 project management
The browser Code Lab supports multiple local projects: create, open, rename, and delete. Project code and the active project are stored in browser localStorage. Projects remain on the current browser/device; use Export files for a backup. Existing single-project drafts under `greenmind-studio-codelab-v1` are migrated when the new project store is first initialized.

## v0.5 diagnostics console
The browser Code Lab adds quick diagnostics for HTML, CSS, and JavaScript. HTML checks parse the document and flag duplicate IDs plus common accessibility omissions. CSS checks catch unclosed comments/braces and some basic rule-shape problems. JavaScript is syntax-parsed with `new Function` but is not executed by the diagnostics button. Runtime console messages and uncaught preview errors remain visible in the output area. These checks are intentionally lightweight; always run the preview and test actual behavior.


## v0.6 — secure AI coding assistant (backend required)

The web UI adds an AI assistant for explain/debug/improve/build questions. It sends the current project's HTML/CSS/JavaScript and the user's prompt to `/api/ai-chat`. The server calls the OpenAI Responses API and returns the answer. AI suggestions are displayed for manual review; the assistant does not write into the editors automatically.

### Run the backend locally

Requirements: Node.js 20+ and an OpenAI API key for API usage. The ChatGPT app subscription and API billing are separate.

1. Set `OPENAI_API_KEY` in your server environment (never in `web/index.html`).
2. Set `GREENMIND_ACCESS_PASSWORD` to a long, unique private password. This protects the AI endpoint; it is not your OpenAI key.
3. Optionally set `OPENAI_MODEL` (default `gpt-5.5`) and `PORT` (default `3000`).
4. Run `npm run check`, then `npm start`.
5. Open `http://localhost:3000` on the same device, or use a trusted private network for testing.
6. Enter the `GREENMIND_ACCESS_PASSWORD` in the assistant's password field. Do not enter the OpenAI key in the web page.

### Phone-first hosting notes

The front end is not a standalone static site for the AI feature: the same-origin `/api/ai-chat` endpoint must run on a Node-capable host. GitHub Pages alone only serves static files and cannot run this backend. Deploy the Node app to a trusted host with HTTPS and configure `OPENAI_API_KEY`, `GREENMIND_ACCESS_PASSWORD`, and optionally `OPENAI_MODEL` as host-side secrets/environment variables. Never commit real secrets. The UI checks `/api/health` and reports when the backend or AI key is not configured.

**Before making a public deployment:** this starter uses a shared app access password and in-memory per-IP rate limiting, not user accounts. Keep it private behind HTTPS; for a multi-user public service, add proper user authentication, durable rate limits, usage quotas, and monitoring before opening access. Configure a strong unique access password and rotate it if exposed. Do not trust arbitrary proxy headers unless the deployment proxy is configured to overwrite them.

### Security behavior

- OpenAI credentials are read only from the server environment and are never sent to the browser.
- The AI endpoint requires the separate app access password and rate-limits requests.
- Request size and prompt/code lengths are limited; upstream calls time out.
- API provider errors are sanitized instead of returning raw provider details.
- User code is treated as untrusted context. AI responses are suggestions only and are not executed or applied automatically.
- The health endpoint reports only whether secrets are configured; it never returns secret values.
- Never paste secrets into project code or the assistant prompt.
