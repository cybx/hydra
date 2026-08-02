import { readFile } from "node:fs/promises";

import { registerEvent } from "../register-event";
import { downloadSourcesSublevel } from "@main/level";
import { sourceContainsPasskey } from "@main/services";

interface LocalSourceInspection {
  hasPasskey: boolean;
  name: string;
}

const inspectLocalSource = async (
  _event: Electron.IpcMainInvokeEvent,
  sourceId: string
): Promise<LocalSourceInspection> => {
  const source = await downloadSourcesSublevel.get(sourceId);

  if (!source?.isLocal) {
    return { hasPasskey: false, name: source?.name ?? "" };
  }

  try {
    const content = await readFile(source.url, "utf-8");
    return { hasPasskey: sourceContainsPasskey(content), name: source.name };
  } catch {
    return { hasPasskey: false, name: source.name };
  }
};

registerEvent("inspectLocalSource", inspectLocalSource);
