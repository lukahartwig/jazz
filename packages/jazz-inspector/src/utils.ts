import { ClassValue, clsx } from "clsx";
import { tw } from "./twind.js";

export const classNames = (...inputs: ClassValue[]) => {
  return tw(clsx(inputs));
};
