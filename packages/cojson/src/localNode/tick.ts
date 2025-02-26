import { CryptoProvider } from "../exports.js";
import {
  LoadMetadataFromStorageEffect,
  LoadTransactionsFromStorageEffect,
  NotifyListenerEffect,
  SendMessageToPeerEffect,
  WriteToStorageEffect,
} from "./effects.js";
import { stageLoad } from "./stages/0_load.js";
import { stageLoadDeps } from "./stages/1_loadDeps.js";
import { stageVerify } from "./stages/2_verify.js";
import { stageValidate } from "./stages/3_validate.js";
import { stageDecrypt } from "./stages/4_decrypt.js";
import { stageNotify } from "./stages/5_notify.js";
import { stageSyncOut } from "./stages/6_syncOut.js";
import { stageStore } from "./stages/7_store.js";
import { LocalNodeState } from "./structure.js";

export function tick(
  node: LocalNodeState,
  crypto: CryptoProvider,
): {
  effects: (
    | NotifyListenerEffect
    | SendMessageToPeerEffect
    | LoadMetadataFromStorageEffect
    | LoadTransactionsFromStorageEffect
    | WriteToStorageEffect
  )[];
} {
  const effects = [];

  effects.push(...stageLoad(node).effects);
  stageLoadDeps(node);
  stageVerify(node, crypto);
  stageValidate(node);
  stageDecrypt(node);
  effects.push(...stageNotify(node).effects);
  effects.push(...stageSyncOut(node).effects);
  effects.push(...stageStore(node).effects);
  return { effects };
}
