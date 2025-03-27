import { Account, CoFeed, CoMap, Group, Profile, co } from "jazz-tools";
import type { Camera, Cursor } from "./types";

export class CursorFeed extends CoFeed.Of(co.json<Cursor>()) {}

export class CursorProfile extends Profile {
  name = co.string;
}

export class CursorRoot extends CoMap {
  camera = co.json<Camera>();
  cursors = co.ref(CursorFeed);
}

export class CursorContainer extends CoMap {
  cursorFeed = co.ref(CursorFeed);
}

export class CursorAccount extends Account {
  profile = co.ref(CursorProfile);
  root = co.ref(CursorRoot);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: CursorAccount) {
    if (this.root === undefined) {
      this.root = CursorRoot.create({
        camera: {
          position: {
            x: 0,
            y: 0,
          },
        },
        cursors: CursorFeed.create([]),
      });
    }

    if (this.profile === undefined) {
      const group = Group.create();
      group.addMember("everyone", "reader"); // The profile info is visible to everyone

      this.profile = CursorProfile.create(
        {
          name: "Anonymous user",
        },
        group,
      );
    }
  }
}
