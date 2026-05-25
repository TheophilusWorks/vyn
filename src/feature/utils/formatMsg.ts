import { RenderNode } from "@theophilusdev/silver";
import VynMessageSchema from "../../schema/silver/message";
import { MessageFormat } from "../../types";

export function formatMsg(format: MessageFormat): string {
  let buffer: RenderNode[] = [];

  buffer.push({ type: "header", content: format.header });
  buffer.push({ type: "subheader", content: format.subheader });
  buffer.push({ type: "empty" });
  buffer.push({
    type: "body",
    content: Array.isArray(format.body) ? format.body : [format.body],
  });
  buffer.push({ type: "empty" });
  buffer.push({ type: "empty" });

  if (Array.isArray(format.footer)) {
    for (const item of format.footer) {
      if (item.trim() === "") continue;
      buffer.push({ type: "footer", content: item });
    }
  } else {
    buffer.push({ type: "footer", content: format.footer });
  }

  return VynMessageSchema.render(buffer);
}
