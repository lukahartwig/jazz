import { isTryAddTransactionsException } from "../coValueCore.js";
import { CoValueAvailableState } from "../coValueEntry.js";
import { DependencyService } from "./DependencyService.js";
import { BaseMessageHandler, DataMessageHandlerInput } from "./types.js";

/**
 * "Data" is a response to our "pull" message. It's a terminal message which must not be responded to.
 * At this stage the coValue state is considered synced between the peer and the node.
 */
export class DataResponseHandler extends BaseMessageHandler {
  constructor(private readonly dependencyService: DependencyService) {
    super();
  }

  async handleAvailable(input: DataMessageHandlerInput): Promise<unknown> {
    await this.dependencyService.loadUnknownDependencies(input);

    return this.addData(input);
  }

  async handleLoading(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;

    // not known by peer
    if (!msg.known) {
      input.entry.dispatch({
        type: "not-found-in-peer",
        peerId: peer.id,
      });
      return;
    }

    if (!msg.header) {
      console.error(
        "Unexpected empty header in message. Data message is a response to a pull request and should be received for available coValue or include the full header.",
        msg.id,
        peer.id,
      );

      return;
    }

    await this.dependencyService.MakeAvailableWithDependencies(input);

    return this.handle(input);
  }

  async handleUnknown(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;

    if (!msg.asDependencyOf) {
      console.error(
        "Unexpected coValue unavailable state in DataResponseHandler",
        peer.id,
        msg.id,
      );
    }
    entry.moveToLoadingState([peer]);

    return this.handle(input);
  }

  addData(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;
    const { coValue } = entry.state as CoValueAvailableState;

    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      if (anyMissedTransaction) {
        console.error(
          "Unexpected missed transactions in data message",
          peer.id,
          msg,
        );

        return false;
      }
    } catch (e) {
      if (isTryAddTransactionsException(e)) {
        const { message, error } = e;
        console.error(peer.id, message, error);

        peer.erroredCoValues.set(msg.id, error);
      } else {
        console.error("Unknown error", peer.id, e);
      }

      return false;
    }
    return true;
  }
}
