import axios from "axios";
import fs from "fs";
import { ensureDir } from "./ensureDir";

function normalizeHeaders(header?: HeadersInit): Record<string, string> {
  if (!header) return {};

  if (header instanceof Headers) {
    return Object.fromEntries(header.entries());
  }

  if (Array.isArray(header)) {
    return Object.fromEntries(header);
  }

  return header;
}

export async function downloadFile(
  url: string,
  dest: string,
  header?: HeadersInit,
): Promise<void> {
  const response = await axios.get(url, {
    headers: normalizeHeaders(header),
    responseType: "stream",
  });

  await ensureDir(dest)

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(dest);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
