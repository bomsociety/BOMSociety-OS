import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";

const root = new URL("../ghost-theme/", import.meta.url).pathname;
const releases = new URL("../releases/", import.meta.url).pathname;
await mkdir(releases, { recursive: true });
const output = join(releases, "bomsociety-theme-v0.1.0.zip");
execFileSync("zip", ["-r", output, "."], { cwd: root, stdio: "inherit" });
console.log(output);
