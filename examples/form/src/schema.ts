import { RawCoMap } from "cojson";
import { Account, CoList, CoMap, CoPlainText, co } from "jazz-tools";

export const BubbleTeaAddOnTypes = [
  "Pearl",
  "Lychee jelly",
  "Red bean",
  "Brown sugar",
  "Taro",
] as const;

export const BubbleTeaBaseTeaTypes = [
  "Black",
  "Oolong",
  "Jasmine",
  "Thai",
] as const;

export class ListOfBubbleTeaAddOns extends CoList.Of(
  co.literal(...BubbleTeaAddOnTypes),
) {
  get hasChanges() {
    return Object.entries(this._raw.insertions).length > 0;
  }
}

// v1 schema
export class BubbleTeaOrder_v1 extends CoMap {
  baseTea = co.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.Date;
  withMilk = co.boolean;
  instructions = co.string;
}

// v2 schema
export class BubbleTeaOrder extends CoMap {
  baseTea = co.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.Date;
  withMilk = co.boolean;
  instructions = co.optional.ref(CoPlainText);
}

function selectOrderSchema(raw: RawCoMap) {
  const instructions = raw.get("instructions");

  if (
    instructions &&
    typeof instructions === "string" &&
    !instructions.startsWith("co_z")
  ) {
    return BubbleTeaOrder_v1;
  }

  return BubbleTeaOrder;
}

// Draft schemas
export class DraftBubbleTeaOrderBase extends CoMap {
  baseTea = co.optional.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.optional.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.optional.Date;

  get hasChanges() {
    return Object.keys(this._edits).length > 1 || this.addOns?.hasChanges;
  }

  // validate if the draft is a valid order
  validate() {
    const errors: string[] = [];

    if (!this.baseTea) {
      errors.push("Please select your preferred base tea.");
    }
    if (!this.deliveryDate) {
      errors.push("Plese select a delivery date.");
    }

    return { errors };
  }
}

// v1 draft schema
export class DraftBubbleTeaOrder_v1 extends DraftBubbleTeaOrderBase {
  baseTea = co.optional.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.optional.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.optional.Date;
  withMilk = co.optional.boolean;
  instructions = co.optional.string;
}

// v2 draft schema
export class DraftBubbleTeaOrder extends DraftBubbleTeaOrderBase {
  baseTea = co.optional.literal(...BubbleTeaBaseTeaTypes);
  addOns = co.optional.ref(ListOfBubbleTeaAddOns);
  deliveryDate = co.optional.Date;
  withMilk = co.optional.boolean;
  instructions = co.optional.ref(CoPlainText);
}

function selectDraftSchema(raw: RawCoMap) {
  const instructions = raw.get("instructions");

  if (
    instructions &&
    typeof instructions === "string" &&
    !instructions.startsWith("co_z")
  ) {
    return DraftBubbleTeaOrder_v1;
  }

  return DraftBubbleTeaOrder;
}

export class ListOfBubbleTeaOrders extends CoList.Of(
  co.ref(selectOrderSchema),
) {}

/** The root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class AccountRoot extends CoMap {
  draft = co.ref(selectDraftSchema);
  orders = co.ref(ListOfBubbleTeaOrders);
}

export class JazzAccount extends Account {
  root = co.ref(AccountRoot);

  migrate() {
    const account = this;

    if (!this._refs.root) {
      const orders = ListOfBubbleTeaOrders.create([], account);
      const draft = DraftBubbleTeaOrder.create(
        {
          addOns: ListOfBubbleTeaAddOns.create([], account),
        },
        account,
      );

      this.root = AccountRoot.create({ draft, orders }, account);
    }
  }
}
