import { co, z } from "jazz-tools";

export const Message = co.map({
  text: z.string(),
});

export const Chat = co.list(Message);
