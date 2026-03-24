import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const shellDir = path.join(projectRoot, ".capacitor-shell");
const indexPath = path.join(shellDir, "index.html");

const html = `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pure Therapeutic ART</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Georgia, "Times New Roman", serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f7efe8;
        color: #201a16;
      }
      main {
        max-width: 28rem;
        padding: 2rem;
        text-align: center;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.75rem;
      }
      p {
        margin: 0;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Pure Therapeutic ART</h1>
      <p>
        Deze native shell laadt de beveiligde app-omgeving. Als dit scherm
        zichtbaar blijft, controleer dan de netwerkverbinding of de ingestelde
        Capacitor server-URL.
      </p>
    </main>
  </body>
</html>
`;

await mkdir(shellDir, { recursive: true });
await writeFile(indexPath, html, "utf8");
