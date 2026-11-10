# opencode-tavily

> [!IMPORTANT]
> **This package has moved.** The Tavily plugin for OpenCode now lives in [tavily-ai/skills](https://github.com/tavily-ai/skills) and is published to npm as [`@tavily/opencode-plugin`](https://www.npmjs.com/package/@tavily/opencode-plugin). This repository is no longer maintained.

## Migrating

Replace `opencode-tavily` with `@tavily/opencode-plugin` in your `opencode.json`.

### OpenCode v2

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@tavily/opencode-plugin"]
}
```

### OpenCode v1.x

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@tavily/opencode-plugin"]
}
```

OpenCode installs the package automatically on next launch.

For setup, authentication, and the full list of skills, see the [OpenCode plugin section](https://github.com/tavily-ai/skills#opencode-plugin) of the tavily-ai/skills README. The plugin source is in [`.opencode-plugin/`](https://github.com/tavily-ai/skills/tree/main/.opencode-plugin).

## Links

- [tavily-ai/skills](https://github.com/tavily-ai/skills)
- [`@tavily/opencode-plugin` on npm](https://www.npmjs.com/package/@tavily/opencode-plugin)
- [Tavily Documentation](https://docs.tavily.com)

## License

MIT
