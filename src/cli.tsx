#!/usr/bin/env node
import { createRequire } from "node:module";
import { render } from "ink";
import { App } from "./app.js";

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  const require = createRequire(import.meta.url);
  const { version } = require("../package.json") as { version: string };
  console.log(version);
  process.exit(0);
}

render(<App />);
