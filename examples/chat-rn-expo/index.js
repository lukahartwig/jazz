// --- Zod Test Block ---
import { z } from "zod/v4";

try {
  console.log("Attempting Zod operation in index.js...");
  const schema = z.string();
  const result = schema.parse("test");
  console.log("Zod operation in index.js successful:", result);
} catch (e) {
  console.error("Zod operation in index.js FAILED:");
  console.error(e.stack || e);
  // Optionally, re-throw to ensure it's visible if it doesn't crash already
  // throw e;
}
// --- End Zod Test Block ---

import "./polyfills";
import { registerRootComponent } from "expo";
import App from "./src/App";
registerRootComponent(App);
