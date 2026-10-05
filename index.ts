import type { Plugin as V1Plugin } from "@opencode-ai/plugin";
import type { Plugin } from "@opencode/plugin";
import type { Skill } from "@opencode/schema";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const current_dir = dirname(fileURLToPath(import.meta.url));

/**
 * Parse a skill file's YAML frontmatter without a YAML dependency.
 * Returns the `name`, the block-style `description`, and the body below the frontmatter.
 */
function parseSkill(file: string): { name: string; description: string; body: string } {
  const raw = readFileSync(file, "utf8");
  const fence = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fence) return { name: "tavily", description: "", body: raw.trim() };
  const frontmatter = fence[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? "tavily";

  const descriptionMatch = frontmatter.match(/^description:\s*\|?\s*$/m);
  let description = "";
  if (descriptionMatch?.index !== undefined) {
    const lines: string[] = [];
    for (const line of frontmatter.slice(descriptionMatch.index).split("\n").slice(1)) {
      if (line.trim() !== "" && !/^\s/.test(line)) break;
      lines.push(line.replace(/^ {2}/, ""));
    }
    description = lines.join("\n").trim();
  }

  return { name, description, body: raw.slice(fence[0].length).trim() };
}

export default {
  id: "tavily",
  // V1 calls server(); V2 calls setup(). The hooks use their respective APIs.
  async server() {
    return {
      async config(input) {
        input.instructions ??= [];
        // The V1 SDK's Config type still omits the runtime skills setting.
        const config = input as typeof input & { skills?: { paths?: string[] } };
        config.skills ??= {};
        config.skills.paths ??= [];
        const installPath = join(current_dir, "skills", "tavily", "rules", "install.md");
        const skillsPath = join(current_dir, "skills");
        if (!input.instructions.includes(installPath)) {
          input.instructions.push(installPath);
        }
        if (!config.skills.paths.includes(skillsPath)) {
          config.skills.paths.push(skillsPath);
        }
      },
      "shell.env": async (_input, output) => {
        if (process.env.TAVILY_API_KEY) {
          output.env.TAVILY_API_KEY = process.env.TAVILY_API_KEY;
        }
      },
    };
  },
  async setup(ctx) {
    const skillPath = join(current_dir, "skills", "tavily", "SKILL.md");
    const { name, description, body } = parseSkill(skillPath);
    await ctx.skill.transform((editor) => {
      editor.add({
        id: "tavily" as Skill.ID,
        name: name as Skill.Name,
        description,
        path: skillPath as Skill.Info["path"],
        content: body,
      });
    });

    const install = readFileSync(
      join(current_dir, "skills", "tavily", "rules", "install.md"),
      "utf8",
    );
    await ctx.session.hook("context", (event) => {
      event.system.push({
        type: "text",
        text: `Tavily CLI installation instructions:\n\n${install}`,
      });
    });

    await ctx.shell.hook("create.before", (event) => {
      if (process.env.TAVILY_API_KEY) {
        event.env.TAVILY_API_KEY = process.env.TAVILY_API_KEY;
      }
    });
  },
} satisfies Plugin.Plugin & { server: V1Plugin };
