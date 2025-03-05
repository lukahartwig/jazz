import { CoMapInstance, CoMapSchema } from "./coMap.js";
import {
  ensureCoValueLoaded,
  loadCoValue,
  subscribeToCoValue,
} from "./subscribe.js";

export const SchemaV2 = {
  CoMap: CoMapSchema,
  CoMapInstance: CoMapInstance,
  subscribeToCoValue: subscribeToCoValue,
  ensureCoValueLoaded: ensureCoValueLoaded,
  loadCoValue: loadCoValue,
} as const;

export type SchemaV2 = typeof SchemaV2;
