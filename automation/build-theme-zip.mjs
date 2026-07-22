import { mkdir, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const theme = join(root, "..", "ghost-theme");
const releases = join(root, "..", "releases");
const themePackage = JSON.parse(await readFile(join(theme, "package.json"), "utf8"));
const output = join(releases, `UPLOAD-TO-GHOST-bomsociety-theme-v${themePackage.version}.zip`);

await mkdir(releases, { recursive: true });
await rm(output, { force: true });
execFileSync("zip", ["-r", output, "."], { cwd: theme, stdio: "inherit" });
console.log(output);
