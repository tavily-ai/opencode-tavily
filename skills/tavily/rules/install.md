---
name: tavily-cli-installation
description: |
  Install the Tavily CLI and handle authentication errors.
---

# Tavily CLI Installation

## Quick Install

```bash
curl -fsSL https://cli.tavily.com/install.sh | bash
```

Or via Python package managers:

```bash
uv tool install tavily-cli
# or
pip install tavily-cli
```

## Verify Installation

Check if installed and authenticated in one command:

```bash
tvly --status
```

Output when ready:

```
  tavily v0.1.0

  > Authenticated via TAVILY_API_KEY
```

## Authentication

If not authenticated, run the login yourself — don't tell the user to run commands manually:

```bash
tvly login
```

This opens the browser for OAuth automatically. Wait for them to finish, then retry the original command.

If browser login is unavailable, set the API key:

```bash
export TAVILY_API_KEY="tvly-YOUR_KEY"
```

Or store it once with the CLI (`tvly` has no per-command `--api-key` flag):

```bash
tvly login --api-key "tvly-YOUR_KEY"
tvly search "your query" --client-name opencode
```

Always include `--client-name opencode` on `search`, `extract`, `map`, `crawl`, and `research` (after the subcommand) for request attribution.

Get an API key at [tavily.com](https://tavily.com).

If `TAVILY_API_KEY` is set in the environment, the plugin passes it through to shell commands.

## If You Fail to Authenticate

If ANY command returns an authentication error after `tvly login` (e.g. "not authenticated", "unauthorized", "API key"), ask the user how they'd like to authenticate:

**Question:** "How would you like to authenticate with Tavily?"

**Options:**

1. **Login with browser (Recommended)** — Opens the browser to authenticate with Tavily
2. **Enter API key manually** — Paste an existing API key from tavily.com

### If user selects browser login

Run `tvly login`, wait for confirmation, then retry the original command.

### If user selects manual API key

Ask for their API key, then:

```bash
export TAVILY_API_KEY="tvly-YOUR_KEY"
```

Or:

```bash
tvly login --api-key "tvly-YOUR_KEY"
```

Tell them to add the export to `~/.zshrc` or `~/.bashrc` for persistence, then retry the original command.

## Troubleshooting

### Command Not Found

If `tvly` is not found after installation:

1. Ensure `~/.local/bin` is on `PATH`
2. Reinstall: `curl -fsSL https://cli.tavily.com/install.sh | bash`
3. Or: `uv tool install tavily-cli`

### Permission Errors

```bash
export PATH=~/.local/bin:$PATH
curl -fsSL https://cli.tavily.com/install.sh | bash
```

### Rate Limits or Credit Issues

```bash
tvly --status
```

If credits are exhausted, visit [tavily.com](https://tavily.com) to manage the account.
