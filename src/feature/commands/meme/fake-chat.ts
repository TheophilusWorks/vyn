import { createCanvas, loadImage, SKRSContext2D, Image } from "@napi-rs/canvas";
import { unlink, writeFile } from "fs/promises";
import { VynCommand } from "../../../core/command/VynCommand.js";
import path from "path";
import { CACHE_DIR } from "../../constants/CACHE_DIR.js";
import { ConduitAttachmentBuilder } from "@theophilusdev/conduit";
import { ensureDir } from "../../utils/ensureDir.js";
import { wrapText } from "../../utils/canvas/wrapText.js";
import { getHDProfilePicture } from "../../utils/getHDProfilePicture.js";
import { fileExists } from "../../utils/fileExists.js";

// ── constants ─────────────────────────────────────────
const CANVAS_WIDTH = 520;
const BASE_CANVAS_HEIGHT = 150;
const BG_COLOR = "#1a1a1a";

const AVATAR_SIZE = 50;
const AVATAR_X = 20;
const AVATAR_BOTTOM_MARGIN = 50;

const BUBBLE_COLOR = "#3a3a3a";
const BUBBLE_X_START = 85;
const BUBBLE_PADDING_X = 24;
const BUBBLE_PADDING_Y = 16;
const BUBBLE_RADIUS = 22;
const BUBBLE_MAX_WIDTH = CANVAS_WIDTH - BUBBLE_X_START - 20;

const TEXT_COLOR = "#ffffff";
const FONT_SIZE = 20;
const TEXT_BASELINE_OFFSET = 7;
const FONT = `${FONT_SIZE}px Montserrat`;
const LINE_HEIGHT = FONT_SIZE + 14;
const TEXT_MAX_WIDTH = BUBBLE_MAX_WIDTH - BUBBLE_PADDING_X * 2;

// ── command ───────────────────────────────────────────
export default new VynCommand({
  name: "fake-chat",
  description: "Generates a fake chat bubble",
  aliases: ["fchat", "fc"],
  argsInfo: [
    {
      type: "argument",
      name: "chat",
      description: "The message to display in the chat bubble",
      required: true,
    },
    {
      type: ["mentionable", "replyable"],
      name: "user",
      description: "The user to impersonate (defaults to you)",
    },
  ],

  execute: async (ctx) => {
    const chat = ctx.getArgument("chat")!;
    const targetID =
      ctx.getMentionable("user")?.id ??
      ctx.getReplyable("user")?.senderID ??
      ctx.senderID;

    const lines = measureLines(chat);
    const bubble = computeBubble(lines);
    const canvasHeight = computeCanvasHeight(bubble.height);

    const canvas = createCanvas(CANVAS_WIDTH, canvasHeight);
    const c = canvas.getContext("2d");

    drawBackground(c, canvasHeight);
    drawBubble(c, bubble, canvasHeight);
    drawText(c, lines, bubble, canvasHeight);

    const avatarImg = await loadImage(getHDProfilePicture(targetID));
    drawAvatar(c, avatarImg, canvasHeight);

    const outPath = path.join(CACHE_DIR, `fakechat-${crypto.randomUUID()}.png`);
    try {
      await ensureDir(outPath);
      await writeFile(outPath, await canvas.encode("png"));
      await ctx.reply({
        attachment: ConduitAttachmentBuilder.create().from(outPath).build(),
      });
    } finally {
      if (await fileExists(outPath)) unlink(outPath);
    }
  },
});

// ── measure ───────────────────────────────────────────
function measureLines(text: string): string[] {
  const temp = createCanvas(CANVAS_WIDTH, BASE_CANVAS_HEIGHT).getContext("2d");
  temp.font = FONT;
  return wrapText(temp, text, TEXT_MAX_WIDTH);
}

// ── compute ───────────────────────────────────────────
interface BubbleMetrics {
  x: number;
  width: number;
  height: number;
}

function computeBubble(lines: string[]): BubbleMetrics {
  const temp = createCanvas(CANVAS_WIDTH, BASE_CANVAS_HEIGHT).getContext("2d");
  temp.font = FONT;

  const contentWidth = Math.max(...lines.map((l) => temp.measureText(l).width));

  return {
    x: BUBBLE_X_START,
    width: contentWidth + BUBBLE_PADDING_X * 2,
    height: lines.length * LINE_HEIGHT + BUBBLE_PADDING_Y * 2,
  };
}

function computeCanvasHeight(bubbleHeight: number): number {
  const minHeight = AVATAR_SIZE + AVATAR_BOTTOM_MARGIN * 2;
  return Math.max(BASE_CANVAS_HEIGHT, bubbleHeight + 80, minHeight);
}

function computeBubbleY(bubbleHeight: number, canvasHeight: number): number {
  return canvasHeight / 2 - bubbleHeight / 2;
}

function computeAvatarY(canvasHeight: number): number {
  return canvasHeight - AVATAR_BOTTOM_MARGIN - AVATAR_SIZE;
}

// ── draw ──────────────────────────────────────────────
function drawBackground(c: SKRSContext2D, canvasHeight: number): void {
  c.fillStyle = BG_COLOR;
  c.fillRect(0, 0, CANVAS_WIDTH, canvasHeight);
}

function drawBubble(
  c: SKRSContext2D,
  bubble: BubbleMetrics,
  canvasHeight: number,
): void {
  const bubbleY = computeBubbleY(bubble.height, canvasHeight);
  c.fillStyle = BUBBLE_COLOR;
  c.beginPath();
  c.roundRect(bubble.x, bubbleY, bubble.width, bubble.height, BUBBLE_RADIUS);
  c.fill();
}

function drawText(
  c: SKRSContext2D,
  lines: string[],
  bubble: BubbleMetrics,
  canvasHeight: number,
): void {
  const bubbleY = computeBubbleY(bubble.height, canvasHeight);
  c.fillStyle = TEXT_COLOR;
  c.font = FONT;
  c.textBaseline = "top";

  lines.forEach((line, i) => {
    c.fillText(
      line,
      bubble.x + BUBBLE_PADDING_X,
      bubbleY + BUBBLE_PADDING_Y + TEXT_BASELINE_OFFSET + i * LINE_HEIGHT,
    );
  });
}

function drawAvatar(c: SKRSContext2D, img: Image, canvasHeight: number): void {
  const avatarY = computeAvatarY(canvasHeight);
  const r = AVATAR_SIZE / 2;

  c.save();
  c.beginPath();
  c.arc(AVATAR_X + r, avatarY + r, r, 0, Math.PI * 2);
  c.closePath();
  c.clip();
  c.drawImage(img, AVATAR_X, avatarY, AVATAR_SIZE, AVATAR_SIZE);
  c.restore();
}
