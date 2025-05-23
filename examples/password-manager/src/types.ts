import { Loaded } from "jazz-tools";
import { FieldValues } from "react-hook-form";
import { Folder } from "./1_schema";

export interface PasswordItemFormValues extends FieldValues {
  name: string;
  username?: string;
  password: string;
  uri?: string;
  deleted: boolean;
  folder: Loaded<typeof Folder>;
}
