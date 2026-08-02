import { logger } from "./logger";

export interface PublishHost {
  id: string;
  name: string;
  /** Human-readable retention window shown in the UI. */
  retention: string;
}

/**
 * Ephemeral third-party file hosts used to publish a local source so the
 * remote (server-side) catalogue can index it once. Short retention is
 * preferred so the raw file is exposed for the least time possible.
 */
export const PUBLISH_HOSTS: PublishHost[] = [
  { id: "litterbox-1h", name: "litterbox (catbox.moe)", retention: "1 hour" },
  {
    id: "litterbox-72h",
    name: "litterbox (catbox.moe)",
    retention: "72 hours",
  },
  { id: "uguu", name: "uguu.se", retention: "~3 hours" },
];

const UA = "Hydra-Launcher (local source publish)";

// Heuristic: private-tracker passkeys embedded in announce URLs / query params.
const PASSKEY_RE =
  /[?&](passkey|apikey|authkey|torrent_pass|secret|rss_?key)=|\/a(nnounce)?\/[a-f0-9]{16,}(?:\/announce)?|\/[a-f0-9]{32,}\/announce/i;

export const sourceContainsPasskey = (content: string): boolean =>
  PASSKEY_RE.test(content);

const uploadToLitterbox = async (
  blob: Blob,
  filename: string,
  time: string
) => {
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("time", time);
  fd.append("fileToUpload", blob, filename);
  const res = await fetch(
    "https://litterbox.catbox.moe/resources/internals/api.php",
    { method: "POST", body: fd, headers: { "User-Agent": UA } }
  );
  const text = (await res.text()).trim();
  if (!res.ok || !text.startsWith("http")) {
    throw new Error(`litterbox upload failed: ${text.slice(0, 120)}`);
  }
  return text;
};

const uploadToUguu = async (blob: Blob, filename: string) => {
  const fd = new FormData();
  fd.append("files[]", blob, filename);
  const res = await fetch("https://uguu.se/upload?output=text", {
    method: "POST",
    body: fd,
    headers: { "User-Agent": UA },
  });
  const text = (await res.text()).trim();
  if (!res.ok || !text.startsWith("http")) {
    throw new Error(`uguu upload failed: ${text.slice(0, 120)}`);
  }
  return text;
};

/** Uploads JSON content to the chosen host and returns the raw file URL. */
export const uploadJsonToHost = async (
  hostId: string,
  content: string,
  filename = "source.json"
): Promise<string> => {
  const blob = new Blob([content], { type: "application/json" });

  logger.info(
    `Publishing local source to host "${hostId}" (${blob.size} bytes)`
  );

  if (hostId.startsWith("litterbox-")) {
    const time = hostId.slice("litterbox-".length) || "1h";
    return uploadToLitterbox(blob, filename, time);
  }

  if (hostId === "uguu") {
    return uploadToUguu(blob, filename);
  }

  throw new Error("unknown_host");
};
