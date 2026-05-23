import prettyMilliseconds from "pretty-ms";
import { VynCommand } from "../../../core/command/VynCommand.js";

export default new VynCommand({
  name: "ping",
  description: "Replies with Pong!",

  execute: async (ctx) => {
    await ctx.shareContact(
      `Pong! Latency: ${prettyMilliseconds(Math.abs(Date.now() - parseInt(ctx.timestamp)))} Uptime: ${prettyMilliseconds(process.uptime() * 1000)}.`,
      ctx.vyn.client.account.getCurrentUserID(),
    );
  },
});
