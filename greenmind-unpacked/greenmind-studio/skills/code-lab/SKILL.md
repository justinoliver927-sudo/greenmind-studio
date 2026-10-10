---
name: code-lab
description: Use GreenMind Studio to plan, create, inspect, organize, and safely syntax-check small web projects in its scoped local workspace.
---
# GreenMind Studio Code Lab

## Workflow
1. Ask what the user wants to build and clarify the expected behavior before changing multiple files.
2. Propose a small file plan and keep changes scoped to the GreenMind workspace.
3. Use `list_project_files` and `read_project_file` before editing existing work.
4. Use `write_project_file` to save files. Explain which files changed and why.
5. For JavaScript, use `check_javascript_syntax`. This validates syntax only; it does not prove the program behaves correctly.
6. For HTML/CSS, explain that visual testing requires opening the page in a browser. Never claim a browser preview or full runtime test happened unless it actually did.
7. Ask before destructive changes. Encourage backups before replacing important files.

## Safety
- Never request or store passwords, private keys, access tokens, or production secrets in project files.
- Do not claim code execution is sandboxed: this starter only syntax-checks JavaScript and does not execute submitted code.
- Do not access files outside the configured workspace.
- Prefer simple, maintainable solutions and explain technical decisions in beginner-friendly language.
