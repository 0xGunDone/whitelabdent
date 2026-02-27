const fs = require("node:fs");
const path = require("node:path");

const distEntry = path.join(__dirname, "dist", "server.js");

if (!fs.existsSync(distEntry)) {
  console.error("TS-сборка не найдена. Запустите: npm run build");
  process.exit(1);
}

require(distEntry);
