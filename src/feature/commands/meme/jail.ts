import { createCanvas, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { VynCommand } from "../../../core/command/VynCommand.js";
import crypto from "crypto";
import fs from "fs/promises";
import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import path from "path";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import { ensureDir } from "../../utils/ensureDir.js";
import { getHDProfilePicture } from "../../utils/getHDProfilePicture.js";
import {
  createRenderer,
  loadImages,
} from "../../utils/canvas/createRenderer.js";
import { fileExists } from "../../utils/fileExists.js";

const BASE_IMG_PATH = path.join(
  __dirname,
  "../../../../assets/images/jail.png",
);

const CANVAS_SIZE = 540;

export default new VynCommand({
  name: "jail",
  description: "Send yourself or someone else to jail",
  argsInfo: [
    {
      type: ["mentionable", "replyable"],
      name: "target",
      description: "The user to send to jail (defaults to yourself)",
    },
  ],

  execute: async (ctx) => {
    let filepath = path.join(
      CACHE_DIR,
      `importantify-${crypto.randomUUID()}.png`,
    );

    try {
      let userId =
        ctx.getReplyable("target")?.senderID ??
        ctx.getMentionable("target")?.id ??
        ctx.senderID;
      let profilePicURL = getHDProfilePicture(userId);

      let { canvas, ctx: c } = createRenderer(CANVAS_SIZE);
      let [profilePic, jail] = await loadImages(profilePicURL, BASE_IMG_PATH);

      c.drawImage(profilePic, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      c.drawImage(jail, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      await ensureDir(filepath);
      let buffer = await canvas.encode("png");
      await fs.writeFile(filepath, buffer, "utf8");

      await ctx.reply({
        attachment: ConduitAttachmentBuilder.create().from(filepath).build(),
      });
    } finally {
      if (await fileExists(filepath)) fs.unlink(filepath);
    }
  },
});
