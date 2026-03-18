import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
const staticDir = path.join(rootDir, ".next", "static");
const publicDir = path.join(rootDir, "public");

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await pathExists(standaloneDir))) {
    throw new Error(
      "Standalone build output ontbreekt. Draai eerst `next build` met output=standalone."
    );
  }

  await rm(standaloneStaticDir, { recursive: true, force: true });
  await mkdir(path.dirname(standaloneStaticDir), { recursive: true });
  await cp(staticDir, standaloneStaticDir, { recursive: true });

  if (await pathExists(publicDir)) {
    await cp(publicDir, path.join(standaloneDir, "public"), {
      recursive: true,
    });
  }

  process.stdout.write(
    "Standalone bundle voorbereid in .next/standalone\n"
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
