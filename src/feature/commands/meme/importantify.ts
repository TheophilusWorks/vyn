import { createCanvas, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { VynCommand } from "../../../core/command/VynCommand.js";
import crypto from "crypto";
import fs from "fs/promises";
import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import path from "path";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import { ensureDir } from "../../utils/ensureDir.js";
import {
  createRenderer,
  loadImages,
} from "../../utils/canvas/createRenderer.js";

const BASE_IMG_PATH = path.join(
  __dirname,
  "../../../../assets/images/important.png",
);

const CANVAS_SIZE = 540;
const FONT_SIZE = 28;
const TEXT_PADDING = 15;
const PADDING = 3.25;
const BORDER_SIZE = 7;

const BORDER_COLOR = "#ffffff";
const FONT = `${FONT_SIZE}px Monserrat`;

export default new VynCommand({
  name: "importantify",
  description: "Importantifies your message and meme-ifies it",
  aliases: ["impify", "imp", "important"],
  argsInfo: [
    {
      type: "replyable",
      name: "img",
      description: "The image to importantify",
      required: true,
    },
    {
      type: "argument",
      name: "caption",
      description: "The caption to add to the image",
    },
  ],

  execute: async (ctx) => {
    let outputPath: string = "";

    try {
      let img = ctx.getReplyable("img")!;
      const target = img.attachments[0].url!;

      if (img.attachments[0].type !== "photo") {
        throw new Error(
          "The replied message must contain an image attachment.",
        );
      }

      if (!target) {
        throw new Error("No image found in the replied message.");
      }

      const caption = ctx.getArgument("caption") || "";

      const { canvas, ctx: c } = createRenderer(CANVAS_SIZE);
      const [baseImg, targetImg] = await loadImages(BASE_IMG_PATH, target);

      drawBase(c, canvas, baseImg);
      drawTarget(c, canvas, targetImg);
      drawBorder(c, canvas);
      if (caption) drawCaption(c, canvas, caption);

      outputPath = await saveCanvas(canvas);

      await ctx.reply({
        attachment: ConduitAttachmentBuilder.create().from(outputPath).build(),
      });
    } finally {
      if (outputPath) fs.unlink(outputPath).catch(() => {});
    }
  },
});

function drawBase(ctx: SKRSContext2D, canvas: any, image: any) {
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function drawTarget(ctx: SKRSContext2D, canvas: any, image: any) {
  const qx = canvas.width / 2;
  const qy = canvas.height / 2;
  const qw = canvas.width / 2;
  const qh = canvas.height / 2;
  const imgW = qw - PADDING;
  const imgH = qh - PADDING;
  const imgX = qx + (qw - imgW) / 2 - 2.3;
  const imgY = qy + (qh - imgH) / 2 - 5;
  ctx.drawImage(image, imgX, imgY, imgW, imgH);
}

function drawBorder(ctx: SKRSContext2D, canvas: any) {
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = BORDER_SIZE;
  ctx.strokeRect(
    BORDER_SIZE / 2,
    BORDER_SIZE / 2,
    canvas.width - BORDER_SIZE,
    canvas.height - BORDER_SIZE,
  );
}

function drawCaption(ctx: SKRSContext2D, canvas: any, caption: string) {
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";

  const qx = canvas.width / 2;
  const qy = canvas.height / 2;
  const qw = canvas.width / 2;
  const qh = canvas.height / 2;
  const maxWidth = qw - TEXT_PADDING * 2;
  const centerX = qx + qw / 2;

  const lines = wrapText(ctx, caption, maxWidth);
  const totalTextHeight = lines.length * (FONT_SIZE + 4);
  let y = qy + qh - totalTextHeight - TEXT_PADDING;

  for (const line of lines) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.strokeText(line, centerX, y, maxWidth);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, centerX, y, maxWidth);

    y += FONT_SIZE + 4;
  }
}

function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

async function saveCanvas(canvas: any): Promise<string> {
  const buffer = await canvas.encode("png");
  const outputPath = path.join(
    CACHE_DIR,
    `importantify-${crypto.randomUUID()}.png`,
  );
  await ensureDir(outputPath);
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}
