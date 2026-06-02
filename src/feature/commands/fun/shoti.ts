import axios from "axios";
import { VynCommand } from "../../../core/command/VynCommand.js";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileExists } from "../../utils/fileExists.js";
import { downloadFile } from "../../utils/downloadFile.js";
import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import { formatMsg } from "../../utils/formatMsg.js";

export default new VynCommand({
  name: "shoti",
  description: "Sends a random shoti from TikTok",

  execute: async (ctx) => {
    let response = await axios.get(
      "https://oreo.gleeze.com/api/shoti?stream=false",
    );

    let { data, status } = response;

    if (status !== 200) {
      throw new Error(`Failed to fetch shoti. HTTP status code: ${status}`);
    }

    let { link, title, nickname, reagion } = data;
    let filepath = path.join(CACHE_DIR, `shoti-${crypto.randomUUID()}.mp4`);
    try {
      await downloadFile(link, filepath);
      let author = (await ctx.vyn.client.users.getInfo(ctx.senderID))[
        ctx.senderID
      ];

      await ctx.reply({
        body: formatMsg({
          header: "Shoti",
          subheader: title,
          body: `Here's your random shoti from TikTok, @${author.name}!`,
          footer: `Nickname: ${nickname}\nRegion: ${reagion}`,
        }),
        mentions: [{ id: ctx.senderID, tag: `@${author.name}` }],
        attachment: ConduitAttachmentBuilder.create().from(filepath).build(),
      });
    } finally {
      if (await fileExists(filepath)) fs.unlink(filepath);
    }
  },
});
