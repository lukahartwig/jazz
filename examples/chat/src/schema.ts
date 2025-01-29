import { j } from "jazz-tools/src/implementation/schema2.js";

export const Message = j.CoMap({
  text: j.string(),
  image: j.media.ImageDef.optional(),
});

export const Chat = j.CoMap({
  messages: j.CoList(Message),
});
