/**
 * Learn about schemas here:
 * https://jazz.tools/docs/react/schemas/covalues
 */

import { Account, Profile, co } from "jazz-tools";

/** The account profile is an app-specific per-user public `CoMap`
 *  where you can store top-level objects for that user */
export class JazzProfile extends Profile {
  firstName = co.string;
  // lastName = co.string;
}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: JazzAccount) {}
}
