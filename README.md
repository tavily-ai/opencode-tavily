# opencode-tavily

OpenCode plugin for [Tavily](https://tavily.com) — gives your AI agent reliable web search, content extraction, crawling, URL discovery, and deep research with citations.

Supports OpenCode **v1.18.29+ (1.x)** and **v2** using OpenCode's [documented dual-version entrypoint](https://opencode.ai/v2/docs/build/plugins/migrate-v1): v1 calls `server()`, and v2 calls `setup()`.

## Installation

Add the plugin to your `opencode.json`. The configuration key differs between versions.

### OpenCode v2

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-tavily"]
}
```

### OpenCode v1.18.29+

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-tavily"]
}
```

OpenCode installs the package automatically on next launch

### Install from Git

Use the Git source instead of the npm package name. For v2:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:tavily-ai/opencode-tavily"]
}
```

For v1.18.29+:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["github:tavily-ai/opencode-tavily"]
}
```

### Install the Tavily CLI

Then install the Tavily CLI globally:

```bash
curl -fsSL https://cli.tavily.com/install.sh | bash
```

Or via Python:

```bash
uv tool install tavily-cli
# or
pip install tavily-cli
```

## Authentication

On first use, the agent will prompt you to authenticate. You can also set up in advance:

```bash
# Browser login (recommended)
tvly login
# Or set an API key
export TAVILY_API_KEY=tvly-your-api-key
```

Get an API key at [tavily.com](https://tavily.com).

If `TAVILY_API_KEY` is set in your environment, the plugin automatically passes it to shell commands.

## What It Does

This plugin registers the Tavily CLI skill with OpenCode. Once installed, the agent can:

- **Search** the web with optional content extraction
- **Extract** any webpage to clean markdown or text
- **Map** all URLs on a website
- **Crawl** entire websites recursively
- **Research** — AI-powered deep research with citations

All output is written to a `.tavily/` directory to avoid flooding context.

## Tools Summary

| Command | Use When | Key Flags |
|---------|----------|-----------|
| `tvly search` | No specific URL yet — find sources and answer questions | `--client-name opencode`, `--depth`, `--max-results`, `--time-range`, `--include-raw-content` |
| `tvly extract` | Have URL(s) — pull clean content (up to 20 per call) | `--client-name opencode`, `--extract-depth`, `--query`, `--chunks-per-source` |
| `tvly map` | Need to discover URLs on a large site | `--client-name opencode`, `--limit`, `--instructions`, `--max-depth` |
| `tvly crawl` | Need bulk content from a site section | `--client-name opencode`, `--max-depth`, `--max-breadth`, `--output-dir` |
| `tvly research` | Need comprehensive, multi-source analysis | `--client-name opencode`, `--model`, `--stream`, `status` / `poll` |

## Links

- [Tavily](https://tavily.com)
- [Tavily Documentation](https://docs.tavily.com)
- [Tavily CLI Installation](https://cli.tavily.com)
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins)
- [OpenCode Ecosystem](https://opencode.ai/docs/ecosystem)

## License

MIT
