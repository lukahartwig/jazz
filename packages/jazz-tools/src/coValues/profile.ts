import { CoID } from "cojson";
import { CoValueClass, co, subscriptionsScopes } from "../internal.js";
import { CoMap, CoMapInit, Simplify } from "./coMap.js";
import { Group } from "./group.js";
import { InboxInvite, InboxRoot } from "./inbox.js";
import { RegisteredSchemas } from "./registeredSchemas.js";

/** @category Identity & Permissions */
export class Profile extends CoMap {
  name = co.string;
  inbox = co.optional.json<CoID<InboxRoot>>();
  inboxInvite = co.optional.json<InboxInvite>();

  override get _owner(): Group {
    const owner = RegisteredSchemas["Group"].fromRaw(this._raw.group);

    const subScope = subscriptionsScopes.get(this);
    if (subScope) {
      subScope.onRefAccessedOrSet(this.id, owner.id);
      subscriptionsScopes.set(owner, subScope);
    }

    return owner;
  }

  /**
   * Creates a new profile with the given initial values and owner.
   *
   * The owner (a Group) determines access rights to the Profile.
   *
   * @category Creation
   */
  static override create<M extends CoMap>(
    this: CoValueClass<M>,
    init: Simplify<CoMapInit<M>>,
    options?:
      | {
          owner: Group;
        }
      | Group,
  ) {
    return super.create<M>(init, options);
  }
}
