import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import plugin from "../index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsPath = join(root, "skills");
const skillPath = join(skillsPath, "tavily", "SKILL.md");
const installPath = join(skillsPath, "tavily", "rules", "install.md");
type V1Config = Parameters<Awaited<ReturnType<typeof plugin.server>>["config"]>[0] & {
  skills?: { paths?: string[] };
};
type V2Context = Parameters<typeof plugin.setup>[0];
type SkillEditor = Parameters<Parameters<V2Context["skill"]["transform"]>[0]>[0];
type SkillInfo = Parameters<SkillEditor["add"]>[0];

function skillEditor(skills: SkillInfo[]): SkillEditor {
  return {
    add(skill) { skills.push(skill); },
    list() { return []; },
    get() { return undefined; },
    update() { throw new Error("Unexpected skill update"); },
    remove() { throw new Error("Unexpected skill removal"); },
  };
}

// Only domains consumed by this plugin are implemented by this test context.
async function setupV2() {
  const skills: SkillInfo[] = [];
  const transforms: Array<(editor: SkillEditor) => void> = [];
  const hooks = new Map<string, (event: unknown) => void | Promise<void>>();
  const registration = { async dispose() {} };
  const context = {
    skill: {
      async transform(callback: (editor: SkillEditor) => void) {
        transforms.push(callback);
        callback(skillEditor(skills));
        return registration;
      },
    },
    session: {
      async hook(name: string, callback: (event: unknown) => void | Promise<void>) {
        hooks.set(`session.${name}`, callback);
        return registration;
      },
    },
    shell: {
      async hook(name: string, callback: (event: unknown) => void | Promise<void>) {
        hooks.set(`shell.${name}`, callback);
        return registration;
      },
    },
  };
  await plugin.setup(context as unknown as V2Context);
  return { skills, transforms, hooks };
}

describe("dual-version plugin", () => {
  let originalKey: string | undefined;
  let originalName: string | undefined;
  beforeEach(() => {
    originalKey = process.env.TAVILY_API_KEY;
    originalName = process.env.TAVILY_CLIENT_NAME;
    delete process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_CLIENT_NAME;
  });
  afterEach(() => {
    if (originalKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = originalKey;
    if (originalName === undefined) delete process.env.TAVILY_CLIENT_NAME;
    else process.env.TAVILY_CLIENT_NAME = originalName;
  });

  it("default-exports one definition with both version entrypoints", () => {
    assert.equal(plugin.id, "tavily");
    assert.equal(typeof plugin.server, "function");
    assert.equal(typeof plugin.setup, "function");
  });

  it("V1 registers skill paths and installation instructions on an empty config", async () => {
    const hooks = await plugin.server();
    const config: V1Config = {};
    await hooks.config(config);
    assert.deepEqual(config.instructions, [installPath]);
    assert.deepEqual(config.skills?.paths, [skillsPath]);
  });

  it("V1 preserves existing config and avoids duplicates on repeated calls", async () => {
    const hooks = await plugin.server();
    const config: V1Config = {
      instructions: ["AGENTS.md"],
      skills: { paths: ["./team-skills"] },
    };
    await hooks.config(config);
    await hooks.config(config);
    assert.deepEqual(config.instructions, ["AGENTS.md", installPath]);
    assert.deepEqual(config.skills?.paths, ["./team-skills", skillsPath]);
  });

  it("V1 forwards the API key without overwriting unrelated environment variables", async () => {
    const hooks = await plugin.server();
    process.env.TAVILY_API_KEY = "tvly-test-only";
    const output = { env: { KEEP: "value" } as Record<string, string> };
    await hooks["shell.env"]({ cwd: root }, output);
    assert.deepEqual(output.env, { KEEP: "value", TAVILY_API_KEY: "tvly-test-only", TAVILY_CLIENT_NAME: "opencode" });
  });

  it("V1 leaves the environment unchanged when no API key is set", async () => {
    const hooks = await plugin.server();
    const output = { env: { TAVILY_API_KEY: "existing" } };
    await hooks["shell.env"]({ cwd: root }, output);
    assert.deepEqual(output.env, { TAVILY_API_KEY: "existing", TAVILY_CLIENT_NAME: "opencode" });
  });

  it("V2 registers the packaged skill with parsed frontmatter and a replayable transform", async () => {
    const { skills, transforms } = await setupV2();
    assert.equal(skills.length, 1);
    const skill = skills[0];
    assert.equal(skill.id, "tavily");
    assert.equal(skill.name, "tavily");
    assert.equal(skill.path, skillPath);
    assert.ok(skill.description);
    assert.match(skill.description, /Tavily handles all web operations/);
    assert.match(skill.description, /Requires `tvly` CLI/);
    assert.ok(skill.content);
    assert.match(skill.content, /^# Tavily CLI/);
    assert.match(skill.content, /--client-name opencode/);
    const replayed: SkillInfo[] = [];
    transforms[0](skillEditor(replayed));
    assert.deepEqual(replayed, skills);
  });

  it("V2 appends installation instructions without removing existing system context", async () => {
    const { hooks } = await setupV2();
    const event = { system: [{ type: "text", text: "Existing instructions" }] };
    await hooks.get("session.context")!(event);
    assert.deepEqual(event.system, [
      { type: "text", text: "Existing instructions" },
      {
        type: "text",
        text: `Tavily CLI installation instructions:\n\n${readFileSync(installPath, "utf8")}`,
      },
    ]);
  });

  it("V2 forwards the API key through create.before and preserves other variables", async () => {
    const { hooks } = await setupV2();
    process.env.TAVILY_API_KEY = "tvly-test-only";
    const event = { env: { KEEP: "value" } as Record<string, string> };
    await hooks.get("shell.create.before")!(event);
    assert.deepEqual(event.env, { KEEP: "value", TAVILY_API_KEY: "tvly-test-only", TAVILY_CLIENT_NAME: "opencode" });
  });

  it("V2 leaves the environment unchanged when no API key is set", async () => {
    const { hooks } = await setupV2();
    const event = { env: { TAVILY_API_KEY: "existing" } };
    await hooks.get("shell.create.before")!(event);
    assert.deepEqual(event.env, { TAVILY_API_KEY: "existing", TAVILY_CLIENT_NAME: "opencode" });
  });
});

describe("client name for the tvly CLI", () => {
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.TAVILY_CLIENT_NAME;
    delete process.env.TAVILY_CLIENT_NAME;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.TAVILY_CLIENT_NAME;
    else process.env.TAVILY_CLIENT_NAME = original;
  });

  it("V1 sets TAVILY_CLIENT_NAME=opencode by default and preserves explicit values", async () => {
    const hooks = await plugin.server();
    const output = { env: {} as Record<string, string> };
    await hooks["shell.env"]({ cwd: root }, output);
    assert.equal(output.env.TAVILY_CLIENT_NAME, "opencode");
    const explicit = { env: { TAVILY_CLIENT_NAME: "my-team" } as Record<string, string> };
    await hooks["shell.env"]({ cwd: root }, explicit);
    assert.equal(explicit.env.TAVILY_CLIENT_NAME, "my-team");
    process.env.TAVILY_CLIENT_NAME = "from-process";
    const fromProcess = { env: {} as Record<string, string> };
    await hooks["shell.env"]({ cwd: root }, fromProcess);
    assert.equal(fromProcess.env.TAVILY_CLIENT_NAME, "from-process");
  });

  it("V2 sets TAVILY_CLIENT_NAME=opencode by default and preserves explicit values", async () => {
    const { hooks } = await setupV2();
    const event = { env: {} as Record<string, string> };
    await hooks.get("shell.create.before")!(event);
    assert.equal(event.env.TAVILY_CLIENT_NAME, "opencode");
    const explicit = { env: { TAVILY_CLIENT_NAME: "my-team" } as Record<string, string> };
    await hooks.get("shell.create.before")!(explicit);
    assert.equal(explicit.env.TAVILY_CLIENT_NAME, "my-team");
    process.env.TAVILY_CLIENT_NAME = "from-process";
    const fromProcess = { env: {} as Record<string, string> };
    await hooks.get("shell.create.before")!(fromProcess);
    assert.equal(fromProcess.env.TAVILY_CLIENT_NAME, "from-process");
  });
});

describe("bundled CLI instructions", () => {
  it("only documents CLI forms that exist", () => {
    // tvly declares --api-key on `login`, not as a global or per-command option.
    assert.doesNotMatch(readFileSync(installPath, "utf8"), /tvly --api-key/);
  });

  it("states the API defaults for search", () => {
    const skill = readFileSync(skillPath, "utf8");
    assert.match(skill, /--max-results` — 0–20 \(default: 10/);
    assert.match(skill, /--chunks-per-source` — 1–3 \(`basic`, `advanced` and `fast`/);
  });
});
