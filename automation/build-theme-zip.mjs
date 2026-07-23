import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const theme = join(root, "..", "ghost-theme");
const releases = join(root, "..", "releases");
const themePackage = JSON.parse(await readFile(join(theme, "package.json"), "utf8"));
const output = join(releases, `UPLOAD-TO-GHOST-bomsociety-theme-v${themePackage.version}.zip`);
const commit = process.env.GITHUB_SHA || process.env.BUILD_COMMIT || "local";

await writeFile(join(theme, "partials", "build-commit.hbs"), `${commit.slice(0, 7)}\n`);
await mkdir(releases, { recursive: true });
await rm(output, { force: true });
execFileSync("zip", ["-r", output, "."], { cwd: theme, stdio: "inherit" });
console.log(output);
