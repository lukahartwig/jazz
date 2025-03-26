import type { BetterAuthClientPlugin } from "better-auth";
import type { jazzPlugin } from "./index.js";

type JazzPlugin = typeof jazzPlugin;

export const jazzClientPlugin = () => {
  return {
    id: "jazz-plugin",
    $InferServerPlugin: {} as ReturnType<JazzPlugin>,
  } satisfies BetterAuthClientPlugin;
};
