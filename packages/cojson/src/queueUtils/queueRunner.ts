import { RawCoID } from "../ids.js";
type DeferredFn = () => Promise<unknown>;

export class QueueRunner {
  private coIds: Map<RawCoID, { queue: DeferredFn[]; active: boolean }> =
    new Map();

  defferForId(id: RawCoID, fn: () => Promise<unknown>) {
    const item = this.coIds.get(id);
    if (item) {
      item.queue.push(fn);
    } else {
      this.coIds.set(id, { queue: [fn], active: false });
    }

    void this.processQueue(id);
  }

  private async processQueue(id: RawCoID) {
    const item = this.coIds.get(id)!;

    if (item.active) return;
    item.active = true;

    while (item.queue.length) {
      try {
        await item.queue.shift()!();
      } catch (e) {
        console.error(`Error while processing queue for ${id} ${e}`);
      }
    }

    item.active = false;
  }
}

// Test it
// function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
//
// function test(id: RawCoID, msg: string, ms: number) {
//   queue.deffer(id, async () => {
//     console.log(id, msg, "start");
//     await sleep(ms);
//     console.log(id, msg, "end");
//   });
// }
//
// const queue = new QueueRunner();
//
// test("co_zXkkbcca9nkdfJHBo4RHhX22Tf", "1", 400);
// test("co_zXkkbcca9nkdfJHBo4RHhX22Tf", "2", 300);
// test("111", "1", 200);
// test("111", "2", 200);
// test("111", "3", 200);
// test("co_zXkkbcca9nkdfJHBo4RHhX22Tf", "3", 200);
// test("co_zXkkbcca9nkdfJHBo4RHhX22Tf", "4", 200);
// test("co_zXkkbcca9nkdfJHBo4RHhX22Tf", "5", 200);
