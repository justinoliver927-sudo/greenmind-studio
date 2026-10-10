import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const server = new McpServer({ name: "greenmind-code-lab", version: "0.1.0" });
const ROOT = path.resolve(process.env.GREENMIND_WORKSPACE || path.join(process.cwd(), "workspace"));
const MAX_FILE_BYTES = 200_000;
const ALLOWED_EXTENSIONS = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".csv", ".sql"]);

function safePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) throw new Error("A relative file path is required.");
  if (path.isAbsolute(relativePath)) throw new Error("Absolute paths are not allowed.");
  const full = path.resolve(ROOT, relativePath);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) throw new Error("Path escapes the GreenMind workspace.");
  if (relativePath.split(/[\\/]/).some(part => part === "..")) throw new Error("Parent-directory traversal is not allowed.");
  return full;
}
function textResult(value) {
  return { content: [{ type: "text", text: String(value) }] };
}
async function ensureRoot() { await fs.mkdir(ROOT, { recursive: true }); }
async function walk(dir = ROOT, prefix = "") {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const rel = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

server.tool("workspace_info", "Show the scoped GreenMind workspace path and available tools. Does not access files outside this workspace.", {}, async () => {
  await ensureRoot();
  return textResult(`GreenMind workspace: ${ROOT}\nFile limit: ${MAX_FILE_BYTES} bytes\nAllowed file types: ${[...ALLOWED_EXTENSIONS].join(", ")}\nCode execution is not enabled. JavaScript syntax checks use node --check.`);
});

server.tool("list_project_files", "List files in the GreenMind workspace, excluding hidden folders and node_modules.", {}, async () => {
  await ensureRoot();
  const files = await walk();
  return textResult(files.length ? files.join("\n") : "(workspace is empty)");
});

server.tool("read_project_file", "Read a text file inside the GreenMind workspace only.", {
  path: z.string().min(1).describe("Relative path such as index.html")
}, async ({ path: rel }) => {
  await ensureRoot();
  const full = safePath(rel);
  const stat = await fs.stat(full);
  if (!stat.isFile()) throw new Error("Path is not a file.");
  if (stat.size > MAX_FILE_BYTES) throw new Error(`File exceeds ${MAX_FILE_BYTES} bytes.`);
  return textResult(await fs.readFile(full, "utf8"));
});

server.tool("write_project_file", "Create or replace a text file in the GreenMind workspace. Only approved text extensions and files up to 200 KB are allowed.", {
  path: z.string().min(1).describe("Relative path such as index.html"),
  content: z.string().max(MAX_FILE_BYTES).describe("Complete text content, up to 200 KB")
}, async ({ path: rel, content }) => {
  await ensureRoot();
  const full = safePath(rel);
  const ext = path.extname(full).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`File type ${ext || "(none)"} is not allowed.`);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, { encoding: "utf8", flag: "w" });
  return textResult(`Saved ${rel} (${Buffer.byteLength(content, "utf8")} bytes).`);
});

server.tool("check_javascript_syntax", "Check JavaScript syntax without running the submitted program. Requires Node.js. File must be inside the GreenMind workspace and have .js or .mjs extension.", {
  path: z.string().min(1).describe("Relative path to a .js or .mjs file")
}, async ({ path: rel }) => {
  await ensureRoot();
  const full = safePath(rel);
  if (![".js", ".mjs"].includes(path.extname(full).toLowerCase())) throw new Error("Only .js and .mjs files can be syntax-checked.");
  const stat = await fs.stat(full);
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) throw new Error("File missing, not a regular file, or too large.");
  const result = await new Promise(resolve => {
    const child = spawn("node", ["--check", full], { cwd: ROOT, shell: false, stdio: ["ignore", "pipe", "pipe"], timeout: 10000 });
    let stdout = "", stderr = "";
    child.stdout.on("data", d => stdout += d.toString());
    child.stderr.on("data", d => stderr += d.toString());
    child.on("error", e => resolve({ code: 1, stdout, stderr: e.message }));
    child.on("close", code => resolve({ code: code ?? 1, stdout, stderr }));
  });
  return textResult(result.code === 0 ? `PASS: ${rel} has valid JavaScript syntax. The file was not executed.` : `FAIL: ${rel}\n${result.stderr || result.stdout}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
