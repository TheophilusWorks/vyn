import {
  createCanvas,
  loadImage,
  Canvas,
  SKRSContext2D,
  GlobalFonts,
} from "@napi-rs/canvas";
import { writeFileSync } from "fs";
import { VynCommand } from "../../../core/command/VynCommand.js";
import { getHDProfilePicture } from "../../utils/getHDProfilePicture.js";
import path from "path";
import fs from "fs/promises";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import { fileExists } from "../../utils/fileExists.js";
import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import { ensureDir } from "../../utils/ensureDir.js";

export default new VynCommand({
  name: "quote",
  description: "Quotes someone's message in a stylish card",
  argsInfo: [
    {
      type: "replyable",
      name: "msg",
      description: "The message to quote",
      required: true,
    },
  ],

  execute: async (ctx) => {
    let msg = ctx.getReplyable("msg")!;
    let profilePic = getHDProfilePicture(msg.senderID);
    let senderInfo = await ctx.vyn.client.users.getInfo(msg.senderID);
    let senderName = senderInfo[msg.senderID].name ?? "Anonymous";
    let quoteText = msg.body;

    let outputPath = path.join(CACHE_DIR, `quote-${msg.messageID}.png`);
    await ensureDir(outputPath);
    try {
      await saveQuoteCard({
        baseImagePath: profilePic,
        username: senderName,
        quote: quoteText,
        outputPath,
      });

      ctx.reply({
        attachment: ConduitAttachmentBuilder.create().from(outputPath).build(),
      });
    } finally {
      if (await fileExists(outputPath)) fs.unlink(outputPath);
    }
  },
});

interface QuoteCardOptions {
  quote: string;
  username: string;
  baseImagePath: string;
  width?: number;
  height?: number;
  outputPath?: string;
}

interface TextMetrics {
  bottomY: number;
}

function createQuoteCanvas(
  width: number,
  height: number,
): {
  canvas: Canvas;
  ctx: SKRSContext2D;
} {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

function drawBackground(
  ctx: SKRSContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
}

function drawAvatarSection(
  ctx: SKRSContext2D,
  image: Awaited<ReturnType<typeof loadImage>>,
  avatarWidth: number,
  height: number,
): void {
  ctx.drawImage(image, 0, 0, avatarWidth, height);
}

function drawFadeOverlay(
  ctx: SKRSContext2D,
  avatarWidth: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const gradient = ctx.createLinearGradient(
    avatarWidth * 0.25,
    0,
    canvasWidth,
    0,
  );

  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.3, "rgba(0,0,0,0.9)");
  gradient.addColorStop(0.6, "rgba(0,0,0,0.98)");
  gradient.addColorStop(1, "rgba(0,0,0,1)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawWrappedText(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): TextMetrics {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + " ";

    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line.trimEnd(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim().length > 0) {
    ctx.fillText(line.trimEnd(), x, currentY);
  }

  return { bottomY: currentY };
}

function drawQuoteText(
  ctx: SKRSContext2D,
  quote: string,
  x: number,
  y: number,
  maxWidth: number,
): TextMetrics {
  ctx.fillStyle = "white";
  ctx.font = "bold 32px Inter";

  return drawWrappedText(ctx, `"${quote}"`, x, y, maxWidth, 42);
}

function drawUsername(
  ctx: SKRSContext2D,
  username: string,
  x: number,
  y: number,
): void {
  ctx.font = "20px Inter";
  ctx.fillStyle = "#cccccc";
  ctx.fillText(`— ${username}`, x, y);
}

async function generateQuoteCard(options: QuoteCardOptions): Promise<Buffer> {
  const { quote, username, baseImagePath, width = 854, height = 420 } = options;

  const { canvas, ctx } = createQuoteCanvas(width, height);
  const baseImg = await loadImage(baseImagePath);

  const AVATAR_WIDTH = width * 0.5;
  const padding = 50;
  const textX = AVATAR_WIDTH + padding;
  const textY = 140;
  const maxTextWidth = width - textX - padding;

  drawBackground(ctx, width, height);
  drawAvatarSection(ctx, baseImg, AVATAR_WIDTH, height);
  drawFadeOverlay(ctx, AVATAR_WIDTH, width, height);

  const { bottomY } = drawQuoteText(ctx, quote, textX, textY, maxTextWidth);
  drawUsername(ctx, username, textX, bottomY + 50);

  return canvas.toBuffer("image/png");
}

async function saveQuoteCard(options: QuoteCardOptions): Promise<void> {
  const { outputPath = "./output.png" } = options;
  const buffer = await generateQuoteCard(options);
  writeFileSync(outputPath, buffer);
}
