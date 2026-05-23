import { Silver } from "@theophilusdev/silver";

const VynMessageSchema = Silver.create()
    .register("header", (node) => `›  ${node.content}`)
    .register("subheader", (node) => `›  ${node.content} ──────────────`)
    .register("body", (node) => {
    if (Array.isArray(node.content)) {
        return node.content
            .map((line) => `  ›  ${line}`)
            .join("\n  ─────────────\n");
    }
    return `  ›  ${node.content}`;
})
    .register("footer", (node) => `  ·  ${node.content}`)
    .register("empty", () => "");

export default VynMessageSchema;
