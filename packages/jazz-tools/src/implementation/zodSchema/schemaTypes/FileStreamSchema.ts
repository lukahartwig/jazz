import z from "zod/v4";
import { FileStream } from "../../../internal.js";

export type FileStreamSchema = z.core.$ZodCustom<FileStream, unknown> & {
  collaborative: true;
  builtin: "FileStream";
  create: (typeof FileStream)["create"];
  createFromBlob: (typeof FileStream)["createFromBlob"];
};
