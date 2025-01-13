/**
 * Learn about schemas here:
 * https://jazz.tools/docs/react/schemas/covalues
 */

import { CoList, CoMap, co } from "jazz-tools";

export class Issue extends CoMap {
  title = co.string;
  description = co.string;
  estimate = co.number;
  status? = co.literal("backlog", "in progress", "done");
}

export class ListOfIssues extends CoList.Of(co.ref(Issue)) {}

export class Project extends CoMap {
  name = co.string;
  issues = co.ref(ListOfIssues);
}
