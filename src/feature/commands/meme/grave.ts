import { createCanvas, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { unlink, writeFile } from "fs/promises";
import { VynCommand } from "../../../core/command/VynCommand.js";
import path from "path";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import { ensureDir } from "../../utils/ensureDir.js";
import { fileExists } from "../../utils/fileExists.js";
import { wrapText } from "../../utils/canvas/wrapText.js";

const GRAVE_IMG_PATH = path.join(
  __dirname,
  "../../../../assets/images/grave.jpg",
);

const CANVAS_SIZE = 520;
const CAPT_IMG_H = CANVAS_SIZE / 4;
const CAPT_IMG_Y = 90;

export default new VynCommand({
  name: "grave",
  description: "Creates the grave meme based on the given arguments",
  argsInfo: [
    {
      type: "argument",
      name: "text1",
      description: "The text to put on the tombstone",
      required: true,
    },
    {
      type: "argument",
      name: "text2",
      description: "The text to put as the man's caption",
      required: true,
    },
    {
      type: "replyable",
      name: "img",
      description: "The image you want to use for the meme",
    },
  ],

  execute: async (ctx) => {
    const text1 = ctx.getArgument("text1")!;
    const text2 = ctx.getArgument("text2")!;
    const img = ctx.getReplyable("img")?.attachments[0];

    const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const c = canvas.getContext("2d");

    const graveImg = await loadImage(GRAVE_IMG_PATH);

    c.drawImage(graveImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (img) {
      if (img.type !== "photo" || !img.url)
        throw new Error(
          "The replied message must contain an image attachment.",
        );
      const captImg = await loadImage(img.url);
      c.drawImage(captImg, 65, CAPT_IMG_Y, CANVAS_SIZE / 4, CAPT_IMG_H);
    }

    const textY = img ? CAPT_IMG_Y + CAPT_IMG_H + 30 : 200;
    drawBorderText(c, text1, 65, textY, 180);

    drawBorderText(c, text2, 280, 300, 220);

    const outPath = path.join(CACHE_DIR, `grave-${crypto.randomUUID()}.png`);
    try {
      await ensureDir(outPath);
      let buffer = await canvas.encode("png");
      await writeFile(outPath, buffer);

      await ctx.reply({
        attachment: ConduitAttachmentBuilder.create().from(outPath).build(),
      });
    } finally {
      if (await fileExists(outPath)) unlink(outPath);
    }
  },
});

function drawBorderText(
  c: SKRSContext2D,
  txt: string,
  x: number,
  y: number,
  maxWidth = 200,
  lineHeight = 30,
): void {
  c.font = "25px Montserrat";
  const lines = wrapText(c, txt, maxWidth);

  for (let i = 0; i < lines.length; i++) {
    const ly = y + i * lineHeight;

    c.strokeStyle = "black";
    c.lineWidth = 4;
    c.strokeText(lines[i], x, ly);

    c.fillStyle = "white";
    c.fillText(lines[i], x, ly);
  }
}
