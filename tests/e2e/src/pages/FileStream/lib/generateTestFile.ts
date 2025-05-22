import { Account, Group, co } from "jazz-tools";
import { UploadedFile } from "../schema";

export async function generateTestFile(
  me: Account | null | undefined,
  bytes: number,
) {
  const group = Group.create(me ? { owner: me } : undefined);
  group.addMember("everyone", "writer");

  const ownership = { owner: group };
  const testFile = UploadedFile.create(
    {
      file: await co
        .fileStream()
        .createFromBlob(
          new Blob(["1".repeat(bytes)], { type: "image/png" }),
          ownership,
        ),
      syncCompleted: false,
      coMapDownloaded: false,
    },
    ownership,
  );

  const url = new URL(window.location.href);

  url.searchParams.set("valueId", testFile.id);

  return testFile;
}
