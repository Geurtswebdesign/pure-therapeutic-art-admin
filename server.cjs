const fs = require("node:fs");
const path = require("node:path");

process.chdir(__dirname);

const standaloneServerPath = path.join(
  __dirname,
  ".next",
  "standalone",
  "server.js"
);

if (!fs.existsSync(standaloneServerPath)) {
  console.error(
    "Standalone server ontbreekt. Draai eerst `npm run build:standalone` in de applicatiehoofdmap."
  );
  process.exit(1);
}

require(standaloneServerPath);
