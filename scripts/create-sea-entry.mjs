#!/usr/bin/env node
/* global console */
// Generates a CJS wrapper for Node.js SEA from the ESM bundle.
// SEA only supports CJS, so this writes the ESM bundle to a temp file
// at runtime and dynamic-imports it.

import { readFileSync, writeFileSync } from "node:fs";

const esmBundle = readFileSync("dist/nugman-bundle.mjs", "utf8");

const cjsEntry = `"use strict";
const { writeFileSync, mkdtempSync, unlinkSync, rmdirSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");

const code = ${JSON.stringify(esmBundle)};
const tmp = mkdtempSync(join(tmpdir(), "nugman-"));
const entry = join(tmp, "nugman.mjs");
writeFileSync(entry, code);

import(entry)
  .finally(() => {
    try { unlinkSync(entry); } catch {}
    try { rmdirSync(tmp); } catch {}
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
`;

writeFileSync("dist/nugman-sea-entry.cjs", cjsEntry);
console.log("Created dist/nugman-sea-entry.cjs");
