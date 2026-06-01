import { createCanvas, loadImage } from "@napi-rs/canvas";

export function createRenderer(size: number) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

export async function loadImages(...imagePaths: string[]) {
  return Promise.all(imagePaths.map((p)=>loadImage(p)));
}
