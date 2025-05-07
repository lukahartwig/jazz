import { CoPlainText } from "jazz-tools";
import { FieldValues } from "react-hook-form";
import { Folder } from "./1_schema";

export interface PasswordItemFormValues extends FieldValues {
  name: CoPlainText;
  username?: CoPlainText;
  password: CoPlainText;
  uri?: CoPlainText;
  deleted: boolean;
  folder: Folder | null;
}
