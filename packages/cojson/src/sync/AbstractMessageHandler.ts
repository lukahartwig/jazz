import { QueueRunner } from "../queueUtils/queueRunner.js";
import { MessageHandlerInput, MessageHandlerInterface } from "./types.js";

export abstract class AbstractMessageHandler
  implements MessageHandlerInterface
{
  private readonly queue = new QueueRunner();

  handle({ msg, peer, entry }: MessageHandlerInput) {
    this.queue.defferForId(msg.id, () =>
      this.routeMessageByEntryState({ msg, peer, entry }),
    );
  }

  protected routeMessageByEntryState({
    msg,
    peer,
    entry,
  }: MessageHandlerInput) {
    switch (entry.state.type) {
      case "available":
        return this.handleAvailable({ msg, peer, entry });
      case "loading":
        return this.handleLoading({ msg, peer, entry });
      case "unknown":
      case "unavailable":
        return this.handleUnknown({ msg, peer, entry });
    }
  }
  abstract handleAvailable(input: MessageHandlerInput): Promise<unknown>;
  abstract handleLoading(input: MessageHandlerInput): Promise<unknown>;
  abstract handleUnknown(input: MessageHandlerInput): Promise<unknown>;
}
