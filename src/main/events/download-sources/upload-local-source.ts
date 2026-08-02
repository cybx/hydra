import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { registerEvent } from "../register-event";
import { downloadSourcesSublevel } from "@main/level";
import { uploadJsonToHost } from "@main/services";

const uploadLocalSource = async (
  _event: Electron.IpcMainInvokeEvent,
  sourceId: string,
  hostId: string
): Promise<{ url: string }> => {
  const source = await downloadSourcesSublevel.get(sourceId);

  if (!source?.isLocal) {
    throw new Error("not_a_local_source");
  }

  const content = await readFile(source.url, "utf-8");
  const filename = basename(source.url) || "source.json";
  const url = await uploadJsonToHost(hostId, content, filename);

  return { url };
};

registerEvent("uploadLocalSource", uploadLocalSource);
