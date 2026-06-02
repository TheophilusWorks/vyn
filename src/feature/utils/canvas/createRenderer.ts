import { createCanvas, loadImage } from "@napi-rs/canvas";

export function createRenderer(w: number, h?: number) {
  const canvas = createCanvas(w, h ?? w);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

export async function loadImages(...imagePaths: string[]) {
  return Promise.all(imagePaths.map((p) => loadImage(p)));
}
