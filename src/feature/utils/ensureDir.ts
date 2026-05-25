import fs from "fs";
import path from "path";

export async function ensureDir(filepath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
}
