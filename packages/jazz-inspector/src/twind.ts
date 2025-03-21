import { setup } from "@twind/core";
import config from "./twind.config";

export const tw = setup(
  config,
  undefined,
  document.getElementById("__jazz_inspector")!,
);
