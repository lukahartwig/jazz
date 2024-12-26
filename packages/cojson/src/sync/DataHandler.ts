import { BaseResponseHandler } from "./types.js";

export class DataHandler extends BaseResponseHandler {
  handleAvailable(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  handleLoading(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  handleUnavailable(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
