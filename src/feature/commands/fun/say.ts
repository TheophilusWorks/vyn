import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import { VynCommand } from "../../../core/command/VynCommand.js";
import path from "path";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import { downloadFile } from "../../utils/downloadFile.js";

const headers: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  Referer: "https://translate.google.com/",
  Origin: "https://translate.google.com",
};

export default new VynCommand({
  name: "say",
  description: "Says the message back to the user in TTS",
  aliases: ["tts"],
  argsInfo: [
    {
      type: "argument",
      name: "msg",
      description: "The message to echo back",
      required: true,
    },
    {
      type: "argument",
      name: "lang",
      description: "The language to speak the message in (default: en)",
    },
  ],

  execute: async (ctx) => {
    let msg = ctx.getArgument("msg")!;
    let language = ctx.getArgument("lang") ?? "en";
    let filepath = path.join(CACHE_DIR, `tts-${crypto.randomUUID()}.mp3`);

    await downloadFile(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${language}&client=tw-ob`,
      filepath,
      headers,
    );

    ctx.reply({
      attachment: ConduitAttachmentBuilder.create().from(filepath).build(),
    });
  },
});
