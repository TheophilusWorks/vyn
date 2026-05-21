import prettyMilliseconds from "pretty-ms";
import { VynCommand } from "../../../core/command/VynCommand.js";

export default new VynCommand({
  name: "ping",
  description: "Replies with Pong!",
  argsInfo: [
    { 
      type: "argument",
      name: "bet",
      description: "Bet amount to gamble with",
      required: true,
    },
    { 
      type: "mentionable",
      name: "opponent",
      description: "Opponent to gamble against",
      required: true,
    },
  ],

  execute: async (ctx) => {
    ctx.getArgument("be")

    await ctx.reply(
      `Pong! Latency: ${prettyMilliseconds(Date.now() + parseInt(ctx.timestamp))} Uptime: ${prettyMilliseconds(process.uptime() * 1000)}.`,
    );
  },
});
